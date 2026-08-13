import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import PostEditor, { type EditorPost } from "@/components/admin/PostEditor";

export const dynamic = "force-dynamic";

type FaqItem = { q: string; a: string };

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [post, categories] = await Promise.all([
    prisma.post.findUnique({ where: { id }, include: { tags: true } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!post) notFound();

  let bodyJson: object | null = null;
  if (post.bodyJson) {
    try {
      bodyJson = JSON.parse(post.bodyJson);
    } catch {
      bodyJson = null;
    }
  }

  let faq: FaqItem[] = [];
  if (post.faq) {
    try {
      faq = JSON.parse(post.faq);
    } catch {
      faq = [];
    }
  }

  const initial: EditorPost = {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt || "",
    answerBlock: post.answerBlock || "",
    bodyJson,
    bodyHtml: post.bodyHtml || "",
    coverImage: post.coverImage || "",
    coverAlt: post.coverAlt || "",
    coverWidth: post.coverWidth,
    coverHeight: post.coverHeight,
    status: post.status,
    featured: post.featured,
    publishedAt: post.publishedAt ? post.publishedAt.toISOString() : null,
    metaTitle: post.metaTitle || "",
    metaDescription: post.metaDescription || "",
    canonicalUrl: post.canonicalUrl || "",
    focusKeyword: post.focusKeyword || "",
    faq,
    categoryId: post.categoryId || "",
    tags: post.tags.map((t) => t.name).join(", "),
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-muted-foreground">Edit post</h1>
        {post.status === "published" && (
          <a
            href={`/${post.slug}`}
            target="_blank"
            className="text-sm text-accent hover:underline"
          >
            View live ↗
          </a>
        )}
      </div>
      <PostEditor
        initial={initial}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      />
    </div>
  );
}
