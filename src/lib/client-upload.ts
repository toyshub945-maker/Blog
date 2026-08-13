// Client-side helpers for image handling in the admin editor.

export type UploadResult = { url: string; width: number; height: number };

/** Read an image's natural pixel dimensions in the browser (before upload). */
export function readImageSize(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image"));
    };
    img.src = url;
  });
}

/** Upload a file and return its public URL + dimensions. */
export async function uploadImage(file: File): Promise<UploadResult> {
  const { width, height } = await readImageSize(file);
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: form });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Upload failed");
  return { url: data.url as string, width, height };
}
