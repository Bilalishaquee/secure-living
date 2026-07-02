"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";

type FeatureFlag = {
  id: string;
  key: string;
  label: string;
  isEnabled: boolean;
};

type FeatureFlagContextValue = {
  isEnabled: (key: string, fallback?: boolean) => boolean;
  loaded: boolean;
};

const FeatureFlagContext = createContext<FeatureFlagContextValue>({
  isEnabled: (_key, fallback = true) => fallback,
  loaded: false,
});

export function FeatureFlagProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [flags, setFlags] = useState<Map<string, boolean>>(new Map());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user?.authToken) return;
    let cancelled = false;
    fetch(`/api/v1/feature-flags`, { headers: { Authorization: `Bearer ${user.authToken}` } })
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((j: { data?: FeatureFlag[] }) => {
        if (cancelled) return;
        setFlags(new Map((j.data ?? []).map((f) => [f.key, f.isEnabled])));
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
    return () => { cancelled = true; };
  }, [user?.authToken]);

  function isEnabled(key: string, fallback = true): boolean {
    if (!flags.has(key)) return fallback;
    return flags.get(key)!;
  }

  return (
    <FeatureFlagContext.Provider value={{ isEnabled, loaded }}>
      {children}
    </FeatureFlagContext.Provider>
  );
}

export function useFeatureFlag(key: string, fallback = true): boolean {
  const { isEnabled } = useContext(FeatureFlagContext);
  return isEnabled(key, fallback);
}

export function useFeatureFlags() {
  return useContext(FeatureFlagContext);
}
