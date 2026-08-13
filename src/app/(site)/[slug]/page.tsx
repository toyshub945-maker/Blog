import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getPostBySlug, getLivePosts, liveWhere } from "@/lib/queries";
import { formatDate } from "@/lib/format";
import { processArticleHtml } from "@/lib/toc";
import {
  buildArticleMetadata,
  articleJsonLd,
  breadcrumbJsonLd,
  faqJsonLd,
  type FullPost,
} from "@/lib/seo";
import { absoluteUrl } from "@/lib/site";
import JsonLd from "@/components/JsonLd";
import PostCard from "@/components/site/PostCard";
import AdSlot from "@/components/site/AdSlot";
import ShareButtons from "@/components/site/ShareButtons";

export const revalidate = 60; // ISR: fast static pages, refreshed every minute

export async function generateStaticParams() {
  const posts = await prisma.post.findMany({
    where: liveWhere(),
    select: { slug: true },
    take: 100,
  });
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Not found" };
  return buildArticleMetadata(post as FullPost);
}

type FaqItem = { q: string; a: string };

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = (await getPostBySlug(slug)) as FullPost | null;
  if (!post) notFound();

  const { html, toc } = processArticleHtml(post.bodyHtml || "");

  let faq: FaqItem[] = [];
  if (post.faq) {
    try {
      faq = JSON.parse(post.faq);
    } catch {
      faq = [];
    }
  }

  // Related: same category, else latest.
  const related = await getLivePosts({
    take: 3,
    where: {
      id: { not: post.id },
      ...(post.categoryId ? { categoryId: post.categoryId } : {}),
    },
  });

  const url = absoluteUrl(`/${post.slug}`);

  const jsonLd: object[] = [
    articleJsonLd(post),
    breadcrumbJsonLd([
      { name: "Home", url: absoluteUrl("/") },
      ...(post.category
        ? [{ name: post.category.name, url: absoluteUrl(`/category/${post.category.slug}`) }]
        : []),
      { name: post.title, url },
    ]),
    ...(faq.length ? [faqJsonLd(faq)] : []),
  ];

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <JsonLd data={jsonLd} />

      {/* Breadcrumb */}
      <nav className="mb-4 text-sm text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        {post.category && (
          <>
            <span className="mx-1.5">/</span>
            <Link href={`/category/${post.category.slug}`} className="hover:text-foreground">
              {post.category.name}
            </Link>
          </>
        )}
      </nav>

      <article>
        <header className="mb-6">
          {post.category && (
            <Link
              href={`/category/${post.category.slug}`}
              className="text-xs font-semibold uppercase tracking-wide text-accent"
            >
              {post.category.name}
            </Link>
          )}
          <h1 className="mt-2 font-serif text-4xl font-bold leading-tight">{post.title}</h1>
          {post.excerpt && (
            <p className="mt-3 text-lg text-muted-foreground">{post.excerpt}</p>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Link href={`/author/${post.author.id}`} className="font-medium hover:text-foreground">
              {post.author.name}
            </Link>
            <span aria-hidden>·</span>
            <time dateTime={post.publishedAt?.toISOString()}>
              {formatDate(post.publishedAt)}
            </time>
            {post.readingTime ? <span>· {post.readingTime} min read</span> : null}
          </div>
        </header>

        {post.coverImage && (
          <figure className="mb-8">
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-muted">
              <Image
                src={post.coverImage}
                alt={post.coverAlt || post.title}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 768px"
                className="object-cover"
              />
            </div>
            {post.coverAlt && (
              <figcaption className="mt-2 text-center text-xs text-muted-foreground">
                {post.coverAlt}
              </figcaption>
            )}
          </figure>
        )}

        {/* Direct-answer block (GEO) — quotable summary */}
        {post.answerBlock && (
          <div className="mb-8 rounded-xl border-l-4 border-accent bg-muted/50 p-4">
            <p className="text-[15px] leading-relaxed">{post.answerBlock}</p>
          </div>
        )}

        {/* Table of contents */}
        {toc.length >= 3 && (
          <nav className="mb-8 rounded-xl border bg-card p-4" aria-label="Table of contents">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              In this article
            </p>
            <ul className="space-y-1 text-sm">
              {toc.map((item) => (
                <li key={item.id} className={item.level === 3 ? "ml-4" : ""}>
                  <a href={`#${item.id}`} className="text-muted-foreground hover:text-accent">
                    {item.text}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}

        {/* Body */}
        <div
          className="prose prose-lg dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        {/* In-article ad */}
        <div className="my-10">
          <AdSlot slot="" />
        </div>

        {/* FAQ */}
        {faq.length > 0 && (
          <section className="mt-10">
            <h2 className="font-serif text-2xl font-bold">Frequently asked questions</h2>
            <div className="mt-4 divide-y">
              {faq.map((f, i) => (
                <details key={i} className="group py-3">
                  <summary className="cursor-pointer font-medium">{f.q}</summary>
                  <p className="mt-2 text-muted-foreground">{f.a}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-2">
            {post.tags.map((t) => (
              <Link
                key={t.id}
                href={`/tag/${t.slug}`}
                className="inline-flex min-h-[40px] items-center rounded-full bg-muted px-4 py-2 text-sm text-muted-foreground transition hover:text-foreground"
              >
                #{t.name}
              </Link>
            ))}
          </div>
        )}

        {/* Share + author */}
        <div className="mt-8 border-t pt-6">
          <ShareButtons url={url} title={post.title} />
        </div>

        <div className="mt-6 rounded-xl border bg-card p-5">
          <p className="text-sm font-semibold">{post.author.name}</p>
          {post.author.bio && (
            <p className="mt-1 text-sm text-muted-foreground">{post.author.bio}</p>
          )}
          <Link
            href={`/author/${post.author.id}`}
            className="mt-2 inline-block text-sm text-accent hover:underline"
          >
            More from {post.author.name} →
          </Link>
        </div>
      </article>

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-6 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Related stories
          </h2>
          <div className="grid gap-8 sm:grid-cols-3">
            {related.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
