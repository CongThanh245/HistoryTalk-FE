"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { facts } from "@/store/fact";
import {
  CharacterQuestion,
  characterQuestions,
  EventQuestion,
  eventQuestions,
  TimelineItem,
  timelineSets,
} from "@/store/quiz";
import { QuestionIcon } from "@phosphor-icons/react";

// ─────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getRandom<T>(arr: T[], exclude?: T): T {
  let item: T;
  do {
    item = arr[Math.floor(Math.random() * arr.length)];
  } while (arr.length > 1 && item === exclude);
  return item;
}

type GameMode = "character" | "event" | "timeline";

function randomMode(exclude?: GameMode): GameMode {
  const modes: GameMode[] = ["character", "event", "timeline"];
  let m: GameMode;
  do {
    m = modes[Math.floor(Math.random() * modes.length)];
  } while (modes.length > 1 && m === exclude);
  return m;
}

const MODE_LABELS: Record<GameMode, string> = {
  character: "Đây là vị anh hùng nào",
  event: "Đây là sự kiện nào",
  timeline: "Hãy sắp xếp theo dòng thời gian",
};

// ─────────────────────────────────────────
// Fact Card Modal — portal, GSAP spin + flip
// ─────────────────────────────────────────

function FactCardModal({ onClose }: { onClose: () => void }) {
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
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(10, 8, 4, 0.72)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
      }}
    >
      {/* Particles layer */}
      <div
        ref={particlesRef}
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          overflow: "hidden",
        }}
      />

      {/* Card container */}
      <div
        ref={cardRef}
        onClick={(e) => {
          e.stopPropagation();
          handleFlip();
        }}
        style={{
          width: 320,
          height: 460,
          perspective: "1200px",
          cursor: flipped ? "default" : "pointer",
          userSelect: "none",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Close button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleClose();
          }}
          style={{
            position: "absolute",
            top: -16,
            right: -16,
            zIndex: 10,
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.12)",
            border: "1px solid rgba(255,255,255,0.2)",
            color: "rgba(255,255,255,0.8)",
            fontSize: 16,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(4px)",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.22)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.12)";
          }}
        >
          ×
        </button>

        {/* Inner — 3D flip wrapper */}
        <div
          ref={cardInnerRef}
          style={{
            width: "100%",
            height: "100%",
            position: "relative",
            transformStyle: "preserve-3d",
          }}
        >
          {/* ── FRONT (dark) ── */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              borderRadius: 20,
              background:
                "linear-gradient(145deg, #1a1209 0%, #2d1f08 45%, #1a1209 100%)",
              boxShadow:
                "0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(201,162,77,0.15), inset 0 1px 0 rgba(201,162,77,0.1)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 16,
              overflow: "hidden",
            }}
          >
            {/* Diamond pattern */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                backgroundImage: `repeating-linear-gradient(45deg,rgba(201,162,77,0.035) 0,rgba(201,162,77,0.035) 1px,transparent 1px,transparent 22px),repeating-linear-gradient(-45deg,rgba(201,162,77,0.035) 0,rgba(201,162,77,0.035) 1px,transparent 1px,transparent 22px)`,
              }}
            />
            {/* Borders */}
            <div
              style={{
                position: "absolute",
                inset: 12,
                borderRadius: 12,
                border: "1px solid rgba(201,162,77,0.2)",
                pointerEvents: "none",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 18,
                borderRadius: 8,
                border: "1px solid rgba(201,162,77,0.08)",
                pointerEvents: "none",
              }}
            />
            {/* Corner ornaments */}
            {[
              ["12px", "12px"],
              ["12px", "auto"],
              ["auto", "12px"],
              ["auto", "auto"],
            ].map(([t, b], i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  top: t === "12px" ? 22 : "auto",
                  bottom: t === "auto" ? 22 : "auto",
                  left: b === "12px" ? 22 : "auto",
                  right: b === "auto" ? 22 : "auto",
                  width: 12,
                  height: 12,
                  borderTop:
                    t === "12px" ? "1.5px solid rgba(201,162,77,0.45)" : "none",
                  borderBottom:
                    t === "auto" ? "1.5px solid rgba(201,162,77,0.45)" : "none",
                  borderLeft:
                    b === "12px" ? "1.5px solid rgba(201,162,77,0.45)" : "none",
                  borderRight:
                    b === "auto" ? "1.5px solid rgba(201,162,77,0.45)" : "none",
                  pointerEvents: "none",
                }}
              />
            ))}

            {/* Emblem */}
            <div
              style={{ position: "relative", zIndex: 1, textAlign: "center" }}
            >
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  margin: "0 auto 14px",
                  background:
                    "radial-gradient(circle, rgba(201,162,77,0.18) 0%, transparent 70%)",
                  border: "1.5px solid rgba(201,162,77,0.35)",
                  boxShadow: "0 0 30px rgba(201,162,77,0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 30,
                }}
              >
                📜
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: "rgba(201,162,77,0.7)",
                }}
              >
                Bạn Có Biết?
              </p>
            </div>

            {/* Hint */}
            <div
              style={{ position: "relative", zIndex: 1, textAlign: "center" }}
            >
              <p
                style={{
                  margin: "0 0 10px",
                  fontSize: 12,
                  color: "rgba(255,255,255,0.28)",
                  letterSpacing: "0.06em",
                }}
              >
                Chạm để khám phá
              </p>
              <svg
                width="14"
                height="22"
                viewBox="0 0 16 24"
                fill="none"
                style={{ animation: "bh2 1.6s ease-in-out infinite" }}
              >
                <path
                  d="M8 0 L8 16 M2 10 L8 16 L14 10"
                  stroke="rgba(201,162,77,0.5)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <style>{`@keyframes bh2{0%,100%{transform:translateY(0);opacity:.4}50%{transform:translateY(5px);opacity:1}}`}</style>
          </div>

          {/* ── BACK (light) ── */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              borderRadius: 20,
              overflow: "hidden",
              background: "#fffdf8",
              boxShadow:
                "0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(201,162,77,0.18)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Header accent */}
            <div
              style={{
                padding: "18px 20px 14px",
                background:
                  "linear-gradient(135deg, rgba(201,162,77,0.1) 0%, transparent 60%)",
                borderBottom: "1px solid rgba(201,162,77,0.15)",
                flexShrink: 0,
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "#7a5a1e",
                }}
              >
                Bạn Có Biết?
              </p>
              {fact.year && (
                <p
                  style={{
                    margin: "4px 0 0",
                    fontSize: 10,
                    color: "rgba(138,74,26,0.7)",
                  }}
                >
                  Năm {fact.year}
                </p>
              )}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 4,
                  marginTop: 8,
                }}
              >
                {fact.tags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      fontSize: 9,
                      padding: "2px 7px",
                      borderRadius: 20,
                      background: "rgba(201,162,77,0.1)",
                      border: "1px solid rgba(201,162,77,0.2)",
                      color: "#7a5a1e",
                      fontWeight: 600,
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Body */}
            <div
              style={{
                flex: 1,
                padding: "20px",
                display: "flex",
                alignItems: "center",
                overflowY: "auto",
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: 15,
                  lineHeight: 1.75,
                  color: "#2d3d4f",
                }}
              >
                {fact.content}
              </p>
            </div>

            {/* Footer */}
            <div style={{ padding: "12px 20px 18px", flexShrink: 0 }}>
              <button
                onClick={handleRandom}
                style={{
                  width: "100%",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  padding: "10px 0",
                  borderRadius: 10,
                  background: "linear-gradient(135deg, #e8d5a8, #dcc078)",
                  border: "1px solid #b8922a",
                  color: "#5c3d0e",
                  boxShadow: "0 2px 8px rgba(184,146,42,0.25)",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 14px rgba(184,146,42,0.35)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 2px 8px rgba(184,146,42,0.25)";
                }}
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

