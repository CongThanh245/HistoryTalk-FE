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
        <div className="absolute inset-0 [backface-visibility:hidden] [-webkit-backface-visibility:hidden] rounded-[2px] overflow-hidden border border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--text-inverse)] flex flex-col items-center justify-center gap-[18px]">
          {/* Họa tiết nền */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `repeating-linear-gradient(0deg, var(--text-inverse) 0px, var(--text-inverse) 1px, transparent 1px, transparent 28px)`,
              opacity: 0.05,
            }}
          />
          {/* Viền vàng */}
          <div className="absolute inset-3 rounded-[2px] border border-[var(--accent-gold)] pointer-events-none" />
          <div className="absolute inset-[18px] rounded-[2px] border border-[var(--text-inverse)] opacity-15 pointer-events-none" />

          {/* Emblem */}
          <div className="relative z-[1] text-center">
            <div className="w-16 h-16 rounded-[2px] border-[1.5px] border-[var(--accent-on-ink)] flex items-center justify-center mx-auto mb-3 text-[28px]">
              📜
            </div>
            <p className="m-0 font-display text-[22px] font-extrabold leading-[1.1] tracking-[0.04em] uppercase text-[var(--text-inverse)]">
              Sự kiện hôm nay
            </p>
          </div>

          {/* Hint */}
          <div className="relative z-[1] text-center">
            <p className="m-0 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-inverse)] opacity-60">
              Chạm để khám phá
            </p>
            <div className="mt-2.5 flex justify-center">
              <svg
                width="16" height="24" viewBox="0 0 16 24" fill="none"
                className="animate-[bounce-hint_1.6s_ease-in-out_infinite]"
              >
                <path
                  d="M8 0 L8 16 M2 10 L8 16 L14 10"
                  stroke="var(--accent-on-ink)" strokeWidth="1.5"
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
        <div className="absolute inset-0 [backface-visibility:hidden] [-webkit-backface-visibility:hidden] [transform:rotateY(180deg)] rounded-[2px] overflow-hidden bg-[var(--bg-surface)] border border-[var(--text-primary)] flex flex-col">
          {/* Header */}
          <div className="px-[18px] pt-4 pb-3.5 border-b border-[var(--text-primary)]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-[var(--gold-on-light)]">
                📅 Sự kiện hôm nay
              </span>
              {fact.year && (
                <span className="font-display text-[13px] font-extrabold text-white bg-[var(--accent-gold)] rounded-[2px] px-2 py-0.5">
                  {fact.year}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-[5px]">
              {fact.tags.map((tag) => (
                <span key={tag} className="text-[10px] px-2 py-0.5 rounded-[2px] border border-[var(--border-strong)] text-[var(--text-secondary)] font-semibold">
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
          <div className="px-[18px] py-3 border-t border-[var(--border-default)] flex justify-center">
            <span className="text-[10px] text-[var(--text-muted)] tracking-[0.1em] font-bold uppercase">
              Quay lại vào ngày mai để xem thêm
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
