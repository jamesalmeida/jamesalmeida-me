import type { MetadataRoute } from "next";
import { SITE } from "@/data/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE.url },
    { url: `${SITE.url}/consulting` },
    { url: `${SITE.url}/work` },
  ];
}
