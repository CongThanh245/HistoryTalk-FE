"use client";

import { useEffect } from "react";
import "../styles/globals.css";

/**
 * Catches errors thrown by app/layout.tsx itself (the root layout). Because it
 * replaces the root layout when active, it must render its own <html>/<body>.
 * Regular errors from pages/components are caught by app/error.tsx instead.
 */
export default function GlobalError({
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
    <html lang="vi">
      <body style={{ margin: 0 }}>
        <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-6 bg-[var(--bg-main)]">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-[var(--accent-gold)]" />

          <div className="relative z-10 flex flex-col items-center text-center max-w-lg mx-auto">
            <span className="archive-label mb-3">
              Ứng dụng gặp sự cố nghiêm trọng
            </span>

            <h1 className="archive-title mb-4 text-[clamp(1.8rem,5vw,2.75rem)]">
              HistoryTalk không thể tải lên lúc này
            </h1>

            <p className="mb-8 text-base leading-[1.7] text-[var(--text-tertiary)]">
              Đã có lỗi khiến toàn bộ trang không khởi động được. Vui lòng thử
              tải lại trang.
            </p>

            {isDev && (
              <pre className="mb-8 w-full max-h-[220px] text-left text-xs overflow-auto rounded-[2px] p-4 bg-[var(--bg-surface)] border border-[var(--text-primary)] text-[var(--accent-danger)]">
                {error.message}
                {error.digest ? `\n\nDigest: ${error.digest}` : ""}
                {error.stack ? `\n\n${error.stack}` : ""}
              </pre>
            )}

            <button onClick={reset} className="btn-crimson">
              Tải lại trang
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
