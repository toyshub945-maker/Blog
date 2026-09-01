import { getLivePosts } from "@/lib/queries";
import { getCategories } from "@/lib/queries";
import { absoluteUrl, siteConfig } from "@/lib/site";

// Built per request (see the note in sitemap.ts).
export const dynamic = "force-dynamic";

// llms.txt — a curated, machine-readable map of the site for AI answer engines
// (ChatGPT, Perplexity, Claude, Gemini). Uses each article's direct-answer block
// as a quotable summary. See https://llmstxt.org
export async function GET() {
  const [posts, categories] = await Promise.all([
    getLivePosts({ take: 30 }),
    getCategories(),
  ]);

  const lines: string[] = [];
  lines.push(`# ${siteConfig.name}`);
  lines.push("");
  lines.push(`> ${siteConfig.description}`);
  lines.push("");
  lines.push(
    `${siteConfig.name} publishes news and in-depth guides. Every article is server-rendered with structured data, a clear author, publication and update dates, and a concise summary. Content below is grouped by recency and topic.`
  );
  lines.push("");

  lines.push("## Latest articles");
  for (const p of posts) {
    const summary = (p.excerpt || "").replace(/\s+/g, " ").trim();
    lines.push(
      `- [${p.title}](${absoluteUrl(`/${p.slug}`)})${summary ? `: ${summary}` : ""}`
    );
  }
  lines.push("");

  if (categories.length) {
    lines.push("## Topics");
    for (const c of categories) {
      lines.push(
        `- [${c.name}](${absoluteUrl(`/category/${c.slug}`)})${
          c.description ? `: ${c.description}` : ""
        }`
      );
    }
    lines.push("");
  }

  lines.push("## Feeds");
  lines.push(`- [RSS feed](${absoluteUrl("/rss.xml")})`);
  lines.push(`- [Sitemap](${absoluteUrl("/sitemap.xml")})`);
  lines.push(`- [News sitemap](${absoluteUrl("/news-sitemap.xml")})`);
  lines.push("");

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
