/**
 * Canonical site URL for sitemap, robots, and Open Graph.
 * Set NEXT_PUBLIC_SITE_URL in production (e.g. https://yourdomain.com).
 */
export function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export const SITE_NAME = "Secure Living";
export const SITE_DESCRIPTION =
  "Find verified and secure homes in Kenya. No scams — verified listings only. Escrow-backed transactions, screened agents, and end-to-end support from consult to sale.";
