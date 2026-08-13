import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";

export const dynamic = "force-dynamic";

async function listUploads() {
  const dir = join(process.cwd(), "public", "uploads");
  try {
    const files = await readdir(dir);
    const items = await Promise.all(
      files
        .filter((f) => /\.(jpe?g|png|webp|avif|gif)$/i.test(f))
        .map(async (f) => {
          const s = await stat(join(dir, f));
          return { name: f, url: `/uploads/${f}`, mtime: s.mtimeMs };
        })
    );
    return items.sort((a, b) => b.mtime - a.mtime);
  } catch {
    return [];
  }
}

export default async function MediaPage() {
  const items = await listUploads();

  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold tracking-tight">Media</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Images uploaded through the editor. In production these live in blob storage
        (Vercel Blob / R2 / S3).
      </p>
      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
          No uploads yet.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {items.map((item) => (
            <a
              key={item.name}
              href={item.url}
              target="_blank"
              className="group overflow-hidden rounded-lg border bg-card"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.url}
                alt={item.name}
                className="aspect-video w-full object-cover transition group-hover:opacity-90"
              />
              <p className="truncate px-2 py-1.5 text-xs text-muted-foreground">{item.name}</p>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
