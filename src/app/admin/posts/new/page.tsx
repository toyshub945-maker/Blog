import { prisma } from "@/lib/db";
import PostEditor, { type EditorPost } from "@/components/admin/PostEditor";

export const dynamic = "force-dynamic";

const empty: EditorPost = {
  title: "",
  slug: "",
  excerpt: "",
  answerBlock: "",
  bodyJson: null,
  bodyHtml: "",
  coverImage: "",
  coverAlt: "",
  coverWidth: null,
  coverHeight: null,
  status: "draft",
  featured: false,
  publishedAt: null,
  metaTitle: "",
  metaDescription: "",
  canonicalUrl: "",
  focusKeyword: "",
  faq: [],
  categoryId: "",
  tags: "",
};

export default async function NewPostPage() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  return (
    <div>
      <h1 className="mb-6 text-lg font-semibold text-muted-foreground">New post</h1>
      <PostEditor
        initial={empty}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      />
    </div>
  );
}
