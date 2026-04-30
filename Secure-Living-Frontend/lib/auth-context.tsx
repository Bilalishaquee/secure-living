"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import type { AuthUser, UserProfileFields, UserRole } from "@/types/auth";
import { AUTH_STORAGE_KEY } from "@/types/auth";
import {
  normalizeSessionRole,
  switchActiveRole,
} from "@/lib/profile-merge";

type AuthState = {
  user: AuthUser | null;
  hydrated: boolean;
};

type AuthAction =
  | { type: "SET_USER"; user: AuthUser | null }
  | { type: "HYDRATE"; user: AuthUser | null };

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "SET_USER":
      return { ...state, user: action.user };
    case "HYDRATE":
      return { user: action.user, hydrated: true };
    default:
      return state;
  }
}

function readStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed as AuthUser;
  } catch {
    return null;
  }
}

function persistUser(user: AuthUser | null) {
  if (typeof window === "undefined") return;
  if (user) localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  else localStorage.removeItem(AUTH_STORAGE_KEY);
}

function reconcileUserFromSeed(stored: AuthUser): AuthUser {
  return { ...stored, ...pickOverlayFromStored(stored) };
}

function pickOverlayFromStored(stored: AuthUser): Partial<AuthUser> {
  const keys: (keyof AuthUser)[] = [
    "name",
    "avatarUrl",
    "phone",
    "whatsappNumber",
    "city",
    "country",
    "timezone",
    "preferredCurrency",
    "preferredLanguage",
    "companyOrPortfolioName",
    "taxPin",
    "mailingAddress",
    "emergencyContactName",
    "emergencyContactPhone",
    "bio",
    "dateOfBirth",
    "nationalIdLast4",
  ];
  const out: Partial<AuthUser> = {};
  for (const k of keys) {
    const v = stored[k];
    if (v !== undefined && v !== "") out[k] = v as never;
  }
  return out;
}

type RegisterPayload = AuthUser & { password?: string; orgName?: string; orgCode?: string };

type AuthContextValue = {
  user: AuthUser | null;
  hydrated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  registerUser: (user: RegisterPayload) => Promise<boolean>;
  updateRole: (role: UserRole) => void;
  updateProfile: (patch: Partial<UserProfileFields> & { name?: string }) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    hydrated: false,
  });

  useEffect(() => {
    const raw = readStoredUser();
    const user = raw ? reconcileUserFromSeed(raw) : null;
    if (user && raw) persistUser(user);
    dispatch({ type: "HYDRATE", user });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch("/api/v1/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) return false;
    const json = (await res.json()) as { data: { token: string; user: AuthUser } };
    const nextUser = { ...json.data.user, authToken: json.data.token };
    persistUser(nextUser);
    dispatch({ type: "SET_USER", user: nextUser });
    return true;
  }, []);

  const logout = useCallback(() => {
    persistUser(null);
    dispatch({ type: "SET_USER", user: null });
  }, []);

  const registerUser = useCallback(async (user: RegisterPayload) => {
    const res = await fetch("/api/v1/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: user.email.trim().toLowerCase(),
        fullName: user.name,
        password: user.password,
        orgName: user.orgName || undefined,
        orgCode: user.orgCode || undefined,
      }),
    });
    if (!res.ok) return false;
    const json = (await res.json()) as { data: { token: string; user: AuthUser } };
    const nextUser = {
      ...json.data.user,
      role: normalizeSessionRole(json.data.user.role),
      authToken: json.data.token,
    };
    persistUser(nextUser);
    dispatch({ type: "SET_USER", user: nextUser });
    return true;
  }, []);

  const updateRole = useCallback((role: UserRole) => {
    const current = readStoredUser();
    if (!current) return;
    const next = switchActiveRole(current, role);
    if (!next) return;
    persistUser(next);
    dispatch({ type: "SET_USER", user: next });
  }, []);

  const updateProfile = useCallback(
    (patch: Partial<UserProfileFields> & { name?: string }) => {
      const current = readStoredUser();
      if (!current) return;
      const next = { ...current, ...patch };
      persistUser(next);
      dispatch({ type: "SET_USER", user: next });
    },
    []
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user: state.user,
      hydrated: state.hydrated,
      login,
      logout,
      registerUser,
      updateRole,
      updateProfile,
    }),
    [state.user, state.hydrated, login, logout, registerUser, updateRole, updateProfile]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
