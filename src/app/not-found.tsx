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
      className="page-font font-bold inline-block relative text-transparent text-[clamp(5rem,18vw,11rem)] leading-none [-webkit-text-stroke:2px_rgba(201,162,77,0.5)] [text-shadow:0_0_40px_rgba(201,162,77,0.15)] animate-[glitch_3.5s_ease-in-out_infinite]"
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
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Crimson+Pro:ital,wght@0,300;0,400;1,300&display=swap');

        @keyframes glitch {
          0%, 88%, 100% {
            text-shadow: 0 0 40px rgba(201,162,77,0.15);
            WebkitTextStroke: 2px rgba(201,162,77,0.5);
          }
          90% {
            text-shadow:
              -3px 0 rgba(90,35,35,0.8),
              3px 0 rgba(47,111,115,0.8),
              0 0 40px rgba(201,162,77,0.4);
          }
          92% {
            text-shadow: 0 0 60px rgba(201,162,77,0.5);
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
          height: 3px;
          background: linear-gradient(90deg, transparent, rgba(201,162,77,0.15), transparent);
          animation: scanline 5s linear infinite;
          pointer-events: none;
        }

        .glow-btn-red {
          background: linear-gradient(135deg, rgba(90,35,35,0.7) 0%, rgba(180,50,42,0.5) 100%);
          border: 1px solid rgba(184,50,42,0.5);
          color: #f0a0a0;
          transition: all 0.2s;
        }
        .glow-btn-red:hover {
          background: linear-gradient(135deg, rgba(184,50,42,0.8) 0%, rgba(90,35,35,0.8) 100%);
          box-shadow: 0 0 20px rgba(184,50,42,0.4);
          transform: scale(1.03);
        }

        .glow-btn-gold {
          background: linear-gradient(135deg, var(--accent-gold, #c9a24d) 0%, #a35139 100%);
          color: #0e1a2b;
          transition: all 0.2s;
        }
        .glow-btn-gold:hover {
          box-shadow: 0 0 24px rgba(201,162,77,0.5);
          transform: scale(1.03);
        }

        .float-side { animation: floatSide 4s ease-in-out infinite; }

        .border-glow-anim { animation: borderGlow 2s ease-in-out infinite; }
      `}</style>

      <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-bg-main">
        {/* Scanline effect */}
        <div className="scanline" />

        {/* Noise texture */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.035] bg-repeat bg-[length:160px]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Deep red vignette from corners */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_70%_at_50%_50%,transparent_40%,rgba(90,35,35,0.25)_100%)]" />

        {/* Center glow */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_60%_50%_at_50%_45%,rgba(201,162,77,0.05)_0%,transparent_70%)]" />

        {/* Top border glow */}
        <div className="absolute top-0 left-0 right-0 h-px border-glow-anim bg-[linear-gradient(90deg,transparent,rgba(184,50,42,0.8)_30%,var(--accent-gold,#c9a24d)_50%,rgba(184,50,42,0.8)_70%,transparent)]" />

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
          <div className="r2 mb-1 tracking-[0.15em] page-font select-none">
            {scramble.split("").map((c, i) => (
              <GlitchDigit key={i} char={c} delay={i * 0.15} />
            ))}
          </div>

          {/* Tag */}
          <div className="r2 mb-5">
            <span className="inline-block px-3 py-1 rounded-sm text-xs tracking-widest uppercase page-font bg-[rgba(184,50,42,0.15)] border border-[rgba(184,50,42,0.4)] text-[#f07070]">
              Không tìm thấy trang
            </span>
          </div>

          {/* Message */}
          <h2 className="r3 page-font font-semibold mb-3 text-accent-gold-soft text-[clamp(1.1rem,3vw,1.5rem)]">
            Trang này đã bị thất lạc trong dòng lịch sử
          </h2>

          <p className="r4 body-font mb-8 text-content-muted text-base leading-[1.7] italic">
            Đường dẫn bạn truy cập không tồn tại, đã bị xoá,
            <br className="hidden sm:block" />
            hoặc có thể chưa bao giờ được ghi chép lại.
          </p>

          {/* Divider */}
          <div className="r4 flex items-center gap-3 mb-8 w-full max-w-xs">
            <div className="flex-1 h-px bg-border-default" />
            <span className="text-[rgba(184,50,42,0.7)] text-base">
              ✦
            </span>
            <div className="flex-1 h-px bg-border-default" />
          </div>

          {/* Buttons */}
          <div className="r5 flex flex-wrap gap-3 justify-center">
            <Link href="/">
              <button className="glow-btn-gold page-font px-6 py-2.5 rounded-lg text-sm font-semibold tracking-wide">
                ← Về trang chủ
              </button>
            </Link>
            <button
              onClick={() => window.history.back()}
              className="glow-btn-red page-font px-6 py-2.5 rounded-lg text-sm font-semibold tracking-wide"
            >
              Trang trước
            </button>
          </div>
        </div>

        {/* ── Corner decorations ── */}
        {/* Top-left */}
        <div className="absolute top-6 left-6 opacity-20 float-side">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <path d="M2 2 H14 V2 M2 2 V14" stroke="#c9a24d" strokeWidth="1.5" />
          </svg>
        </div>
        {/* Bottom-right */}
        <div className="absolute bottom-6 right-6 opacity-20 float-side [animation-delay:2s]">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <path
              d="M38 38 H26 V38 M38 38 V26"
              stroke="#c9a24d"
              strokeWidth="1.5"
            />
          </svg>
        </div>

        {/* Bottom label */}
        <div className="absolute bottom-7 left-0 right-0 flex justify-center opacity-25">
          <span className="page-font text-xs tracking-widest uppercase text-accent-gold-soft">
            HistoryTalk · Error 404
          </span>
        </div>
      </div>
    </>
  );
}
