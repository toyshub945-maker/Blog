import { prisma } from "@/lib/db";
import { liveWhere } from "@/lib/queries";
import { absoluteUrl, siteConfig } from "@/lib/site";

// Built per request — this feed is a rolling 48-hour window, so it must never
// be served from a build-time snapshot.
export const dynamic = "force-dynamic";

function escapeXml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Google News sitemap: articles published in the last 48 hours.
export async function GET() {
  const since = new Date(Date.now() - 48 * 60 * 60 * 1000);
  const posts = await prisma.post.findMany({
    where: { ...liveWhere(), publishedAt: { not: null, lte: new Date(), gte: since } },
    orderBy: { publishedAt: "desc" },
    select: { slug: true, title: true, publishedAt: true },
    take: 1000,
  });

  const urls = posts
    .map(
      (p) => `  <url>
    <loc>${absoluteUrl(`/${p.slug}`)}</loc>
    <news:news>
      <news:publication>
        <news:name>${escapeXml(siteConfig.name)}</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${p.publishedAt?.toISOString()}</news:publication_date>
      <news:title>${escapeXml(p.title)}</news:title>
    </news:news>
  </url>`
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urls}
</urlset>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