// ─────────────────────────────────────────
// Trigger Button — "Bạn có biết?"
// ─────────────────────────────────────────

function FactTriggerButton({ onClick }: { onClick: () => void }) {
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    import("gsap").then((m) => {
      const gsap = m.gsap ?? m.default;
      if (!btnRef.current) return;
      gsap.to(btnRef.current, {
        y: -4,
        duration: 1.6,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });
    });
  }, []);

  return (
    <button
      ref={btnRef}
      onClick={onClick}
      title="Khám phá sự thật lịch sử"
      style={{
        position: "fixed",
        bottom: 28,
        right: 28,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "12px 20px",
        borderRadius: 50,
        background: "linear-gradient(135deg, #2d1f08 0%, #1a1209 100%)",
        border: "1px solid rgba(201,162,77,0.4)",
        boxShadow:
          "0 8px 28px rgba(0,0,0,0.38), 0 0 0 1px rgba(201,162,77,0.07), inset 0 1px 0 rgba(201,162,77,0.14)",
        cursor: "pointer",
        color: "rgba(201,162,77,0.92)",
        transition: "border 0.18s, box-shadow 0.18s",
        whiteSpace: "nowrap",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.border = "1px solid rgba(201,162,77,0.65)";
        e.currentTarget.style.boxShadow =
          "0 10px 36px rgba(0,0,0,0.44), 0 0 28px rgba(201,162,77,0.13), inset 0 1px 0 rgba(201,162,77,0.22)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.border = "1px solid rgba(201,162,77,0.4)";
        e.currentTarget.style.boxShadow =
          "0 8px 28px rgba(0,0,0,0.38), 0 0 0 1px rgba(201,162,77,0.07), inset 0 1px 0 rgba(201,162,77,0.14)";
      }}
    >
      <span style={{ fontSize: 20, lineHeight: 1 }}><QuestionIcon></QuestionIcon></span>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: 2,
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 800,
            lineHeight: 1,
            letterSpacing: "0.04em",
          }}
        >
          Bạn có biết?
        </span>
        <span
          style={{
            fontSize: 9,
            opacity: 0.48,
            fontWeight: 400,
            letterSpacing: "0.06em",
          }}
        >
          Sự thật lịch sử chiến tranh
        </span>
      </div>
    </button>
  );
}

