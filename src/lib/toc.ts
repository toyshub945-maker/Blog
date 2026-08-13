import slugify from "slugify";

export type TocItem = { id: string; text: string; level: number };

/**
 * Add stable id anchors to <h2>/<h3> in the article HTML and return a
 * table-of-contents list. Content is authored by trusted admins.
 */
export function processArticleHtml(html: string): { html: string; toc: TocItem[] } {
  const toc: TocItem[] = [];
  const used = new Set<string>();

  const out = html.replace(
    /<h([23])([^>]*)>([\s\S]*?)<\/h\1>/gi,
    (_m, level: string, attrs: string, inner: string) => {
      const text = inner.replace(/<[^>]+>/g, "").trim();
      let id = slugify(text, { lower: true, strict: true }).slice(0, 60) || "section";
      let n = 1;
      while (used.has(id)) {
        n += 1;
        id = `${id}-${n}`;
      }
      used.add(id);
      toc.push({ id, text, level: Number(level) });
      return `<h${level}${attrs} id="${id}">${inner}</h${level}>`;
    }
  );

  return { html: out, toc };
}
