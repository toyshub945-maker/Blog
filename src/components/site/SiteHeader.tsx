import Link from "next/link";
import { getCategories } from "@/lib/queries";
import { siteConfig } from "@/lib/site";

export default async function SiteHeader() {
  const categories = await getCategories();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="text-xl font-bold tracking-tight">
          {siteConfig.name}
        </Link>

        <nav className="hidden items-center gap-5 text-sm font-medium md:flex">
          {categories.slice(0, 6).map((c) => (
            <Link
              key={c.id}
              href={`/category/${c.slug}`}
              className="text-muted-foreground transition hover:text-foreground"
            >
              {c.name}
            </Link>
          ))}
        </nav>

        <form action="/search" method="get" className="flex items-center">
          <input
            type="search"
            name="q"
            placeholder="Search…"
            aria-label="Search articles"
            className="w-28 rounded-full border bg-card px-3 py-1.5 text-sm outline-none transition focus:w-44 focus:ring-2 focus:ring-ring sm:w-36 sm:focus:w-52"
          />
        </form>
      </div>
    </header>
  );
}