// ─────────────────────────────────────────
// Result Banner
// ─────────────────────────────────────────

function ResultBanner({
  correct,
  explanation,
  onNext,
}: {
  correct: boolean;
  explanation: string;
  onNext: () => void;
}) {
  const [showExp, setShowExp] = useState(false);
  return (
    <div
      style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 4 }}
    >
      <div
        style={{
          borderRadius: 9,
          padding: "9px 12px",
          background: correct ? "rgba(16,40,24,0.08)" : "rgba(90,35,35,0.08)",
          border: `1px solid ${correct ? "rgba(74,178,98,0.4)" : "rgba(184,50,42,0.4)"}`,
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 12,
            fontWeight: 700,
            color: correct ? "#1f5c34" : "#9b2222",
          }}
        >
          {correct ? "Chính xác!" : "Chưa đúng rồi!"}
        </p>
      </div>
      {!showExp ? (
        <button
          onClick={() => setShowExp(true)}
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "#7a5a1e",
            background: "rgba(201,162,77,0.07)",
            border: "1px solid rgba(201,162,77,0.18)",
            borderRadius: 7,
            cursor: "pointer",
            padding: "6px 10px",
            textAlign: "left",
          }}
        >
          Xem giải thích →
        </button>
      ) : (
        <div
          style={{
            background: "rgba(201,162,77,0.05)",
            border: "1px solid rgba(201,162,77,0.16)",
            borderRadius: 7,
            padding: "9px 12px",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 11.5,
              lineHeight: 1.65,
              color: "#2d3d4f",
            }}
          >
            {explanation}
          </p>
        </div>
      )}
      <button
        onClick={onNext}
        style={{
          fontSize: 12,
          fontWeight: 700,
          cursor: "pointer",
          padding: "9px 0",
          borderRadius: 8,
          background: "#e8d5a8",
          border: "1px solid #b8922a",
          color: "#5c3d0e",
          width: "100%",
        }}
      >
        Câu tiếp theo
      </button>
    </div>
  );
}

// ─────────────────────────────────────────
// Option Button
// ─────────────────────────────────────────

