import slugify from "slugify";

// Client-safe slug generator (mirrors makeSlug in lib/posts.ts, which is
// server-only because it also touches the database).
export function makeSlug(input: string): string {
  return slugify(input, { lower: true, strict: true, trim: true }).slice(0, 96);
}
