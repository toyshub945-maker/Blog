import { getLivePosts } from "@/lib/queries";
import { absoluteUrl, siteConfig } from "@/lib/site";

// Built per request (see the note in sitemap.ts).
export const dynamic = "force-dynamic";

function escapeXml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const posts = await getLivePosts({ take: 30 });
  const now = new Date().toUTCString();

  const items = posts
    .map((p) => {
      const link = absoluteUrl(`/${p.slug}`);
      return `    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <dc:creator>${escapeXml(p.author.name)}</dc:creator>
      <pubDate>${p.publishedAt?.toUTCString()}</pubDate>
      ${p.category ? `<category>${escapeXml(p.category.name)}</category>` : ""}
      <description>${escapeXml(p.excerpt || "")}</description>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteConfig.name)}</title>
    <link>${siteConfig.url}</link>
    <description>${escapeXml(siteConfig.description)}</description>
    <language>en</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${absoluteUrl("/rss.xml")}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