function OptionBtn({
  label,
  index,
  answered,
  isAnswer,
  isSelected,
  onClick,
}: {
  label: string;
  index: number;
  answered: boolean;
  isAnswer: boolean;
  isSelected: boolean;
  onClick: () => void;
}) {
  const letters = ["A", "B", "C", "D"];
  let bg = "transparent",
    border = "var(--card-light-border)",
    color = "var(--content-text)";
  if (answered) {
    if (isAnswer) {
      bg = "rgba(16,40,24,0.08)";
      border = "rgba(74,178,98,0.45)";
      color = "#2d6b3e";
    } else if (isSelected) {
      bg = "rgba(90,35,35,0.08)";
      border = "rgba(184,50,42,0.45)";
      color = "#9b2222";
    } else {
      color = "var(--content-muted)";
    }
  }
  return (
    <button
      onClick={onClick}
      style={{
        background: bg,
        border: `1px solid ${border}`,
        color,
        borderRadius: 8,
        padding: "8px 10px",
        fontSize: 12,
        cursor: answered ? "default" : "pointer",
        textAlign: "left",
        display: "flex",
        alignItems: "center",
        gap: 8,
        width: "100%",
        transition: "background 0.1s",
      }}
      onMouseEnter={(e) => {
        if (!answered)
          e.currentTarget.style.background = "rgba(201,162,77,0.06)";
      }}
      onMouseLeave={(e) => {
        if (!answered) e.currentTarget.style.background = bg;
      }}
    >
      <span
        style={{
          fontSize: 9,
          fontWeight: 800,
          minWidth: 18,
          height: 18,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 4,
          flexShrink: 0,
          background: "rgba(201,162,77,0.1)",
          color: "var(--gold-on-light,#a07828)",
        }}
      >
        {letters[index]}
      </span>
      <span style={{ flex: 1, fontWeight: 500 }}>{label}</span>
    </button>
  );
}

// ─────────────────────────────────────────
// Games
// ─────────────────────────────────────────

function GameGuessCharacter({ onScore }: { onScore: (c: boolean) => void }) {
  const [q, setQ] = useState<CharacterQuestion>(characterQuestions[0]);
  const [hintsRevealed, setHintsRevealed] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);
  useEffect(() => {
    setQ(getRandom(characterQuestions));
  }, []);
  const answered = selected !== null;
  const next = () => {
    setQ(getRandom(characterQuestions, q));
    setHintsRevealed(1);
    setSelected(null);
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div
        style={{
          background: "rgba(201,162,77,0.04)",
          border: "1px solid rgba(201,162,77,0.14)",
          borderRadius: 10,
          padding: "12px 14px",
        }}
      >
        <p
          style={{
            margin: "0 0 8px",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--gold-on-light,#a07828)",
          }}
        >
          Đây là ai?
        </p>
        <ul
          style={{
            margin: 0,
            padding: "0 0 0 14px",
            display: "flex",
            flexDirection: "column",
            gap: 5,
          }}
        >
          {q.hints.slice(0, hintsRevealed).map((h, i) => (
            <li
              key={i}
              style={{
                fontSize: 12.5,
                color: "var(--content-text)",
                lineHeight: 1.5,
              }}
            >
              {h}
            </li>
          ))}
        </ul>
        {!answered && hintsRevealed < q.hints.length && (
          <button
            onClick={() => setHintsRevealed((n) => n + 1)}
            style={{
              marginTop: 8,
              fontSize: 10,
              fontWeight: 600,
              color: "var(--gold-on-light,#a07828)",
              background: "rgba(201,162,77,0.1)",
              border: "1px solid rgba(201,162,77,0.2)",
              borderRadius: 5,
              padding: "2px 8px",
              cursor: "pointer",
            }}
          >
            + Gợi ý ({q.hints.length - hintsRevealed} còn lại)
          </button>
        )}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        {q.options.map((opt, i) => (
          <OptionBtn
            key={opt}
            label={opt}
            index={i}
            answered={answered}
            isAnswer={opt === q.answer}
            isSelected={opt === selected}
            onClick={() => {
              if (!answered) {
                setSelected(opt);
                onScore(opt === q.answer);
              }
            }}
          />
        ))}
      </div>
      {answered && (
        <ResultBanner
          correct={selected === q.answer}
          explanation={q.explanation}
          onNext={next}
        />
      )}
    </div>
  );
}

