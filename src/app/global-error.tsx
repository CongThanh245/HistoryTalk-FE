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
        <div
          className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-6"
          style={{ background: "#0e1a2b" }}
        >
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
                "linear-gradient(90deg, transparent, #b8322a 30%, #c9a24d 50%, #b8322a 70%, transparent)",
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
              Ứng dụng gặp sự cố nghiêm trọng
            </span>

            <h1
              className="font-semibold mb-3"
              style={{ color: "#e2c77a", fontSize: "clamp(1.3rem, 4vw, 1.9rem)" }}
            >
              HistoryTalk không thể tải lên lúc này
            </h1>

            <p
              className="mb-8"
              style={{ color: "#8da0ab", fontSize: "1rem", lineHeight: 1.7 }}
            >
              Đã có lỗi khiến toàn bộ trang không khởi động được. Vui lòng thử
              tải lại trang.
            </p>

            {isDev && (
              <pre
                className="mb-8 w-full text-left text-xs overflow-auto rounded-lg p-4"
                style={{
                  background: "#070d18",
                  border: "1px solid rgba(231,221,200,0.12)",
                  color: "#f0a0a0",
                  maxHeight: "220px",
                }}
              >
                {error.message}
                {error.digest ? `\n\nDigest: ${error.digest}` : ""}
                {error.stack ? `\n\n${error.stack}` : ""}
              </pre>
            )}

            <button
              onClick={reset}
              className="px-6 py-2.5 rounded-lg text-sm font-semibold tracking-wide"
              style={{
                background: "linear-gradient(135deg, #c9a24d 0%, #a35139 100%)",
                color: "#0e1a2b",
              }}
            >
              Tải lại trang
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
