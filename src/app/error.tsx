"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Catches errors thrown by anything under the root layout (pages, client
 * components, hydration failures that escalate to a thrown error, etc).
 * Does NOT catch errors thrown by app/layout.tsx itself — that's global-error.tsx.
 */
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const isDev = process.env.NODE_ENV === "development";

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-6 bg-[var(--bg-main)]">
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-[var(--accent-gold)]" />

      <div className="relative z-10 flex flex-col items-center text-center max-w-lg mx-auto">
        {/* 史 — "sử", history */}
        <span className="archive-seal mb-6" aria-hidden="true">史</span>


        <h1 className="archive-title mb-4 text-[clamp(1.8rem,5vw,2.75rem)]">
          Có gì đó vừa đứt gãy trong dòng lịch sử
        </h1>

        <p className="mb-8 text-base leading-[1.7] text-[var(--text-tertiary)]">
          Trang bạn đang xem gặp sự cố không mong muốn. Bạn có thể thử lại
          hoặc quay về trang chủ.
        </p>

        {isDev && (
          <pre className="mb-8 w-full max-h-[220px] text-left text-xs overflow-auto rounded-[2px] p-4 bg-[var(--bg-surface)] border border-[var(--text-primary)] text-[var(--accent-danger)]">
            {error.message}
            {error.digest ? `\n\nDigest: ${error.digest}` : ""}
            {error.stack ? `\n\n${error.stack}` : ""}
          </pre>
        )}

        <div className="flex flex-wrap gap-3 justify-center">
          <button onClick={reset} className="btn-crimson">
            Thử lại
          </button>
          <Link href="/" className="btn-line">
            Về trang chủ
          </Link>
        </div>
      </div>

      <div className="absolute bottom-7 left-0 right-0 flex justify-center">
        <span className="archive-label text-[var(--text-muted)]">
          HistoryTalk · Runtime Error
        </span>
      </div>
    </div>
  );
}
