import type { Metadata } from "next";
import type { Post, User, Category, Tag } from "@prisma/client";
import { siteConfig, absoluteUrl } from "@/lib/site";

export type FullPost = Post & {
  author: User;
  category: Category | null;
  tags: Tag[];
};

function metaDescriptionFor(post: FullPost): string {
  return (post.metaDescription || post.excerpt || post.answerBlock || post.title).slice(0, 300);
}

/** Per-article <head> metadata (title, description, canonical, OG, Twitter). */
export function buildArticleMetadata(post: FullPost): Metadata {
  const url = absoluteUrl(`/${post.slug}`);
  const description = metaDescriptionFor(post);
  const images = post.coverImage
    ? [{ url: post.coverImage, width: post.coverWidth ?? undefined, height: post.coverHeight ?? undefined, alt: post.coverAlt || post.title }]
    : [];

  return {
    title: post.metaTitle || post.title,
    description,
    alternates: { canonical: post.canonicalUrl || url },
    openGraph: {
      type: "article",
      url,
      title: post.metaTitle || post.title,
      description,
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      authors: [post.author.name],
      section: post.category?.name,
      tags: post.tags.map((t) => t.name),
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: post.metaTitle || post.title,
      description,
      images: images.map((i) => i.url),
    },
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    logo: absoluteUrl("/icon.png"),
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteConfig.url}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}

export function articleJsonLd(post: FullPost) {
  const url = absoluteUrl(`/${post.slug}`);
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: post.title,
    description: metaDescriptionFor(post),
    image: post.coverImage ? [post.coverImage] : undefined,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: {
      "@type": "Person",
      name: post.author.name,
      url: absoluteUrl(`/author/${post.author.id}`),
    },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      logo: { "@type": "ImageObject", url: absoluteUrl("/icon.png") },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": post.canonicalUrl || url },
    articleSection: post.category?.name,
    keywords: post.tags.map((t) => t.name).join(", ") || undefined,
    wordCount: post.readingTime ? post.readingTime * 200 : undefined,
  };
}

export function faqJsonLd(faq: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}
