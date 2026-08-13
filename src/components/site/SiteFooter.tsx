import Link from "next/link";
import { getCategories } from "@/lib/queries";
import { siteConfig } from "@/lib/site";

export default async function SiteFooter() {
  const categories = await getCategories();
  const year = 2026; // build-stable; update as needed

  return (
    <footer className="mt-16 border-t bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-wrap items-start justify-between gap-8">
          <div className="max-w-sm">
            <p className="text-lg font-bold tracking-tight">{siteConfig.name}</p>
            <p className="mt-2 text-sm text-muted-foreground">{siteConfig.description}</p>
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold">Topics</p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {categories.slice(0, 6).map((c) => (
                <li key={c.id}>
                  <Link href={`/category/${c.slug}`} className="hover:text-foreground">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold">Follow</p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>
                <Link href="/rss.xml" className="hover:text-foreground">
                  RSS feed
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <p className="mt-8 text-xs text-muted-foreground">
          © {year} {siteConfig.name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
