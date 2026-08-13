import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-1 flex-col items-center justify-center px-4 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-accent">404</p>
      <h1 className="mt-2 font-serif text-3xl font-bold">Page not found</h1>
      <p className="mt-2 text-muted-foreground">
        The story you&rsquo;re looking for may have moved or never existed.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground transition hover:opacity-90"
      >
        Back to home
      </Link>
    </main>
  );
}
