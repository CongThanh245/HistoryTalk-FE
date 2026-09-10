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
    <div
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-6"
      style={{ background: "var(--bg-main, #0e1a2b)" }}
    >
      {/* Deep red vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 70% at 50% 50%, transparent 40%, rgba(90,35,35,0.28) 100%)",
        }}
      />
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, var(--accent-danger, #b8322a) 30%, var(--accent-gold, #c9a24d) 50%, var(--accent-danger, #b8322a) 70%, transparent)",
        }}
      />

      <div className="relative z-10 flex flex-col items-center text-center max-w-lg mx-auto">
        <span
          className="inline-block px-3 py-1 rounded-sm text-xs tracking-widest uppercase mb-5"
          style={{
            background: "rgba(184,50,42,0.15)",
            border: "1px solid rgba(184,50,42,0.4)",
            color: "#f07070",
          }}
        >
          Đã xảy ra lỗi
        </span>

        <h1
          className="font-semibold mb-3"
          style={{
            color: "var(--accent-gold-soft, #e2c77a)",
            fontSize: "clamp(1.3rem, 4vw, 1.9rem)",
          }}
        >
          Có gì đó vừa đứt gãy trong dòng lịch sử
        </h1>

        <p
          className="mb-8"
          style={{
            color: "var(--text-muted, #8da0ab)",
            fontSize: "1rem",
            lineHeight: 1.7,
          }}
        >
          Trang bạn đang xem gặp sự cố không mong muốn. Bạn có thể thử lại
          hoặc quay về trang chủ.
        </p>

        {isDev && (
          <pre
            className="mb-8 w-full text-left text-xs overflow-auto rounded-lg p-4"
            style={{
              background: "var(--bg-deep, #070d18)",
              border: "1px solid var(--border-default, rgba(231,221,200,0.12))",
              color: "#f0a0a0",
              maxHeight: "220px",
            }}
          >
            {error.message}
            {error.digest ? `\n\nDigest: ${error.digest}` : ""}
            {error.stack ? `\n\n${error.stack}` : ""}
          </pre>
        )}

        <div className="flex flex-wrap gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-2.5 rounded-lg text-sm font-semibold tracking-wide transition-all"
            style={{
              background:
                "linear-gradient(135deg, var(--accent-gold, #c9a24d) 0%, #a35139 100%)",
              color: "var(--bg-main, #0e1a2b)",
            }}
          >
            Thử lại
          </button>
          <Link href="/">
            <button
              className="px-6 py-2.5 rounded-lg text-sm font-semibold tracking-wide transition-all"
              style={{
                background:
                  "linear-gradient(135deg, rgba(90,35,35,0.7) 0%, rgba(180,50,42,0.5) 100%)",
                border: "1px solid rgba(184,50,42,0.5)",
                color: "#f0a0a0",
              }}
            >
              Về trang chủ
            </button>
          </Link>
        </div>
      </div>

      <div className="absolute bottom-7 left-0 right-0 flex justify-center opacity-25">
        <span
          className="text-xs tracking-widest uppercase"
          style={{ color: "var(--accent-gold-soft, #e2c77a)" }}
        >
          HistoryTalk · Runtime Error
        </span>
      </div>
    </div>
  );
}
