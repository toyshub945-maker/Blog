import Link from "next/link";
import { getSession } from "@/lib/auth";
import { siteConfig } from "@/lib/site";
import LogoutButton from "@/components/admin/LogoutButton";

const nav = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/posts/new", label: "New post" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/media", label: "Media" },
];

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  // Middleware guarantees a session here, but read it for display.
  const session = await getSession();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="font-semibold tracking-tight">
              {siteConfig.name} <span className="text-muted-foreground">admin</span>
            </Link>
            <nav className="hidden gap-4 text-sm sm:flex">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-muted-foreground transition hover:text-foreground"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              target="_blank"
              className="hidden text-sm text-muted-foreground hover:text-foreground sm:inline"
            >
              View site ↗
            </Link>
            <span className="hidden text-sm text-muted-foreground md:inline">
              {session?.name}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
