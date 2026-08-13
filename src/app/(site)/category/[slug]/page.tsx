import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getLivePosts } from "@/lib/queries";
import { absoluteUrl } from "@/lib/site";
import PostCard from "@/components/site/PostCard";

export const revalidate = 60;

async function getCategory(slug: string) {
  return prisma.category.findUnique({ where: { slug } });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) return { title: "Not found" };
  const description = category.description || `Latest ${category.name} stories.`;
  return {
    title: category.name,
    description,
    alternates: { canonical: absoluteUrl(`/category/${category.slug}`) },
    openGraph: { title: category.name, description, type: "website" },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) notFound();

  const posts = await getLivePosts({ where: { categoryId: category.id }, take: 30 });

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-8 border-b pb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-accent">Category</p>
        <h1 className="mt-1 font-serif text-4xl font-bold">{category.name}</h1>
        {category.description && (
          <p className="mt-2 text-muted-foreground">{category.description}</p>
        )}
      </header>

      {posts.length === 0 ? (
        <p className="text-muted-foreground">No stories in this category yet.</p>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </main>
  );
}
