"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

// ────────────────────────────────────────────────────────────
//  Glitch letters
// ────────────────────────────────────────────────────────────
function GlitchDigit({ char, delay }: { char: string; delay: number }) {
  return (
    <span
      className="font-display font-extrabold inline-block relative text-[var(--text-primary)] text-[clamp(5rem,18vw,11rem)] leading-none animate-[glitch_3.5s_ease-in-out_infinite]"
      style={{ animationDelay: `${delay}s` }}
    >
      {char}
    </span>
  );
}

export default function NotFoundPage() {
  const [scramble, setScramble] = useState("404");
  const chars = "0123456789IVXLCDM∞◈⊗";

  useEffect(() => {
    let count = 0;
    const id = setInterval(() => {
      if (count < 12) {
        setScramble(
          Array.from(
            { length: 3 },
            () => chars[Math.floor(Math.random() * chars.length)],
          ).join(""),
        );
        count++;
      } else {
        setScramble("404");
        count = 0;
      }
    }, 80);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <style>{`
        @keyframes glitch {
          0%, 88%, 100% {
            text-shadow: none;
          }
          90% {
            text-shadow:
              -3px 0 var(--accent-gold),
              3px 0 var(--border-strong);
          }
          92% {
            text-shadow: 2px 0 var(--accent-gold);
          }
        }

        @keyframes revealUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes monkeyShake {
          0%, 100% { transform: rotate(-3deg) translateY(0); }
          25%       { transform: rotate(3deg) translateY(-8px); }
          50%       { transform: rotate(-2deg) translateY(-4px); }
          75%       { transform: rotate(2deg) translateY(-10px); }
        }

        @keyframes scanline {
          0%   { top: -10%; }
          100% { top: 110%; }
        }

        @keyframes borderGlow {
          0%, 100% { opacity: 0.3; }
          50%       { opacity: 0.8; }
        }

        @keyframes floatSide {
          0%, 100% { transform: translateX(0) scaleX(1); }
          50%       { transform: translateX(6px) scaleX(0.98); }
        }


        .r1 { animation: revealUp 0.65s ease both 0.05s; }
        .r2 { animation: revealUp 0.65s ease both 0.2s; }
        .r3 { animation: revealUp 0.65s ease both 0.35s; }
        .r4 { animation: revealUp 0.65s ease both 0.5s; }
        .r5 { animation: revealUp 0.65s ease both 0.65s; }

        .monkey-shake { animation: monkeyShake 2.4s ease-in-out infinite; }

        .scanline {
          position: absolute;
          left: 0; right: 0;
          height: 1px;
          background: var(--border-strong);
          animation: scanline 5s linear infinite;
          pointer-events: none;
        }

        .float-side { animation: floatSide 4s ease-in-out infinite; }

        .border-glow-anim { animation: borderGlow 2s ease-in-out infinite; }
      `}</style>

      <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-bg-main">
        {/* Scanline effect */}
        <div className="scanline" />

        {/* Top rule */}
        <div className="absolute top-0 left-0 right-0 h-[3px] border-glow-anim bg-[var(--accent-gold)]" />

        {/* ── Content ── */}
        <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-xl mx-auto">
          {/* Monkey — sad/confused */}
          <div className="r1 monkey-shake mb-6">
            <div className="relative w-30 h-30 mx-auto">
              <Image
                src="/monkey.png"
                alt="Lost monkey"
                fill
                className="object-cover"
              />
            </div>
          </div>

          {/* 404 scramble */}
          <div className="r2 mb-1 tracking-[0.04em] select-none">
            {scramble.split("").map((c, i) => (
              <GlitchDigit key={i} char={c} delay={i * 0.15} />
            ))}
          </div>

          {/* Tag */}
          <div className="r2 mb-5">
            <span className="inline-block px-3 py-1 rounded-[2px] text-[11px] font-bold tracking-[0.14em] uppercase bg-[var(--accent-gold)] text-white">
              Không tìm thấy trang
            </span>
          </div>

          {/* Message */}
          <h2 className="r3 archive-title mb-3 text-[clamp(1.4rem,3.5vw,2rem)]">
            Trang này đã bị thất lạc trong dòng lịch sử
          </h2>

          <p className="r4 mb-8 text-[var(--text-tertiary)] text-base leading-[1.7]">
            Đường dẫn bạn truy cập không tồn tại, đã bị xoá,
            <br className="hidden sm:block" />
            hoặc có thể chưa bao giờ được ghi chép lại.
          </p>

          {/* Divider */}
          <div className="r4 flex items-center gap-3 mb-8 w-full max-w-xs">
            <div className="flex-1 h-px bg-[var(--text-primary)]" />
            {/* 史 — "sử", history */}
            <span className="archive-seal w-11 h-11 text-[17px]" aria-hidden="true">史</span>
            <div className="flex-1 h-px bg-[var(--text-primary)]" />
          </div>

          {/* Buttons */}
          <div className="r5 flex flex-wrap gap-3 justify-center">
            <Link href="/" className="btn-crimson">
              ← Về trang chủ
            </Link>
            <button
              onClick={() => window.history.back()}
              className="btn-line"
            >
              Trang trước
            </button>
          </div>
        </div>

        {/* ── Corner decorations ── */}
        {/* Top-left */}
        <div className="absolute top-6 left-6 opacity-40 float-side text-[var(--text-primary)]">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <path d="M2 2 H14 V2 M2 2 V14" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </div>
        {/* Bottom-right */}
        <div className="absolute bottom-6 right-6 opacity-40 float-side [animation-delay:2s] text-[var(--text-primary)]">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <path
              d="M38 38 H26 V38 M38 38 V26"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
        </div>

        {/* Bottom label */}
        <div className="absolute bottom-7 left-0 right-0 flex justify-center">
          <span className="archive-label text-[var(--text-muted)]">
            HistoryTalk · Error 404
          </span>
        </div>
      </div>
    </>
  );
}
