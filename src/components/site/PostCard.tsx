import Link from "next/link";
import Image from "next/image";
import type { PostCardData } from "@/lib/queries";
import { formatDate } from "@/lib/format";

export default function PostCard({
  post,
  priority = false,
}: {
  post: PostCardData;
  priority?: boolean;
}) {
  return (
    <article className="group flex flex-col">
      <Link
        href={`/${post.slug}`}
        className="relative block aspect-video w-full overflow-hidden rounded-xl bg-muted"
      >
        {post.coverImage ? (
          <Image
            src={post.coverImage}
            alt={post.coverAlt || post.title}
            fill
            sizes="(max-width: 768px) 100vw, 400px"
            className="object-cover transition duration-300 group-hover:scale-[1.03]"
            priority={priority}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            {post.title.slice(0, 1)}
          </div>
        )}
      </Link>

      <div className="mt-3 flex flex-1 flex-col">
        {post.category && (
          <Link
            href={`/category/${post.category.slug}`}
            className="text-xs font-semibold uppercase tracking-wide text-accent"
          >
            {post.category.name}
          </Link>
        )}
        <h3 className="mt-1 font-serif text-lg font-semibold leading-snug">
          <Link href={`/${post.slug}`} className="transition hover:text-accent">
            {post.title}
          </Link>
        </h3>
        {post.excerpt && (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{post.excerpt}</p>
        )}
        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <Link href={`/author/${post.author.id}`} className="hover:text-foreground">
            {post.author.name}
          </Link>
          <span aria-hidden>·</span>
          <time dateTime={post.publishedAt?.toISOString()}>{formatDate(post.publishedAt)}</time>
          {post.readingTime ? (
            <>
              <span aria-hidden>·</span>
              <span>{post.readingTime} min read</span>
            </>
          ) : null}
        </div>
      </div>
    </article>
  );
}
