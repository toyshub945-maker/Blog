# Newsroom — SEO / Discover / AI-GEO publishing platform

A Medium-style publishing site: a private **admin panel** for writing and
publishing articles, and a fast public **blog** engineered for **Google Search**,
**Google Discover**, and **AI answer engines** (ChatGPT, Perplexity, Claude,
Gemini).

Built with **Next.js 16** (App Router, one app serves the site + admin + API),
**Prisma** + **SQLite** (dev) / **Postgres** (prod), and **Tiptap** for editing.

---

## Quick start (local)

```bash
npm install
npx prisma migrate dev      # creates the SQLite dev database
npm run db:seed             # seeds an admin user + sample content
npm run dev                 # http://localhost:3000
```

**Admin login:** `admin@blog.local` / `admin123` → sign in at `/login`, then
you land on `/admin`.

> Change the admin email/password in `prisma/seed.ts` before real use, or create
> new users directly in the database.

---

## What's built in

### Writing (admin, at `/admin`)
- Rich Tiptap editor: headings, formatting, lists, quotes, links, drag-drop images.
- **Cover image** upload with an automatic **≥1200px / 16:9** check (Discover rule).
- **Direct-answer block** (40–60 words) — the quotable summary AI engines cite.
- **FAQ blocks** → rendered as an FAQ section **and** FAQPage structured data.
- **SEO panel**: meta title/description, canonical, focus keyword.
- **Live SEO & Discover checklist** that scores each post as you write.
- Draft / **schedule** / publish. Scheduled posts go live automatically at their
  time (no cron needed).
- Categories & tags (tags auto-created), media library.

### Reach (automatic, public)
- **Server-rendered** HTML on every page (crawlers + AI bots see full content).
- Per-article `<title>`, meta description, **canonical**, Open Graph + Twitter.
- **JSON-LD**: NewsArticle, BreadcrumbList, Organization, WebSite (+ SearchAction),
  FAQPage, Person (authors).
- Site-wide **`max-image-preview:large`** (required for Discover image cards).
- **`/sitemap.xml`**, **`/news-sitemap.xml`** (Google News, last 48h),
  **`/rss.xml`**, **`/robots.txt`**, and **`/llms.txt`** (AI-citation map) — all
  generated live from the database.
- ISR (incremental static regeneration): article pages are prerendered and served
  from cache, refreshed every 60s → strong Core Web Vitals.
- `next/image` (AVIF/WebP, lazy-loading), semantic HTML, dark-mode aware.
- AdSense-ready `<AdSlot>` component (see below).

---

## Configuration

Copy `.env.example` → `.env` and set:

| Var | What |
|---|---|
| `DATABASE_URL` | SQLite file (dev) or Postgres URL (prod) |
| `AUTH_SECRET` | Signs the admin session cookie. `openssl rand -base64 32` |
| `NEXT_PUBLIC_SITE_URL` | Public base URL (no trailing slash) |
| `NEXT_PUBLIC_SITE_NAME` | Brand name (used in metadata, JSON-LD, llms.txt) |
| `NEXT_PUBLIC_ADSENSE_CLIENT` | AdSense publisher id `ca-pub-…` (blank = ads off) |

Brand color, default description, and social handle live in
[`src/lib/site.ts`](src/lib/site.ts) and the CSS tokens in
[`src/app/globals.css`](src/app/globals.css) (`--accent`).

---

## Deploying

### Option A — Vercel (recommended for the public site)

1. Push this repo to GitHub (already wired to `toyshub945-maker/Blog`).
2. Create a **Postgres** database — [Neon](https://neon.tech) free tier is ideal.
3. In `prisma/schema.prisma`, change the datasource provider to `postgresql`.
4. On Vercel: import the repo, set the env vars above (`DATABASE_URL` = Neon URL,
   `NEXT_PUBLIC_SITE_URL` = your domain), deploy.
5. Run `npx prisma migrate deploy` against the Neon DB (once), then seed if wanted.
6. **Image uploads:** Vercel's filesystem is ephemeral — swap the upload handler
   in [`src/app/api/upload/route.ts`](src/app/api/upload/route.ts) to **Vercel
   Blob** or **Cloudflare R2/S3** (only the returned `url` matters to the rest of
   the app). Add the host to `remotePatterns` in `next.config.ts`.

### Option B — The NAS + Cloudflare Tunnel  ← currently deployed

Lives at `/srv/coolcept/blog` on `coolcept-nas` (`ssh root@100.107.58.107`).
Container `blog-web` joins the shared `tiktok-analytics_default` network with
**no host ports**; a `cloudflared` container on that network resolves it by
name. SQLite lives in the `blog_blog-data` volume and uploads in
`blog_blog-uploads`, so both survive rebuilds.

**Deploy / redeploy:**

```bash
cd /srv/coolcept/blog && git pull && docker compose -f docker-compose.prod.yml up -d --build
```

**Connecting a domain** (needed once you register one):

1. Edit `/srv/coolcept/blog/.env` → set `SITE_URL=https://yourdomain.com`.
2. Rebuild — `SITE_URL` is compiled into the pages, so a restart is not enough:
   ```bash
   cd /srv/coolcept/blog && docker compose -f docker-compose.prod.yml up -d --build
   ```
3. In the Cloudflare dashboard → Zero Trust → Networks → Tunnels, add a public
   hostname on the tunnel for that domain pointing at `http://blog-web:3000`.

**Backup before a redeploy** (mirrors the ECBU habit — code *and* data):

```bash
docker run --rm -v blog_blog-data:/d -v /srv/coolcept/backups:/b alpine tar czf /b/blog_data_$(date +%F).tar.gz -C /d .
```

**Notes**
- The image bundles the full resolved `node_modules` so the Prisma CLI can run
  `migrate deploy` at startup without network access. That makes the image
  large (~GBs) but the container start deterministic.
- Fonts are self-hosted; the NAS cannot reach `fonts.googleapis.com` at build.
- The first admin is created from `INITIAL_ADMIN_*` in `.env` on first start.
  Changing those later does **not** alter an existing account.

### Switching SQLite → Postgres

1. `schema.prisma`: `provider = "postgresql"`.
2. Set `DATABASE_URL` to the Postgres connection string.
3. `npx prisma migrate dev --name init` (fresh) or `migrate deploy` (existing).
The schema is written to be portable (no scalar lists, JSON stored as strings).

---

## Google setup after launch

1. **Google Search Console** — verify the domain, submit `/sitemap.xml` and
   `/news-sitemap.xml`.
2. **Discover** — no signup; eligibility is automatic once indexed. Keep cover
   images ≥1200px and page experience green.
3. **AdSense** — apply with a real domain + real content; once approved, set
   `NEXT_PUBLIC_ADSENSE_CLIENT` and place `<AdSlot slot="…" />` where you want ads.

---

## Project map

```
src/
  app/
    (site)/         public blog (home, [slug] article, category, tag, author, search)
    admin/          dashboard + editor (protected by src/proxy.ts)
    api/            auth, posts, categories, upload
    sitemap.ts robots.ts rss.xml/ news-sitemap.xml/ llms.txt/   crawl + feeds
  components/       site/ (public UI) + admin/ (editor UI)
  lib/              db, auth/session, queries, seo (JSON-LD + metadata), posts, toc
prisma/             schema.prisma + seed.ts
```

## Notes / later

- Auto-generated per-article OG "cards" (`next/og`) are disabled — real cover
  images are used as social/Discover previews (Google prefers real photos). Can be
  re-enabled once `next/og` stabilizes under Next 16 + Turbopack.
- Deferred features (easy adds): newsletter signup, reader comments.
