// Central site configuration, read from env with sensible fallbacks.
// Used by metadata, sitemaps, RSS, JSON-LD, OG images.

export const siteConfig = {
  name: process.env.NEXT_PUBLIC_SITE_NAME || "Newsroom",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, ""),
  description:
    "Fast, trustworthy reporting and in-depth guides — built for Google Search, Google Discover, and AI answer engines.",
  // Default social handles / org info — edit these for your brand.
  twitter: "@newsroom",
  locale: "en_US",
  adsenseClient: process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "",
};

export function absoluteUrl(path = "/") {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${siteConfig.url}${p}`;
}
