import type { MetadataRoute } from "next";
import { getModules } from "@/lib/content";
import { SITE_URL } from "@/lib/url";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE_URL}/plain`, changeFrequency: "monthly", priority: 0.8 },
    ...getModules().map((m) => ({ url: `${SITE_URL}/modules/${m.slug}`, changeFrequency: "monthly" as const, priority: 0.7 })),
  ];
}
