"use client";

import { useEffect } from "react";
import { siteConfig } from "@/lib/site";

// Google AdSense slot. Renders nothing extra when no publisher id is configured,
// so the layout is ad-ready but clean until you enable AdSense.
//
// Usage: <AdSlot slot="1234567890" />  (slot id from your AdSense dashboard)
export default function AdSlot({
  slot,
  className = "",
  format = "auto",
}: {
  slot?: string;
  className?: string;
  format?: string;
}) {
  const client = siteConfig.adsenseClient;

  useEffect(() => {
    if (!client) return;
    try {
      // @ts-expect-error adsbygoogle is injected by the AdSense script
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      /* ignore */
    }
  }, [client]);

  if (!client) {
    // Placeholder in dev / before AdSense approval.
    return (
      <div
        className={`flex h-24 items-center justify-center rounded-lg border border-dashed text-xs text-muted-foreground ${className}`}
        aria-hidden
      >
        Advertisement
      </div>
    );
  }

  return (
    <ins
      className={`adsbygoogle block ${className}`}
      style={{ display: "block" }}
      data-ad-client={client}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive="true"
    />
  );
}
