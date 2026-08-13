import type { Metadata } from "next";
import { getLivePosts } from "@/lib/queries";
import PostCard from "@/components/site/PostCard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Search",
  // Search result pages should not be indexed.
  robots: { index: false, follow: true },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q || "").trim();

  const posts = query
    ? await getLivePosts({
        take: 40,
        where: {
          OR: [
            { title: { contains: query } },
            { excerpt: { contains: query } },
            { bodyHtml: { contains: query } },
          ],
        },
      })
    : [];

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <form action="/search" method="get" className="mb-8">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Search articles…"
          aria-label="Search articles"
          autoFocus
          className="w-full rounded-full border bg-card px-5 py-3 outline-none focus:ring-2 focus:ring-ring"
        />
      </form>

      {query ? (
        <>
          <p className="mb-6 text-sm text-muted-foreground">
            {posts.length} result{posts.length === 1 ? "" : "s"} for &ldquo;{query}&rdquo;
          </p>
          {posts.length > 0 ? (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">
              No stories matched. Try a different search.
            </p>
          )}
        </>
      ) : (
        <p className="text-muted-foreground">Type something to search the archive.</p>
      )}
    </main>
  );
}
