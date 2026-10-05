"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

// ────────────────────────────────────────────────────────────
//  Floating particle for background atmosphere
// ────────────────────────────────────────────────────────────
function Particle({ delay, x }: { delay: number; x: number }) {
  return (
    <span
      className="absolute bottom-0 w-1 h-1 rounded-full opacity-0 pointer-events-none"
      style={{
        left: `${x}%`,
        background: "var(--accent-gold)",
        animation: `floatUp 6s ease-in infinite`,
        animationDelay: `${delay}s`,
      }}
    />
  );
}

// ────────────────────────────────────────────────────────────
//  Main page
// ────────────────────────────────────────────────────────────
export default function ComingSoonPage() {
  const [dots, setDots] = useState(".");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "." : d + "."));
    }, 600);
    return () => clearInterval(interval);
  }, []);

  const particles = Array.from({ length: 18 }, (_, i) => ({
    delay: (i * 0.4) % 5,
    x: (i * 23 + 7) % 95,
  }));

  return (
    <>
      <style>{`
        @keyframes floatUp {
          0%   { transform: translateY(0) scale(1); opacity: 0; }
          10%  { opacity: 0.7; }
          90%  { opacity: 0.2; }
          100% { transform: translateY(-80vh) scale(0.3); opacity: 0; }
        }

        @keyframes scrollReveal {
          from { opacity: 0; transform: translateY(32px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 0 0 var(--accent-gold-glow); }
          50%       { box-shadow: 0 0 0 4px var(--accent-gold-glow); }
        }

        @keyframes monkeyFloat {
          0%, 100% { transform: translateY(0px) rotate(-2deg); }
          50%       { transform: translateY(-14px) rotate(2deg); }
        }

        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }

        @keyframes borderPulse {
          0%, 100% { opacity: 0.4; }
          50%       { opacity: 1; }
        }



        .reveal-1 { animation: scrollReveal 0.7s ease both; animation-delay: 0.1s; }
        .reveal-2 { animation: scrollReveal 0.7s ease both; animation-delay: 0.25s; }
        .reveal-3 { animation: scrollReveal 0.7s ease both; animation-delay: 0.4s; }
        .reveal-4 { animation: scrollReveal 0.7s ease both; animation-delay: 0.55s; }
        .reveal-5 { animation: scrollReveal 0.7s ease both; animation-delay: 0.7s; }

        .monkey-float { animation: monkeyFloat 3.6s ease-in-out infinite; }

        .shimmer-text {
          background: linear-gradient(
            90deg,
            var(--text-primary) 0%,
            var(--text-primary) 35%,
            var(--accent-gold) 50%,
            var(--text-primary) 65%,
            var(--text-primary) 100%
          );
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 4s linear infinite;
        }

        .glow-btn {
          animation: pulseGlow 2.5s ease-in-out infinite;
          transition: transform 0.2s;
        }

        .border-pulse { animation: borderPulse 2s ease-in-out infinite; }

        .scroll-line {
          width: 1px;
          height: 60px;
          background: var(--text-primary);
          margin: 0 auto;
        }
      `}</style>

      {/* ── Root ── */}
      <div
        className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
        style={{ background: "var(--bg-main)" }}
      >
        {/* Noise texture overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            backgroundRepeat: "repeat",
            backgroundSize: "180px",
          }}
        />

        {/* Radial glow center */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 50% 50%, var(--accent-gold-active-bg) 0%, transparent 70%)",
          }}
        />

        {/* Bottom gradient fade */}
        <div
          className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none"
          style={{
            background: "linear-gradient(to top, var(--bg-deep), transparent)",
          }}
        />

        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {particles.map((p, i) => (
            <Particle key={i} delay={p.delay} x={p.x} />
          ))}
        </div>

        {/* ── Decorative top border ── */}
        <div
          className="absolute top-0 left-0 right-0 h-[3px] border-pulse"
          style={{
            background:
              "var(--accent-gold)",
          }}
        />

        {/* ── Content ── */}
        <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-2xl mx-auto">

          {/* Badge */}
          <div className="reveal-2 mb-6">
            <span
              className="inline-flex items-center gap-2 px-3 py-1 rounded-[2px] text-[11px] font-bold tracking-[0.14em] uppercase"
              style={{
                background: "var(--accent-gold-active-bg)",
                border: "1px solid var(--accent-gold)",
                color: "var(--gold-on-light)",
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background: "var(--accent-gold)",
                  animation: "borderPulse 1.5s ease-in-out infinite",
                  display: "inline-block",
                }}
              />
              Đang phát triển
            </span>
          </div>

          {/* Heading */}
          <h1
            className="reveal-3 shimmer-text font-display font-extrabold uppercase mb-4 leading-[1.05]"
            style={{ fontSize: "clamp(2.5rem, 8vw, 4.5rem)" }}
          >
            Tính năng
            <br />
            sắp ra mắt
          </h1>

          {/* Sub-heading */}
          <p
            className="reveal-4 mb-3"
            style={{
              color: "var(--text-secondary)",
              fontSize: "1.15rem",
              lineHeight: 1.7,
            }}
          >
            Chúng tôi đang xây dựng điều gì đó thú vị{dots}
          </p>
          <p
            className="reveal-4 mb-10"
            style={{
              color: "var(--text-muted)",
              fontSize: "0.95rem",
            }}
          >
            Tính năng này đang trong giai đoạn phát triển và sẽ sớm có mặt.
          </p>

          {/* Divider ornament */}
          <div className="reveal-4 flex items-center gap-3 mb-10 w-full max-w-xs">
            <div
              className="flex-1 h-px"
              style={{ background: "var(--text-primary)" }}
            />
            {/* 史 — "sử", history */}
            <span className="archive-seal w-11 h-11 text-[17px]" aria-hidden="true">史</span>
            <div
              className="flex-1 h-px"
              style={{ background: "var(--text-primary)" }}
            />
          </div>

        </div>

        {/* ── Bottom ornament ── */}
        <div className="absolute bottom-8 left-0 right-0 flex flex-col items-center gap-2 opacity-60">
          <div className="scroll-line" />
          <span
            className="archive-label"
          >
            HistoryTalk
          </span>
        </div>
      </div>
    </>
  );
}
