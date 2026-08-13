import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getLivePosts } from "@/lib/queries";
import { absoluteUrl } from "@/lib/site";
import PostCard from "@/components/site/PostCard";

export const revalidate = 60;

async function getTag(slug: string) {
  return prisma.tag.findUnique({ where: { slug } });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tag = await getTag(slug);
  if (!tag) return { title: "Not found" };
  const description = `Stories tagged ${tag.name}.`;
  return {
    title: `#${tag.name}`,
    description,
    alternates: { canonical: absoluteUrl(`/tag/${tag.slug}`) },
    openGraph: { title: `#${tag.name}`, description, type: "website" },
  };
}

export default async function TagPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tag = await getTag(slug);
  if (!tag) notFound();

  const posts = await getLivePosts({
    where: { tags: { some: { id: tag.id } } },
    take: 30,
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-8 border-b pb-6">
        <h1 className="font-serif text-4xl font-bold">#{tag.name}</h1>
      </header>

      {posts.length === 0 ? (
        <p className="text-muted-foreground">No stories with this tag yet.</p>
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
