import "server-only";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

// A post is "live" (publicly visible) when it has a publish time in the past and
// a published/scheduled status. Using `lte: now` means scheduled posts go live
// automatically at their time — no cron needed.
export function liveWhere(): Prisma.PostWhereInput {
  return {
    status: { in: ["published", "scheduled"] },
    publishedAt: { not: null, lte: new Date() },
  };
}

const cardSelect = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  coverImage: true,
  coverAlt: true,
  coverWidth: true,
  coverHeight: true,
  publishedAt: true,
  readingTime: true,
  featured: true,
  author: { select: { id: true, name: true, avatar: true } },
  category: { select: { name: true, slug: true } },
} satisfies Prisma.PostSelect;

export type PostCardData = Prisma.PostGetPayload<{ select: typeof cardSelect }>;

export async function getLivePosts(opts: {
  take?: number;
  skip?: number;
  where?: Prisma.PostWhereInput;
} = {}) {
  return prisma.post.findMany({
    where: { ...liveWhere(), ...opts.where },
    orderBy: { publishedAt: "desc" },
    select: cardSelect,
    take: opts.take,
    skip: opts.skip,
  });
}

export async function countLivePosts(where?: Prisma.PostWhereInput) {
  return prisma.post.count({ where: { ...liveWhere(), ...where } });
}

export async function getPostBySlug(slug: string) {
  const post = await prisma.post.findFirst({
    where: { slug, ...liveWhere() },
    include: {
      author: true,
      category: true,
      tags: true,
    },
  });
  return post;
}

/** For static params / sitemap: all live slugs + timestamps. */
export async function getAllLiveSlugs() {
  return prisma.post.findMany({
    where: liveWhere(),
    select: { slug: true, updatedAt: true, publishedAt: true },
    orderBy: { publishedAt: "desc" },
  });
}

export async function getCategories() {
  return prisma.category.findMany({ orderBy: { name: "asc" } });
}
