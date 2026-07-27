"use client";

import { useEffect } from "react";

/* ─────────────────────────────────────────────
   Khai báo adsbygoogle trên window
───────────────────────────────────────────── */
declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

/* ─────────────────────────────────────────────
   Single ad slot
───────────────────────────────────────────── */
function AdSlot({
  slot,
  className = "",
}: {
  slot: string;
  className?: string;
}) {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {}
  }, []);

  return (
    <div
      className={`overflow-hidden rounded-xl border border-border-default ${className}`}
    >
      <ins
        className="adsbygoogle block"
        data-ad-client="ca-pub-XXXXXXXXXXXXXXXX" // ← thay bằng publisher ID của bạn
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}

/* ─────────────────────────────────────────────
   Panel
───────────────────────────────────────────── */
export default function AdPanel() {
  return (
    <aside
      className="hidden xl:flex flex-col shrink-0 w-[240px] h-screen overflow-y-auto border-l py-6 px-3 gap-4 bg-bg-deep border-border-default"
    >
      {/* Label */}
      <p
        className="text-[10px] font-semibold tracking-[0.12em] uppercase px-1 text-text-muted"
      >
        Quảng cáo
      </p>

      {/* Ad slot 1 — Rectangle */}
      <AdSlot
        slot="1234567890" // ← thay bằng ad slot ID thật
        className="min-h-[250px]"
      />

      {/* Ad slot 2 — Rectangle */}
      <AdSlot
        slot="0987654321" // ← thay bằng ad slot ID thật
        className="min-h-[250px]"
      />

      {/* Placeholder khi chưa có ads — tự ẩn khi AdSense load */}
      <div
        className="adsbygoogle-placeholder flex-1 flex flex-col gap-3"
        aria-hidden
      >
        {[1, 2].map((i) => (
          <div
            key={i}
            className="rounded-xl border min-h-[250px] flex items-center justify-center border-border-default bg-bg-surface"
          >
            <p
              className="text-[11px] text-center px-4 text-text-muted"
            >
              Quảng cáo
            </p>
          </div>
        ))}
      </div>
    </aside>
  );
}