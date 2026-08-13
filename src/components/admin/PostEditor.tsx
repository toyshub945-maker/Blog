"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import RichTextEditor from "@/components/admin/RichTextEditor";
import { uploadImage } from "@/lib/client-upload";
import { makeSlug } from "@/lib/slug-client";

export type EditorCategory = { id: string; name: string };

export type EditorPost = {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  answerBlock: string;
  bodyJson: object | null;
  bodyHtml: string;
  coverImage: string;
  coverAlt: string;
  coverWidth: number | null;
  coverHeight: number | null;
  status: string;
  featured: boolean;
  publishedAt: string | null;
  metaTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  focusKeyword: string;
  faq: { q: string; a: string }[];
  categoryId: string;
  tags: string; // comma-separated names
};

const MIN_COVER_WIDTH = 1200;

function wordCount(s: string) {
  return s.trim() ? s.trim().split(/\s+/).length : 0;
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";

export default function PostEditor({
  initial,
  categories,
}: {
  initial: EditorPost;
  categories: EditorCategory[];
}) {
  const router = useRouter();
  const [post, setPost] = useState<EditorPost>(initial);
  const [bodyText, setBodyText] = useState(""); // for word count / checklist
  const [slugTouched, setSlugTouched] = useState(!!initial.slug);
  const [scheduleAt, setScheduleAt] = useState(initial.publishedAt?.slice(0, 16) || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [coverWarning, setCoverWarning] = useState("");

  function set<K extends keyof EditorPost>(key: K, value: EditorPost[K]) {
    setPost((p) => ({ ...p, [key]: value }));
  }

  function onTitleChange(v: string) {
    setPost((p) => ({
      ...p,
      title: v,
      slug: slugTouched ? p.slug : makeSlug(v),
    }));
  }

  async function onCoverSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverWarning("");
    try {
      const { url, width, height } = await uploadImage(file);
      setPost((p) => ({
        ...p,
        coverImage: url,
        coverWidth: width,
        coverHeight: height,
      }));
      if (width < MIN_COVER_WIDTH) {
        setCoverWarning(
          `This image is only ${width}px wide. Google Discover needs at least ${MIN_COVER_WIDTH}px wide (16:9). Use a larger image for Discover eligibility.`
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      e.target.value = "";
    }
  }

  // ---- FAQ helpers ----
  function addFaq() {
    setPost((p) => ({ ...p, faq: [...p.faq, { q: "", a: "" }] }));
  }
  function updateFaq(i: number, key: "q" | "a", value: string) {
    setPost((p) => {
      const faq = [...p.faq];
      faq[i] = { ...faq[i], [key]: value };
      return { ...p, faq };
    });
  }
  function removeFaq(i: number) {
    setPost((p) => ({ ...p, faq: p.faq.filter((_, idx) => idx !== i) }));
  }

  // ---- SEO checklist ----
  const checklist = useMemo(() => {
    const titleLen = post.title.trim().length;
    const metaDesc = (post.metaDescription || post.excerpt).trim();
    const answerWords = wordCount(post.answerBlock);
    const bodyWords = wordCount(bodyText);
    const hasH2 = /<h2[\s>]/i.test(post.bodyHtml);
    const kw = post.focusKeyword.trim().toLowerCase();
    return [
      { label: "Title 30–65 characters", ok: titleLen >= 30 && titleLen <= 65 },
      { label: "URL slug set", ok: !!post.slug.trim() },
      {
        label: "Meta description 70–160 chars",
        ok: metaDesc.length >= 70 && metaDesc.length <= 160,
      },
      {
        label: `Cover image ≥ ${MIN_COVER_WIDTH}px wide`,
        ok: !!post.coverImage && (post.coverWidth || 0) >= MIN_COVER_WIDTH,
      },
      { label: "Cover image alt text", ok: !!post.coverAlt.trim() },
      {
        label: "Direct-answer block (40–60 words)",
        ok: answerWords >= 30 && answerWords <= 80,
      },
      { label: "Body has 300+ words", ok: bodyWords >= 300 },
      { label: "At least one H2 subheading", ok: hasH2 },
      {
        label: "Focus keyword appears in title",
        ok: !!kw && post.title.toLowerCase().includes(kw),
      },
    ];
  }, [post, bodyText]);

  const passed = checklist.filter((c) => c.ok).length;

  // ---- Save ----
  async function save(targetStatus: "draft" | "scheduled" | "published") {
    setSaving(true);
    setError("");
    setMessage("");

    if (targetStatus === "scheduled" && !scheduleAt) {
      setError("Pick a date & time to schedule.");
      setSaving(false);
      return;
    }

    const payload = {
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      answerBlock: post.answerBlock,
      bodyJson: post.bodyJson,
      bodyHtml: post.bodyHtml,
      coverImage: post.coverImage,
      coverAlt: post.coverAlt,
      coverWidth: post.coverWidth,
      coverHeight: post.coverHeight,
      status: targetStatus,
      featured: post.featured,
      publishedAt:
        targetStatus === "scheduled"
          ? new Date(scheduleAt).toISOString()
          : post.publishedAt,
      metaTitle: post.metaTitle,
      metaDescription: post.metaDescription,
      canonicalUrl: post.canonicalUrl,
      focusKeyword: post.focusKeyword,
      faq: post.faq.filter((f) => f.q.trim() && f.a.trim()),
      categoryId: post.categoryId || null,
      tags: post.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    };

    try {
      const res = await fetch(post.id ? `/api/posts/${post.id}` : "/api/posts", {
        method: post.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Save failed");
        setSaving(false);
        return;
      }
      if (!post.id) {
        router.push(`/admin/posts/${data.id}/edit`);
        return;
      }
      setPost((p) => ({ ...p, status: targetStatus }));
      setMessage("Saved.");
      router.refresh();
    } catch {
      setError("Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function del() {
    if (!post.id) return;
    if (!confirm("Delete this post permanently?")) return;
    await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
    router.push("/admin");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      {/* Main column */}
      <div className="space-y-5">
        <input
          value={post.title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Post title"
          className="w-full bg-transparent text-3xl font-bold tracking-tight outline-none placeholder:text-muted-foreground"
        />

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>/{post.slug || "…"}</span>
          <button
            type="button"
            onClick={() => {
              setSlugTouched(true);
              const v = prompt("Edit URL slug", post.slug);
              if (v !== null) set("slug", makeSlug(v));
            }}
            className="text-accent hover:underline"
          >
            edit
          </button>
        </div>

        {/* Cover image */}
        <Field
          label="Cover image"
          hint="Used on cards, social shares, and Google Discover. Use a wide 16:9 image, at least 1200px."
        >
          {post.coverImage ? (
            <div className="space-y-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.coverImage}
                alt="cover preview"
                className="aspect-video w-full rounded-lg object-cover"
              />
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>
                  {post.coverWidth}×{post.coverHeight}px
                </span>
                <label className="cursor-pointer text-accent hover:underline">
                  Replace
                  <input type="file" accept="image/*" className="hidden" onChange={onCoverSelect} />
                </label>
                <button
                  type="button"
                  onClick={() => set("coverImage", "")}
                  className="hover:underline"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <label className="flex aspect-video w-full cursor-pointer items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground hover:bg-muted/40">
              Click to upload a cover image
              <input type="file" accept="image/*" className="hidden" onChange={onCoverSelect} />
            </label>
          )}
          {coverWarning && <p className="mt-2 text-xs text-amber-600">{coverWarning}</p>}
          {post.coverImage && (
            <input
              value={post.coverAlt}
              onChange={(e) => set("coverAlt", e.target.value)}
              placeholder="Describe the image (alt text)"
              className={`${inputCls} mt-2`}
            />
          )}
        </Field>

        {/* Direct answer block */}
        <Field
          label="Direct-answer block (GEO)"
          hint="A 40–60 word self-contained summary that answers the core question. This is what AI engines quote and what shows as the article's key takeaway."
        >
          <textarea
            value={post.answerBlock}
            onChange={(e) => set("answerBlock", e.target.value)}
            rows={3}
            placeholder="In one short paragraph, answer the main question this article addresses…"
            className={inputCls}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            {wordCount(post.answerBlock)} words
          </p>
        </Field>

        <Field label="Excerpt / summary" hint="Shown on cards; fallback meta description.">
          <textarea
            value={post.excerpt}
            onChange={(e) => set("excerpt", e.target.value)}
            rows={2}
            placeholder="One or two sentences summarizing the article."
            className={inputCls}
          />
        </Field>

        {/* Body */}
        <Field label="Article body">
          <RichTextEditor
            initialContent={post.bodyJson}
            onChange={(json, html, text) => {
              setPost((p) => ({ ...p, bodyJson: json, bodyHtml: html }));
              setBodyText(text);
            }}
          />
        </Field>

        {/* FAQ */}
        <Field
          label="FAQ (optional)"
          hint="Question/answer pairs. Rendered as an FAQ section + FAQPage structured data — great for rich results and AI answers."
        >
          <div className="space-y-3">
            {post.faq.map((item, i) => (
              <div key={i} className="rounded-lg border p-3">
                <input
                  value={item.q}
                  onChange={(e) => updateFaq(i, "q", e.target.value)}
                  placeholder="Question"
                  className={`${inputCls} mb-2 font-medium`}
                />
                <textarea
                  value={item.a}
                  onChange={(e) => updateFaq(i, "a", e.target.value)}
                  placeholder="Answer"
                  rows={2}
                  className={inputCls}
                />
                <button
                  type="button"
                  onClick={() => removeFaq(i)}
                  className="mt-2 text-xs text-muted-foreground hover:text-accent"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addFaq}
              className="rounded-lg border border-dashed px-3 py-2 text-sm text-muted-foreground hover:bg-muted/40"
            >
              + Add FAQ item
            </button>
          </div>
        </Field>
      </div>

      {/* Sidebar */}
      <aside className="space-y-5">
        {/* Publish box */}
        <div className="rounded-xl border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Publish</h3>
            <span className="text-xs capitalize text-muted-foreground">{post.status}</span>
          </div>

          {error && <p className="mb-2 text-sm text-accent">{error}</p>}
          {message && <p className="mb-2 text-sm text-green-600">{message}</p>}

          <div className="space-y-2">
            <button
              onClick={() => save("published")}
              disabled={saving}
              className="w-full rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition hover:opacity-90 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Publish now"}
            </button>
            <button
              onClick={() => save("draft")}
              disabled={saving}
              className="w-full rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-muted disabled:opacity-60"
            >
              Save draft
            </button>

            <div className="rounded-lg border p-2">
              <label className="mb-1 block text-xs text-muted-foreground">Schedule for</label>
              <input
                type="datetime-local"
                value={scheduleAt}
                onChange={(e) => setScheduleAt(e.target.value)}
                className="w-full rounded border bg-card px-2 py-1 text-sm outline-none"
              />
              <button
                onClick={() => save("scheduled")}
                disabled={saving}
                className="mt-2 w-full rounded-lg border px-3 py-1.5 text-sm font-medium transition hover:bg-muted disabled:opacity-60"
              >
                Schedule
              </button>
            </div>

            <label className="flex items-center gap-2 pt-1 text-sm">
              <input
                type="checkbox"
                checked={post.featured}
                onChange={(e) => set("featured", e.target.checked)}
              />
              Featured on homepage
            </label>

            {post.id && (
              <button
                onClick={del}
                className="w-full pt-2 text-left text-xs text-muted-foreground hover:text-accent"
              >
                Delete post
              </button>
            )}
          </div>
        </div>

        {/* SEO checklist */}
        <div className="rounded-xl border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">SEO &amp; Discover</h3>
            <span className="text-xs text-muted-foreground">
              {passed}/{checklist.length}
            </span>
          </div>
          <ul className="space-y-1.5 text-sm">
            {checklist.map((c) => (
              <li key={c.label} className="flex items-start gap-2">
                <span className={c.ok ? "text-green-600" : "text-muted-foreground"}>
                  {c.ok ? "✓" : "○"}
                </span>
                <span className={c.ok ? "text-muted-foreground" : ""}>{c.label}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Taxonomy */}
        <div className="rounded-xl border bg-card p-4 space-y-4">
          <Field label="Category">
            <select
              value={post.categoryId}
              onChange={(e) => set("categoryId", e.target.value)}
              className={inputCls}
            >
              <option value="">— none —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Tags" hint="Comma-separated. New tags are created automatically.">
            <input
              value={post.tags}
              onChange={(e) => set("tags", e.target.value)}
              placeholder="politics, economy, analysis"
              className={inputCls}
            />
          </Field>
        </div>

        {/* SEO fields */}
        <div className="rounded-xl border bg-card p-4 space-y-4">
          <h3 className="text-sm font-semibold">Search appearance</h3>
          <Field label="Meta title" hint={`${post.metaTitle.length || post.title.length}/60`}>
            <input
              value={post.metaTitle}
              onChange={(e) => set("metaTitle", e.target.value)}
              placeholder={post.title || "Defaults to the post title"}
              className={inputCls}
            />
          </Field>
          <Field
            label="Meta description"
            hint={`${(post.metaDescription || post.excerpt).length}/160`}
          >
            <textarea
              value={post.metaDescription}
              onChange={(e) => set("metaDescription", e.target.value)}
              rows={3}
              placeholder="Defaults to the excerpt."
              className={inputCls}
            />
          </Field>
          <Field label="Focus keyword" hint="The main phrase you want to rank for.">
            <input
              value={post.focusKeyword}
              onChange={(e) => set("focusKeyword", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Canonical URL" hint="Leave blank unless this is republished from elsewhere.">
            <input
              value={post.canonicalUrl}
              onChange={(e) => set("canonicalUrl", e.target.value)}
              placeholder="https://…"
              className={inputCls}
            />
          </Field>
        </div>
      </aside>
    </div>
  );
}
