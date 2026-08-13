import slugify from "slugify";
import readingTime from "reading-time";
import { prisma } from "@/lib/db";
import type { PostInput } from "@/lib/validators";

export function makeSlug(input: string): string {
  return slugify(input, { lower: true, strict: true, trim: true }).slice(0, 96);
}

/** Strip HTML tags to plain text (for reading time + meta fallbacks). */
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function readingTimeMinutes(html: string | null | undefined): number {
  if (!html) return 1;
  const text = stripHtml(html);
  return Math.max(1, Math.round(readingTime(text).minutes));
}

/**
 * Ensure a unique slug. If `base` is taken by a different post, append -2, -3, …
 */
export async function uniqueSlug(base: string, excludePostId?: string): Promise<string> {
  const root = makeSlug(base) || "post";
  let candidate = root;
  let n = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await prisma.post.findUnique({ where: { slug: candidate } });
    if (!existing || existing.id === excludePostId) return candidate;
    n += 1;
    candidate = `${root}-${n}`;
  }
}

/** Turn a list of tag names into a Prisma connect array, creating missing tags. */
export async function connectTags(names: string[]) {
  const clean = Array.from(
    new Set(names.map((n) => n.trim()).filter(Boolean))
  ).slice(0, 20);

  const ids: { id: string }[] = [];
  for (const name of clean) {
    const slug = makeSlug(name);
    if (!slug) continue;
    const tag = await prisma.tag.upsert({
      where: { slug },
      update: { name },
      create: { name, slug },
    });
    ids.push({ id: tag.id });
  }
  return ids;
}

/**
 * Build the Prisma scalar data + resolved tag ids from validated editor input.
 * Shared by the create and update routes.
 */
export async function buildPostData(
  input: PostInput,
  opts: { excludePostId?: string } = {}
) {
  const slug = await uniqueSlug(input.slug?.trim() || input.title, opts.excludePostId);
  const bodyHtml = input.bodyHtml ?? null;

  let publishedAt: Date | null = null;
  if (input.status === "published") {
    publishedAt = input.publishedAt ? new Date(input.publishedAt) : new Date();
  } else if (input.status === "scheduled") {
    publishedAt = input.publishedAt ? new Date(input.publishedAt) : null;
  }

  const tags = await connectTags(input.tags ?? []);

  const data = {
    title: input.title.trim(),
    slug,
    excerpt: input.excerpt?.trim() || null,
    answerBlock: input.answerBlock?.trim() || null,
    bodyJson: input.bodyJson ? JSON.stringify(input.bodyJson) : null,
    bodyHtml,
    coverImage: input.coverImage || null,
    coverAlt: input.coverAlt?.trim() || null,
    coverWidth: input.coverWidth || null,
    coverHeight: input.coverHeight || null,
    status: input.status,
    featured: !!input.featured,
    publishedAt,
    readingTime: readingTimeMinutes(bodyHtml),
    metaTitle: input.metaTitle?.trim() || null,
    metaDescription: input.metaDescription?.trim() || null,
    canonicalUrl: input.canonicalUrl?.trim() || null,
    focusKeyword: input.focusKeyword?.trim() || null,
    faq: input.faq && input.faq.length ? JSON.stringify(input.faq) : null,
    categoryId: input.categoryId || null,
  };

  return { data, tags };
}
