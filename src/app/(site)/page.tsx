import Link from "next/link";
import Image from "next/image";
import { getLivePosts, type PostCardData } from "@/lib/queries";
import PostCard from "@/components/site/PostCard";
import JsonLd from "@/components/JsonLd";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo";
import { formatDate } from "@/lib/format";

export const revalidate = 60; // ISR — fast cached homepage, refreshed every minute

function Hero({ post }: { post: PostCardData }) {
  return (
    <section className="mb-12">
      <Link
        href={`/${post.slug}`}
        className="group grid gap-6 md:grid-cols-2 md:items-center"
      >
        <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-muted">
          {post.coverImage && (
            <Image
              src={post.coverImage}
              alt={post.coverAlt || post.title}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 600px"
              className="object-cover transition duration-300 group-hover:scale-[1.02]"
            />
          )}
        </div>
        <div>
          {post.category && (
            <span className="text-xs font-semibold uppercase tracking-wide text-accent">
              {post.category.name}
            </span>
          )}
          <h1 className="mt-2 font-serif text-3xl font-bold leading-tight sm:text-4xl">
            {post.title}
          </h1>
          {post.excerpt && (
            <p className="mt-3 text-muted-foreground">{post.excerpt}</p>
          )}
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <span>{post.author.name}</span>
            <span aria-hidden>·</span>
            <time dateTime={post.publishedAt?.toISOString()}>
              {formatDate(post.publishedAt)}
            </time>
            {post.readingTime ? <span>· {post.readingTime} min read</span> : null}
          </div>
        </div>
      </Link>
    </section>
  );
}

export default async function HomePage() {
  const posts = await getLivePosts({ take: 13 });

  if (posts.length === 0) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-20 text-center">
        <h1 className="text-2xl font-semibold">No stories published yet.</h1>
        <p className="mt-2 text-muted-foreground">Check back soon.</p>
      </main>
    );
  }

  // Prefer a featured post for the hero; otherwise the latest.
  const hero = posts.find((p) => p.featured) ?? posts[0];
  const rest = posts.filter((p) => p.id !== hero.id).slice(0, 12);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
      <Hero post={hero} />

      {rest.length > 0 && (
        <>
          <h2 className="mb-6 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Latest stories
          </h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </>
      )}
    </main>
  );
}
