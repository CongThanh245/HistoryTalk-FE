"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { SparkleIcon, ArrowCounterClockwiseIcon, TagIcon } from "@phosphor-icons/react";
import { facts } from "@/store/fact";

function getRandIdx(max: number, exclude?: number): number {
  if (max <= 1) return 0;
  let i: number;
  do { i = Math.floor(Math.random() * max); } while (i === exclude);
  return i;
}

export function FactWidget() {
  const [idx, setIdx]               = useState(0);
  const [busy, setBusy]             = useState(false);
  const cardRef                     = useRef<HTMLDivElement>(null);
  const gsapRef                     = useRef<any>(null);

  useEffect(() => {
    setIdx(getRandIdx(facts.length));
    import("gsap").then(m => { gsapRef.current = m.gsap ?? m.default; });
  }, []);

  const fact = facts[idx];

  const next = useCallback(() => {
    if (busy) return;
    const g = gsapRef.current;
    if (g && cardRef.current) {
      setBusy(true);
      g.to(cardRef.current, {
        opacity: 0, y: -6, duration: 0.15, ease: "power2.in",
        onComplete: () => {
          setIdx(p => getRandIdx(facts.length, p));
          g.fromTo(cardRef.current,
            { opacity: 0, y: 8 },
            { opacity: 1, y: 0, duration: 0.22, ease: "power3.out",
              onComplete: () => setBusy(false) }
          );
        },
      });
    } else {
      setIdx(p => getRandIdx(facts.length, p));
    }
  }, [busy]);

  return (
    <div style={{
      background: "var(--card-light-bg)",
      border: "1px solid var(--card-light-border)",
      borderRadius: 14,
      overflow: "hidden",
      boxShadow: "0 1px 6px rgba(27,38,50,0.06)",
      display: "flex", flexDirection: "column",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "11px 14px",
        borderBottom: "1px solid var(--card-light-border)",
        background: "linear-gradient(to right, rgba(201,162,77,0.07), transparent)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <SparkleIcon size={13} weight="fill" style={{ color: "var(--accent-gold)" }} />
          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.13em", textTransform: "uppercase", color: "#7a5a1e" }}>
            Daily Fact - Bạn có biết?
          </span>
        </div>
        {fact.year && (
          <span style={{
            fontSize: 10, fontWeight: 800, color: "#8a4a1a",
            background: "rgba(196,106,47,0.1)", border: "1px solid rgba(196,106,47,0.22)",
            borderRadius: 5, padding: "1px 7px",
          }}>
            {fact.year}
          </span>
        )}
      </div>

      {/* Body */}
      <div ref={cardRef} style={{ padding: "12px 14px", flex: 1 }}>
        <p style={{ fontSize: 13, lineHeight: 1.75, color: "var(--content-text)", margin: 0 }}>
          {fact.content}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 10 }}>
          {fact.tags.map(tag => (
            <span key={tag} style={{
              display: "inline-flex", alignItems: "center", gap: 3,
              fontSize: 10, padding: "2px 8px", borderRadius: 20,
              background: "rgba(201,162,77,0.08)", border: "1px solid rgba(201,162,77,0.2)",
              color: "#7a5a1e", fontWeight: 500,
            }}>
              <TagIcon size={9} weight="bold" />
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: "flex", justifyContent: "flex-end", padding: "0 14px 12px" }}>
        <button
          onClick={next}
          style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            fontSize: 11, fontWeight: 700, cursor: "pointer",
            padding: "5px 11px", borderRadius: 7,
            background: "#e8d5a8", border: "1px solid #b8922a", color: "#5c3d0e",
            transition: "background 0.15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "#dcc88e"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "#e8d5a8"; }}
        >
          <ArrowCounterClockwiseIcon size={11} weight="bold" />
          Sự kiện khác
        </button>
      </div>
    </div>
  );
}