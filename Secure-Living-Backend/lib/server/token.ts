import { createHmac, timingSafeEqual } from "crypto";

const AUTH_SECRET = process.env.APP_AUTH_SECRET ?? "dev-only-secret-change-me";

export type AuthTokenClaims = {
  userId: string;
  email: string;
  role: string;
  permissions: string[];
  branchIds: string[];
  orgIds: string[];
  exp: number;
};

function toBase64Url(input: string): string {
  return Buffer.from(input, "utf8").toString("base64url");
}

function sign(payload: string): string {
  return createHmac("sha256", AUTH_SECRET).update(payload).digest("base64url");
}

export function createAuthToken(claims: AuthTokenClaims): string {
  const encoded = toBase64Url(JSON.stringify(claims));
  return `${encoded}.${sign(encoded)}`;
}

export function parseAuthToken(token: string): AuthTokenClaims | null {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;
  const expected = sign(encoded);
  const sigBuf = Buffer.from(signature, "utf8");
  const expBuf = Buffer.from(expected, "utf8");
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) return null;
  try {
    const decoded = Buffer.from(encoded, "base64url").toString("utf8");
    const claims = JSON.parse(decoded) as AuthTokenClaims;
    if (!claims.exp || claims.exp < Date.now()) return null;
    return claims;
  } catch {
    return null;
  }
}
