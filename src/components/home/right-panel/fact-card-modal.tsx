"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { facts } from "@/store/fact";
import { Pointer, Lightbulb } from "lucide-react";

export function FactCardModal({ onClose }: { onClose: () => void }) {
  const [factIdx, setFactIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const overlayRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const cardInnerRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);
  const gsapRef = useRef<any>(null);

  // Daily seed
  useEffect(() => {
    const d = new Date();
    const seed =
      d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
    setFactIdx(seed % facts.length);
  }, []);

  // Entry animation: backdrop fade + card flies in spinning
  useEffect(() => {
    import("gsap").then((m) => {
      const gsap = m.gsap ?? m.default;
      gsapRef.current = gsap;

      const overlay = overlayRef.current;
      const card = cardRef.current;
      const inner = cardInnerRef.current;
      if (!overlay || !card || !inner) return;

      // Backdrop fade in
      gsap.fromTo(
        overlay,
        { opacity: 0 },
        { opacity: 1, duration: 0.35, ease: "power2.out" },
      );

      // Card: start small + far away + spinning
      gsap.fromTo(
        card,
        { scale: 0.15, y: 120, opacity: 0, rotateZ: -720 },
        {
          scale: 1,
          y: 0,
          opacity: 1,
          rotateZ: 0,
          duration: 1.1,
          ease: "back.out(1.4)",
          onComplete: () => {
            // After landing — gentle wobble then hint to flip
            gsap.to(card, {
              rotateZ: 3,
              duration: 0.12,
              yoyo: true,
              repeat: 5,
              ease: "sine.inOut",
              onComplete: () => {
                // Pulse to invite click
                gsap.to(card, {
                  scale: 1.03,
                  duration: 0.6,
                  ease: "sine.inOut",
                  yoyo: true,
                  repeat: -1,
                  id: "pulse",
                });
              },
            });
          },
        },
      );
    });
  }, []);

  // Spawn floating particles on open
  useEffect(() => {
    const container = particlesRef.current;
    if (!container) return;
    const colors = ["#c9a24d", "#e8c96a", "#fff8e1", "#f0d080", "#a07828"];
    const particles = Array.from({ length: 18 }, (_, i) => {
      const el = document.createElement("div");
      const size = 4 + Math.random() * 6;
      el.style.cssText = `
        position:absolute;
        width:${size}px; height:${size}px;
        border-radius:50%;
        background:${colors[i % colors.length]};
        opacity:0;
        left:${20 + Math.random() * 60}%;
        top:${10 + Math.random() * 80}%;
        pointer-events:none;
      `;
      container.appendChild(el);
      return el;
    });

    import("gsap").then((m) => {
      const gsap = m.gsap ?? m.default;
      particles.forEach((p, i) => {
        gsap.fromTo(
          p,
          { opacity: 0, scale: 0, x: 0, y: 0 },
          {
            opacity: 0.7,
            scale: 1,
            x: (Math.random() - 0.5) * 140,
            y: (Math.random() - 0.5) * 180,
            duration: 0.6 + Math.random() * 0.5,
            delay: 0.2 + i * 0.04,
            ease: "power2.out",
            onComplete: () => {
              gsap.to(p, {
                opacity: 0,
                y: `+=${30 + Math.random() * 60}`,
                duration: 1.2 + Math.random() * 0.8,
                ease: "power1.in",
              });
            },
          },
        );
      });
    });

    return () => {
      particles.forEach((p) => p.remove());
    };
  }, []);

  const handleFlip = () => {
    if (flipped) return;
    const gsap = gsapRef.current;
    const card = cardRef.current;
    const inner = cardInnerRef.current;
    if (!gsap || !card || !inner) return;

    // Kill pulse
    gsap.killTweensOf(card);
    gsap.set(card, { scale: 1, rotateZ: 0 });

    // Quick spin + flip reveal
    gsap
      .timeline()
      .to(card, { rotateZ: 8, scale: 0.96, duration: 0.1, ease: "power2.in" })
      .to(card, { rotateZ: 0, scale: 1, duration: 0.1 })
      .to(inner, {
        rotateY: 180,
        duration: 0.7,
        ease: "power2.inOut",
        onComplete: () => setFlipped(true),
      });
  };

  const handleRandom = (e: React.MouseEvent) => {
    e.stopPropagation();
    const gsap = gsapRef.current;
    const inner = cardInnerRef.current;
    if (!gsap || !inner) return;

    // Flip back, change fact, flip forward
    gsap.to(inner, {
      rotateY: 0,
      duration: 0.4,
      ease: "power2.inOut",
      onComplete: () => {
        setFlipped(false);
        let idx: number;
        do {
          idx = Math.floor(Math.random() * facts.length);
        } while (facts.length > 1 && idx === factIdx);
        setFactIdx(idx);
        setTimeout(() => {
          gsap.to(inner, {
            rotateY: 180,
            duration: 0.55,
            ease: "power2.inOut",
            onComplete: () => setFlipped(true),
          });
        }, 60);
      },
    });
  };

  const handleClose = () => {
    const gsap = gsapRef.current;
    const overlay = overlayRef.current;
    const card = cardRef.current;
    if (!gsap || !overlay || !card) {
      onClose();
      return;
    }

    setIsClosing(true);
    gsap.killTweensOf(card);
    gsap
      .timeline()
      .to(card, {
        scale: 0.1,
        y: 80,
        rotateZ: 360,
        opacity: 0,
        duration: 0.55,
        ease: "back.in(1.8)",
      })
      .to(overlay, { opacity: 0, duration: 0.25, ease: "power2.in" }, "-=0.15")
      .call(onClose);
  };

  const fact = facts[factIdx];

  const modal = (
    <div
      ref={overlayRef}
      onClick={handleClose}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[rgba(10,8,4,0.85)]"
    >
      {/* Particles layer */}
      <div
        ref={particlesRef}
        className="absolute inset-0 pointer-events-none overflow-hidden"
      />

      {/* Card container */}
      <div
        ref={cardRef}
        onClick={(e) => {
          e.stopPropagation();
          handleFlip();
        }}
        className={`w-[320px] h-[460px] [perspective:1200px] select-none relative z-[1] ${flipped ? "cursor-default" : "cursor-pointer"}`}
      >
        {/* Close button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleClose();
          }}
          className="absolute -top-4 -right-4 z-10 w-8 h-8 rounded-full bg-[#2d1f08] border border-white/20 text-white/80 text-base cursor-pointer flex items-center justify-center transition-all duration-150 hover:bg-[#46300d]"
        >
          ×
        </button>

        {/* Inner — 3D flip wrapper */}
        <div
          ref={cardInnerRef}
          className="w-full h-full relative [transform-style:preserve-3d]"
        >
          {/* ── FRONT (dark) ── */}
          <div className="absolute inset-0 [backface-visibility:hidden] [-webkit-backface-visibility:hidden] rounded-[20px] bg-gradient-to-br from-[#1a1209] via-[#2d1f08] to-[#1a1209] shadow-[0_24px_80px_rgba(0,0,0,0.6),0_0_0_1px_rgba(201,162,77,0.15),inset_0_1px_0_rgba(201,162,77,0.1)] flex flex-col items-center justify-center gap-4 overflow-hidden">
            {/* Diamond pattern */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: `repeating-linear-gradient(45deg,rgba(201,162,77,0.035) 0,rgba(201,162,77,0.035) 1px,transparent 1px,transparent 22px),repeating-linear-gradient(-45deg,rgba(201,162,77,0.035) 0,rgba(201,162,77,0.035) 1px,transparent 1px,transparent 22px)`,
              }}
            />
            {/* Borders */}
            <div className="absolute inset-3 rounded-xl border border-accent-gold/20 pointer-events-none" />
            <div className="absolute inset-[18px] rounded-lg border border-accent-gold/[0.08] pointer-events-none" />
            {/* Corner ornaments */}
            {[
              ["12px", "12px"],
              ["12px", "auto"],
              ["auto", "12px"],
              ["auto", "auto"],
            ].map(([t, b], i) => (
              <div
                key={i}
                className="absolute w-3 h-3 pointer-events-none"
                style={{
                  top: t === "12px" ? 22 : "auto",
                  bottom: t === "auto" ? 22 : "auto",
                  left: b === "12px" ? 22 : "auto",
                  right: b === "auto" ? 22 : "auto",
                  borderTop:
                    t === "12px" ? "1.5px solid rgba(201,162,77,0.45)" : "none",
                  borderBottom:
                    t === "auto" ? "1.5px solid rgba(201,162,77,0.45)" : "none",
                  borderLeft:
                    b === "12px" ? "1.5px solid rgba(201,162,77,0.45)" : "none",
                  borderRight:
                    b === "auto" ? "1.5px solid rgba(201,162,77,0.45)" : "none",
                }}
              />
            ))}

            {/* Emblem */}
            <div className="relative z-[1] text-center">
              <div className="w-[72px] h-[72px] rounded-full mx-auto mb-3.5 bg-[radial-gradient(circle,rgba(201,162,77,0.18)_0%,transparent_70%)] border-[1.5px] border-accent-gold/35 shadow-[0_0_30px_rgba(201,162,77,0.12)] flex items-center justify-center text-[30px]">
                <Lightbulb />
              </div>
              <p className="m-0 text-[11px] font-extrabold tracking-[0.22em] uppercase text-accent-gold/70">
                Bạn Có Biết?
              </p>
            </div>

            {/* Hint */}
            <div className="relative z-[1] text-center justify-items-center">
              <p className="m-0 mb-2.5 text-xs text-white/[0.28] tracking-[0.06em]">
                Chạm để khám phá
              </p>
              <Pointer />
            </div>
            <style>{`@keyframes bh2{0%,100%{transform:translateY(0);opacity:.4}50%{transform:translateY(5px);opacity:1}}`}</style>
          </div>

          {/* ── BACK (light) ── */}
          <div className="absolute inset-0 [backface-visibility:hidden] [-webkit-backface-visibility:hidden] [transform:rotateY(180deg)] rounded-[20px] overflow-hidden bg-[#fffdf8] shadow-[0_24px_80px_rgba(0,0,0,0.5),0_0_0_1px_rgba(201,162,77,0.18)] flex flex-col">
            {/* Header accent */}
            <div className="px-5 pt-[18px] pb-3.5 bg-gradient-to-br from-accent-gold/10 to-transparent border-b border-accent-gold/15 shrink-0">
              <p className="m-0 text-[11px] font-extrabold tracking-[0.18em] uppercase text-[#7a5a1e]">
                Bạn Có Biết?
              </p>
              {fact.year && (
                <p className="m-0 mt-1 text-[10px] text-[rgba(138,74,26,0.7)]">
                  Sự kiện xảy ra năm {fact.year}
                </p>
              )}
            </div>

            {/* Body */}
            <div className="flex-1 p-5 flex items-center overflow-y-auto">
              <p className="m-0 text-[15px] leading-[1.75] text-[#2d3d4f]">
                {fact.content}
              </p>
            </div>

            {/* Footer */}
            <div className="px-5 pt-3 pb-[18px] shrink-0">
              <button
                onClick={handleRandom}
                className="w-full text-xs font-bold cursor-pointer py-2.5 rounded-[10px] bg-gradient-to-br from-[#e8d5a8] to-[#dcc078] border border-[#b8922a] text-[#5c3d0e] shadow-[0_2px_8px_rgba(184,146,42,0.25)] transition-all duration-150 hover:-translate-y-px hover:shadow-[0_4px_14px_rgba(184,146,42,0.35)]"
              >
                ✦ Sự kiện khác
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof window === "undefined") return null;
  return createPortal(modal, document.body);
}
