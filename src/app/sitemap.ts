import type { MetadataRoute } from "next";
import { aboutReady } from "@/lib/about";
import { GUIDES } from "@/lib/guides";

const SITE = process.env.NEXT_PUBLIC_APP_URL ?? "https://salesforcesaver.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE}/guides`, changeFrequency: "weekly", priority: 0.8 },
    ...GUIDES.map((g) => ({
      url: `${SITE}/guides/${g.slug}`,
      lastModified: new Date(g.updated),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...(aboutReady() ? [{ url: `${SITE}/about`, changeFrequency: "monthly" as const, priority: 0.5 }] : []),
    { url: `${SITE}/security`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE}/terms`, changeFrequency: "yearly", priority: 0.3 },
  ];
}
