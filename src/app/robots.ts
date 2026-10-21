import type { MetadataRoute } from "next";

const SITE = process.env.NEXT_PUBLIC_APP_URL ?? "https://salesforcesaver.com";

/** Signed-in pages and API routes have nothing for search engines. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/auth/", "/dashboard", "/orgs/", "/settings", "/welcome", "/share/", "/invite/"] },
    sitemap: `${SITE}/sitemap.xml`,
  };
}
