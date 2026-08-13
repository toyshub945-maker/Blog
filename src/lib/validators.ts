import { z } from "zod";

export const faqItemSchema = z.object({
  q: z.string().min(1),
  a: z.string().min(1),
});

export const postInputSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().optional(),
  excerpt: z.string().optional().nullable(),
  answerBlock: z.string().optional().nullable(),
  bodyJson: z.any().optional(),
  bodyHtml: z.string().optional().nullable(),
  coverImage: z.string().optional().nullable(),
  coverAlt: z.string().optional().nullable(),
  coverWidth: z.number().int().positive().optional().nullable(),
  coverHeight: z.number().int().positive().optional().nullable(),
  status: z.enum(["draft", "scheduled", "published"]).default("draft"),
  featured: z.boolean().optional().default(false),
  publishedAt: z.string().optional().nullable(),
  metaTitle: z.string().optional().nullable(),
  metaDescription: z.string().optional().nullable(),
  canonicalUrl: z.string().optional().nullable(),
  focusKeyword: z.string().optional().nullable(),
  faq: z.array(faqItemSchema).optional().default([]),
  categoryId: z.string().optional().nullable(),
  tags: z.array(z.string()).optional().default([]),
});

export type PostInput = z.infer<typeof postInputSchema>;
