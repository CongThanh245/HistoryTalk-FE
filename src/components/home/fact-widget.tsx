"use client";

import { useState, useEffect, useRef } from "react";
import { facts } from "@/store/fact";

export function FactWidget() {
  const [flipped, setFlipped] = useState(false);
  const [factIdx, setFactIdx] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const gsapRef = useRef<any>(null);
  const pulseRef = useRef<any>(null);

  // Daily fact — client only to avoid SSR mismatch
  useEffect(() => {
    const d = new Date();
    const seed =
      d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
    setFactIdx(seed % facts.length);
  }, []);

  // Load GSAP once, start pulse
  useEffect(() => {
    import("gsap").then((m) => {
      const gsap = m.gsap ?? m.default;
      gsapRef.current = gsap;

      if (!flipped && wrapperRef.current) {
        pulseRef.current = gsap.to(wrapperRef.current, {
          scale: 1.015,
          duration: 0.9,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
        });
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFlip = () => {
    if (flipped) return;

    const gsap = gsapRef.current;
    const el = wrapperRef.current;
    if (!el) return;

    // Kill pulse
    if (pulseRef.current) {
      pulseRef.current.kill();
      pulseRef.current = null;
    }

    if (!gsap) {
      // Fallback: CSS flip nếu GSAP chưa load kịp
      el.style.transition = "transform 0.72s cubic-bezier(0.4,0.2,0.2,1)";
      el.style.transform = "rotateY(180deg)";
      setFlipped(true);
      return;
    }

    // GSAP: snap scale về 1, rồi flip
    gsap.killTweensOf(el);
    gsap.to(el, {
      scale: 1,
      duration: 0.15,
      ease: "power2.in",
      onComplete: () => {
        gsap.to(el, {
          rotateY: 180,
          duration: 0.72,
          ease: "power2.inOut",
          onComplete: () => setFlipped(true),
        });
      },
    });
  };

  const fact = facts[factIdx];

  return (
    <div
      className={`w-full aspect-[2/3] max-h-[420px] [perspective:1000px] select-none ${flipped ? "cursor-default" : "cursor-pointer"}`}
      onClick={handleFlip}
    >
      {/* Card wrapper — GSAP animates this */}
      <div
        ref={wrapperRef}
        className="w-full h-full relative [transform-style:preserve-3d]"
      >
        {/* ── MẶT TRƯỚC (hiện khi chưa lật) ── */}
        <div className="absolute inset-0 [backface-visibility:hidden] [-webkit-backface-visibility:hidden] rounded-[18px] overflow-hidden shadow-[0_8px_32px_rgba(27,38,50,0.18),0_2px_8px_rgba(27,38,50,0.1)] bg-gradient-to-br from-[#1a1209] via-[#2d1f08] to-[#1a1209] flex flex-col items-center justify-center gap-[18px]">
          {/* Họa tiết nền */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `
                repeating-linear-gradient(45deg, rgba(201,162,77,0.04) 0px, rgba(201,162,77,0.04) 1px, transparent 1px, transparent 28px),
                repeating-linear-gradient(-45deg, rgba(201,162,77,0.04) 0px, rgba(201,162,77,0.04) 1px, transparent 1px, transparent 28px)
              `,
            }}
          />
          {/* Viền vàng */}
          <div className="absolute inset-3 rounded-xl border border-accent-gold/25 pointer-events-none" />
          <div className="absolute inset-[18px] rounded-lg border border-accent-gold/10 pointer-events-none" />

          {/* Emblem */}
          <div className="relative z-[1] text-center">
            <div className="w-16 h-16 rounded-full bg-[radial-gradient(circle,rgba(201,162,77,0.18)_0%,transparent_70%)] border-[1.5px] border-accent-gold/35 flex items-center justify-center mx-auto mb-3 text-[28px]">
              📜
            </div>
            <p className="m-0 text-[11px] font-extrabold tracking-[0.22em] uppercase text-accent-gold/70">
              Sự kiện hôm nay
            </p>
          </div>

          {/* Hint */}
          <div className="relative z-[1] text-center">
            <p className="m-0 text-xs text-white/30 tracking-[0.08em]">
              Chạm để khám phá
            </p>
            <div className="mt-2.5 flex justify-center">
              <svg
                width="16" height="24" viewBox="0 0 16 24" fill="none"
                className="animate-[bounce-hint_1.6s_ease-in-out_infinite]"
              >
                <path
                  d="M8 0 L8 16 M2 10 L8 16 L14 10"
                  stroke="rgba(201,162,77,0.45)" strokeWidth="1.5"
                  strokeLinecap="round" strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          <style>{`
            @keyframes bounce-hint {
              0%, 100% { transform: translateY(0); opacity: 0.5; }
              50% { transform: translateY(5px); opacity: 1; }
            }
          `}</style>
        </div>

        {/* ── MẶT SAU (hiện sau khi lật) ── */}
        <div className="absolute inset-0 [backface-visibility:hidden] [-webkit-backface-visibility:hidden] [transform:rotateY(180deg)] rounded-[18px] overflow-hidden shadow-[0_8px_32px_rgba(27,38,50,0.18),0_2px_8px_rgba(27,38,50,0.1)] bg-card-light-bg border border-card-light-border flex flex-col">
          {/* Header */}
          <div className="px-[18px] pt-4 pb-3.5 border-b border-accent-gold/15 bg-gradient-to-br from-accent-gold/[0.08] to-transparent">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-extrabold tracking-[0.15em] uppercase text-[#7a5a1e]">
                📅 Sự kiện hôm nay
              </span>
              {fact.year && (
                <span className="text-[10px] font-extrabold text-[#8a4a1a] bg-[rgba(196,106,47,0.1)] border border-[rgba(196,106,47,0.22)] rounded-[5px] px-2 py-0.5">
                  {fact.year}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-[5px]">
              {fact.tags.map((tag) => (
                <span key={tag} className="text-[10px] px-2 py-0.5 rounded-[20px] bg-accent-gold/[0.08] border border-accent-gold/20 text-[#7a5a1e] font-semibold">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 px-[18px] py-5 flex items-center">
            <p className="m-0 text-[14.5px] leading-[1.75] text-content-text">
              {fact.content}
            </p>
          </div>

          {/* Footer */}
          <div className="px-[18px] py-3 border-t border-accent-gold/10 flex justify-center">
            <span className="text-[10px] text-accent-gold/50 tracking-[0.1em] font-semibold uppercase">
              Quay lại vào ngày mai để xem thêm
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
