import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getLivePosts } from "@/lib/queries";
import { absoluteUrl } from "@/lib/site";
import PostCard from "@/components/site/PostCard";
import JsonLd from "@/components/JsonLd";

export const revalidate = 60;

async function getAuthor(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const author = await getAuthor(id);
  if (!author) return { title: "Not found" };
  const description = author.bio || `Articles by ${author.name}.`;
  return {
    title: author.name,
    description,
    alternates: { canonical: absoluteUrl(`/author/${author.id}`) },
    openGraph: { title: author.name, description, type: "profile" },
  };
}

export default async function AuthorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const author = await getAuthor(id);
  if (!author) notFound();

  const posts = await getLivePosts({ where: { authorId: author.id }, take: 30 });

  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: author.name,
    description: author.bio || undefined,
    url: absoluteUrl(`/author/${author.id}`),
    image: author.avatar || undefined,
    sameAs: [author.twitter, author.linkedin, author.website].filter(Boolean),
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <JsonLd data={personJsonLd} />

      <header className="mb-10 border-b pb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-accent">Author</p>
        <h1 className="mt-1 font-serif text-4xl font-bold">{author.name}</h1>
        {author.bio && <p className="mt-2 max-w-2xl text-muted-foreground">{author.bio}</p>}
      </header>

      {posts.length === 0 ? (
        <p className="text-muted-foreground">No published stories yet.</p>
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
