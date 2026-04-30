import type { MetadataRoute } from "next";
import { mockListings } from "@/lib/mock-data";
import { getSiteUrl } from "@/lib/site-config";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  const now = new Date();
  const listingUrls: MetadataRoute.Sitemap = mockListings.map((l) => ({
    url: `${base}/listings/${l.id}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));
  return [
    {
      url: base,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${base}/listings`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.95,
    },
    ...listingUrls,
  ];
}
