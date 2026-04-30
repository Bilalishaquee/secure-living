import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-config";

/** App and auth routes are not meant for search indexing; marketing home is allowed. */
export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard",
        "/admin/",
        "/properties/",
        "/tenants",
        "/transactions",
        "/settings",
        "/kyc",
        "/services",
        "/auth/",
      ],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
