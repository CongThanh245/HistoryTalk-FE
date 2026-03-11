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
      style={{
        width: "100%",
        aspectRatio: "2 / 3",
        maxHeight: 420,
        perspective: "1000px",
        cursor: flipped ? "default" : "pointer",
        userSelect: "none",
      }}
      onClick={handleFlip}
    >
      {/* Card wrapper — GSAP animates this */}
      <div
        ref={wrapperRef}
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          transformStyle: "preserve-3d",
          // No CSS transition — GSAP owns the transform
        }}
      >
        {/* ── MẶT TRƯỚC (hiện khi chưa lật) ── */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            borderRadius: 18,
            overflow: "hidden",
            boxShadow:
              "0 8px 32px rgba(27,38,50,0.18), 0 2px 8px rgba(27,38,50,0.1)",
            background:
              "linear-gradient(145deg, #1a1209 0%, #2d1f08 40%, #1a1209 100%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 18,
          }}
        >
          {/* Họa tiết nền */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              backgroundImage: `
                repeating-linear-gradient(45deg, rgba(201,162,77,0.04) 0px, rgba(201,162,77,0.04) 1px, transparent 1px, transparent 28px),
                repeating-linear-gradient(-45deg, rgba(201,162,77,0.04) 0px, rgba(201,162,77,0.04) 1px, transparent 1px, transparent 28px)
              `,
            }}
          />
          {/* Viền vàng */}
          <div style={{ position: "absolute", inset: 12, borderRadius: 12, border: "1px solid rgba(201,162,77,0.25)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", inset: 18, borderRadius: 8, border: "1px solid rgba(201,162,77,0.1)", pointerEvents: "none" }} />

          {/* Emblem */}
          <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
            <div
              style={{
                width: 64, height: 64, borderRadius: "50%",
                background: "radial-gradient(circle, rgba(201,162,77,0.18) 0%, transparent 70%)",
                border: "1.5px solid rgba(201,162,77,0.35)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 12px", fontSize: 28,
              }}
            >
              📜
            </div>
            <p
              style={{
                margin: 0, fontSize: 11, fontWeight: 800,
                letterSpacing: "0.22em", textTransform: "uppercase",
                color: "rgba(201,162,77,0.7)",
              }}
            >
              Sự kiện hôm nay
            </p>
          </div>

          {/* Hint */}
          <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em" }}>
              Chạm để khám phá
            </p>
            <div style={{ marginTop: 10, display: "flex", justifyContent: "center" }}>
              <svg
                width="16" height="24" viewBox="0 0 16 24" fill="none"
                style={{ animation: "bounce-hint 1.6s ease-in-out infinite" }}
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
        <div
          style={{
            position: "absolute",
            inset: 0,
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            borderRadius: 18,
            overflow: "hidden",
            boxShadow: "0 8px 32px rgba(27,38,50,0.18), 0 2px 8px rgba(27,38,50,0.1)",
            background: "var(--card-light-bg, #fffdf8)",
            border: "1px solid var(--card-light-border, rgba(201,162,77,0.2))",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "16px 18px 14px",
              borderBottom: "1px solid rgba(201,162,77,0.15)",
              background: "linear-gradient(135deg, rgba(201,162,77,0.08) 0%, transparent 100%)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color: "#7a5a1e" }}>
                📅 Sự kiện hôm nay
              </span>
              {fact.year && (
                <span style={{ fontSize: 10, fontWeight: 800, color: "#8a4a1a", background: "rgba(196,106,47,0.1)", border: "1px solid rgba(196,106,47,0.22)", borderRadius: 5, padding: "2px 8px" }}>
                  {fact.year}
                </span>
              )}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {fact.tags.map((tag) => (
                <span key={tag} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: "rgba(201,162,77,0.08)", border: "1px solid rgba(201,162,77,0.2)", color: "#7a5a1e", fontWeight: 600 }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Body */}
          <div style={{ flex: 1, padding: "20px 18px", display: "flex", alignItems: "center" }}>
            <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.75, color: "var(--content-text, #2d3d4f)" }}>
              {fact.content}
            </p>
          </div>

          {/* Footer */}
          <div style={{ padding: "12px 18px", borderTop: "1px solid rgba(201,162,77,0.1)", display: "flex", justifyContent: "center" }}>
            <span style={{ fontSize: 10, color: "rgba(201,162,77,0.5)", letterSpacing: "0.1em", fontWeight: 600, textTransform: "uppercase" }}>
              Quay lại vào ngày mai để xem thêm
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}