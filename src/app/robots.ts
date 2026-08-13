import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";

// robots.txt — allow crawlers (including AI/GEO bots), block private areas,
// and point to both sitemaps.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api", "/login", "/search"],
      },
    ],
    sitemap: [`${siteConfig.url}/sitemap.xml`, `${siteConfig.url}/news-sitemap.xml`],
    host: siteConfig.url,
  };
}
