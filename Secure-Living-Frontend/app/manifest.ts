import type { MetadataRoute } from "next";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site-config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#F8FAFC",
    theme_color: "#1A56DB",
    icons: [
      {
        src: "/l1.png",
        sizes: "435x433",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/l1.png",
        sizes: "435x433",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
