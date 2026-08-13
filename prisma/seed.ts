import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // --- Admin user ---
  const email = "admin@blog.local";
  const password = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: "Editor in Chief",
      password,
      role: "admin",
      bio: "Founding editor. Covering the stories that matter, fast.",
    },
  });

  // --- Categories ---
  const news = await prisma.category.upsert({
    where: { slug: "news" },
    update: {},
    create: { name: "News", slug: "news", description: "Breaking and trending stories." },
  });
  await prisma.category.upsert({
    where: { slug: "guides" },
    update: {},
    create: { name: "Guides", slug: "guides", description: "In-depth explainers and how-tos." },
  });

  // --- Tags ---
  const tagTrending = await prisma.tag.upsert({
    where: { slug: "trending" },
    update: {},
    create: { name: "Trending", slug: "trending" },
  });

  // --- Sample published post ---
  const sampleHtml = `
    <p>This is a sample article created by the seed script so your homepage and
    article pages have something to render on first run. Delete it from the admin
    once you publish your own.</p>
    <h2>Why this platform is built for reach</h2>
    <p>Every page is server-rendered so Google and AI assistants see the full
    text instantly. Big cover images, clean URLs, structured data, sitemaps, RSS,
    and an <code>llms.txt</code> file are all generated automatically.</p>
  `.trim();

  await prisma.post.upsert({
    where: { slug: "welcome-to-your-newsroom" },
    update: {},
    create: {
      title: "Welcome to your newsroom",
      slug: "welcome-to-your-newsroom",
      excerpt:
        "A sample post to show how articles look. It is fully server-rendered, SEO-complete, and ready for Google Discover and AI answer engines.",
      answerBlock:
        "This publishing platform renders every article on the server with structured data, large images, sitemaps, RSS, and an llms.txt file — so it is optimized for Google Search, Google Discover, and AI answer engines out of the box.",
      bodyHtml: sampleHtml,
      bodyJson: JSON.stringify({ type: "doc", content: [] }),
      coverImage:
        "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1600&q=80",
      coverAlt: "Newspapers stacked on a table",
      coverWidth: 1600,
      coverHeight: 900,
      status: "published",
      featured: true,
      publishedAt: new Date(),
      readingTime: 2,
      metaTitle: "Welcome to your newsroom",
      metaDescription:
        "A sample post showing the SEO, Discover, and AI-friendly article layout.",
      authorId: admin.id,
      categoryId: news.id,
      tags: { connect: [{ id: tagTrending.id }] },
    },
  });

  console.log("Seed complete. Admin login: admin@blog.local / admin123");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