function GameGuessEvent({ onScore }: { onScore: (c: boolean) => void }) {
  const [q, setQ] = useState<EventQuestion>(eventQuestions[0]);
  const [selected, setSelected] = useState<string | null>(null);
  useEffect(() => {
    setQ(getRandom(eventQuestions));
  }, []);
  const answered = selected !== null;
  const next = () => {
    setQ(getRandom(eventQuestions, q));
    setSelected(null);
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div
        style={{
          background: "var(--accent-earth,rgba(196,106,47,0.06))",
          border: "1px solid rgba(196,106,47,0.18)",
          borderRadius: 12,
          padding: "14px",
          textAlign: "center",
        }}
      >
        <p
          style={{
            margin: "0 0 2px",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--accent-bronze,#c46a2f)",
          }}
        >
          Năm xảy ra
        </p>
        <p
          style={{
            margin: "0 0 10px",
            fontSize: 44,
            fontWeight: 900,
            lineHeight: 1,
            letterSpacing: "-2px",
            color: "var(--burning-flame,#e08040)",
          }}
        >
          {q.year}
        </p>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 5,
            justifyContent: "center",
          }}
        >
          {q.clues.map((c, i) => (
            <span
              key={i}
              style={{
                fontSize: 10,
                padding: "2px 8px",
                borderRadius: 20,
                background: "rgba(196,106,47,0.08)",
                border: "1px solid rgba(196,106,47,0.16)",
                color: "var(--burning-flame,#c46a2f)",
              }}
            >
              {c}
            </span>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {q.options.map((opt, i) => (
          <OptionBtn
            key={opt}
            label={opt}
            index={i}
            answered={answered}
            isAnswer={opt === q.answer}
            isSelected={opt === selected}
            onClick={() => {
              if (!answered) {
                setSelected(opt);
                onScore(opt === q.answer);
              }
            }}
          />
        ))}
      </div>
      {answered && (
        <ResultBanner
          correct={selected === q.answer}
          explanation={q.explanation}
          onNext={next}
        />
      )}
    </div>
  );
}

function GameTimeline({ onScore }: { onScore: (c: boolean) => void }) {
  const [setIdx, setSetIdx] = useState(0);
  const [items, setItems] = useState<TimelineItem[]>(timelineSets[0]);
  useEffect(() => {
    setItems(shuffle(timelineSets[0]));
  }, []);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [dragging, setDragging] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const dragItemRef = useRef<number | null>(null);
  const dragOverRef = useRef<number | null>(null);
  const correctOrder = [...timelineSets[setIdx]].sort(
    (a, b) => a.year - b.year,
  );

  const handleDrop = () => {
    if (dragItemRef.current === null || dragOverRef.current === null) return;
    const copy = [...items];
    const [dragged] = copy.splice(dragItemRef.current, 1);
    copy.splice(dragOverRef.current, 0, dragged);
    setItems(copy);
    dragItemRef.current = null;
    dragOverRef.current = null;
    setDragging(null);
    setDragOverIdx(null);
  };

  const next = () => {
    const ni = (setIdx + 1) % timelineSets.length;
    setSetIdx(ni);
    setItems(shuffle(timelineSets[ni]));
    setSubmitted(false);
    setIsCorrect(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
      <p style={{ margin: 0, fontSize: 11, color: "var(--content-muted)" }}>
        Kéo thả sắp xếp{" "}
        <strong style={{ color: "var(--content-text)" }}>
          từ sớm → muộn nhất
        </strong>
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {items.map((item, i) => {
          const correctPos = correctOrder.findIndex((c) => c.id === item.id);
          const placedOk = submitted && correctPos === i;
          const placedWrong = submitted && correctPos !== i;
          return (
            <div
              key={item.id}
              draggable={!submitted}
              onDragStart={() => {
                dragItemRef.current = i;
                setDragging(i);
              }}
              onDragEnter={() => {
                dragOverRef.current = i;
                setDragOverIdx(i);
              }}
              onDragEnd={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              style={{
                background: placedOk
                  ? "rgba(16,40,24,0.08)"
                  : placedWrong
                    ? "rgba(90,35,35,0.08)"
                    : dragOverIdx === i && dragging !== i
                      ? "rgba(201,162,77,0.06)"
                      : "var(--card-light-bg)",
                border: `1px solid ${placedOk ? "rgba(74,178,98,0.45)" : placedWrong ? "rgba(184,50,42,0.45)" : dragOverIdx === i && dragging !== i ? "rgba(201,162,77,0.35)" : "var(--card-light-border)"}`,
                borderRadius: 9,
                padding: "8px 11px",
                cursor: submitted ? "default" : "grab",
                display: "flex",
                alignItems: "center",
                gap: 9,
                opacity: dragging === i ? 0.35 : 1,
                userSelect: "none",
                transition: "all 0.1s",
              }}
            >
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  flexShrink: 0,
                  background: submitted
                    ? placedOk
                      ? "#5dcc78"
                      : "#f07070"
                    : "rgba(201,162,77,0.4)",
                }}
              />
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--content-text)",
                  }}
                >
                  {item.label}
                </p>
                <p
                  style={{
                    margin: "1px 0 0",
                    fontSize: 10,
                    color: "var(--content-muted)",
                  }}
                >
                  {item.description}
                </p>
              </div>
              {submitted && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    color: placedOk ? "#1f5c34" : "#9b2222",
                    background: placedOk
                      ? "rgba(74,178,98,0.12)"
                      : "rgba(184,50,42,0.12)",
                    border: `1px solid ${placedOk ? "rgba(74,178,98,0.3)" : "rgba(184,50,42,0.3)"}`,
                    borderRadius: 4,
                    padding: "1px 6px",
                  }}
                >
                  {item.yearDisplay}
                </span>
              )}
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  minWidth: 18,
                  height: 18,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 4,
                  background: "rgba(201,162,77,0.1)",
                  color: "var(--gold-on-light,#a07828)",
                  flexShrink: 0,
                }}
              >
                {i + 1}
              </span>
            </div>
          );
        })}
      </div>
      {!submitted ? (
        <button
          onClick={() => {
            const ok = items.every((item, i) => item.id === correctOrder[i].id);
            setIsCorrect(ok);
            setSubmitted(true);
            onScore(ok);
          }}
          style={{
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            padding: "9px 0",
            borderRadius: 8,
            background: "#e8d5a8",
            border: "1px solid #b8922a",
            color: "#5c3d0e",
            width: "100%",
          }}
        >
          Kiểm tra thứ tự
        </button>
      ) : (
        <ResultBanner
          correct={isCorrect}
          explanation={
            isCorrect
              ? "Hoàn hảo! Đúng thứ tự thời gian."
              : `Thứ tự đúng: ${correctOrder.map((c) => `${c.label} (${c.yearDisplay})`).join(" → ")}`
          }
          onNext={next}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// Main: HomeRightPanel
// ─────────────────────────────────────────

export function HomeRightPanel() {
  const [mode, setMode] = useState<GameMode>("character");
  const [gameKey, setGameKey] = useState(0);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [showFact, setShowFact] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setMode(randomMode());
  }, []);

  const handleScore = useCallback((correct: boolean) => {
    setScore((s) => ({
      correct: s.correct + (correct ? 1 : 0),
      total: s.total + 1,
    }));
  }, []);

  return (
    <>
      {/* Fact modal portal */}
      {mounted && showFact && (
        <FactCardModal onClose={() => setShowFact(false)} />
      )}

      {/* Fixed floating trigger button */}
      {mounted && <FactTriggerButton onClick={() => setShowFact(true)} />}

      <div
        style={{
          background: "var(--card-light-bg)",
          border: "1px solid var(--card-light-border)",
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: "0 2px 10px rgba(27,38,50,0.06)",
          display: "flex",
          flexDirection: "column",
          minHeight: 480,
          maxHeight: 580,
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "12px 16px 10px",
            borderBottom: "1px solid var(--card-light-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
            gap: 12,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <p
              style={{
                margin: 0,
                fontSize: 12,
                fontWeight: 700,
                color: "var(--content-heading)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {MODE_LABELS[mode]}
            </p>
            {score.total > 0 && (
              <p
                style={{
                  margin: "1px 0 0",
                  fontSize: 10,
                  color: "var(--content-muted)",
                }}
              >
                {score.correct}/{score.total} câu đúng
              </p>
            )}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexShrink: 0,
            }}
          >
            {/* Switch game */}
            <button
              onClick={() => {
                setMode((m) => randomMode(m));
                setGameKey((k) => k + 1);
              }}
              style={{
                fontSize: 10,
                fontWeight: 600,
                cursor: "pointer",
                padding: "4px 10px",
                borderRadius: 6,
                background: "transparent",
                border: "1px solid var(--card-light-border)",
                color: "var(--content-muted)",
                transition: "all 0.1s",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(201,162,77,0.4)";
                e.currentTarget.style.color = "var(--gold-on-light,#a07828)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--card-light-border)";
                e.currentTarget.style.color = "var(--content-muted)";
              }}
            >
              Game khác
            </button>
          </div>
        </div>

        {/* Game area */}
        <div style={{ flex: 1, padding: "14px 16px 16px", overflowY: "auto" }}>
          {mode === "character" && (
            <GameGuessCharacter key={`c-${gameKey}`} onScore={handleScore} />
          )}
          {mode === "event" && (
            <GameGuessEvent key={`e-${gameKey}`} onScore={handleScore} />
          )}
          {mode === "timeline" && (
            <GameTimeline key={`t-${gameKey}`} onScore={handleScore} />
          )}
        </div>
      </div>
    </>
  );
}
