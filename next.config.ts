import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for the Docker image: emits a self-contained server in
  // .next/standalone that the Dockerfile copies into a slim runtime layer.
  output: "standalone",
  images: {
    // Serve modern formats for Core Web Vitals / Discover.
    formats: ["image/avif", "image/webp"],
    // Allow remote cover images (e.g. stock photos). Add your CDN / blob host here.
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "**.public.blob.vercel-storage.com" },
      { protocol: "https", hostname: "**.r2.dev" },
    ],
  },
};

export default nextConfig;
