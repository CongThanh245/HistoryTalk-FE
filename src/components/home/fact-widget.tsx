"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  SparkleIcon,
  ArrowCounterClockwiseIcon,
  TagIcon,
} from "@phosphor-icons/react";
import { facts } from "@/store/fact";

function getRandIdx(max: number, exclude?: number): number {
  if (max <= 1) return 0;
  let i: number;
  do {
    i = Math.floor(Math.random() * max);
  } while (i === exclude);
  return i;
}

export function FactWidget() {
  const [idx, setIdx] = useState(0);
  const [busy, setBusy] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const gsapRef = useRef<any>(null);

  useEffect(() => {
    setIdx(getRandIdx(facts.length));
    import("gsap").then((m) => {
      gsapRef.current = m.gsap ?? m.default;
    });
  }, []);

  const fact = facts[idx];

  const next = useCallback(() => {
    if (busy) return;
    const g = gsapRef.current;
    if (g && cardRef.current) {
      setBusy(true);
      g.to(cardRef.current, {
        opacity: 0,
        y: -6,
        duration: 0.15,
        ease: "power2.in",
        onComplete: () => {
          setIdx((p) => getRandIdx(facts.length, p));
          g.fromTo(
            cardRef.current,
            { opacity: 0, y: 8 },
            {
              opacity: 1,
              y: 0,
              duration: 0.22,
              ease: "power3.out",
              onComplete: () => setBusy(false),
            },
          );
        },
      });
    } else {
      setIdx((p) => getRandIdx(facts.length, p));
    }
  }, [busy]);
  return (
    <div
      style={{
        background: "var(--card-light-bg)",
        border: "1px solid var(--card-light-border)",
        borderRadius: 14,
        overflow: "hidden",
        boxShadow: "0 1px 6px rgba(27,38,50,0.06)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* --- BẮT ĐẦU PHẦN HEADER MỚI --- */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          padding: "14px",
          borderBottom: "1px solid var(--card-light-border)",
          background:
            "linear-gradient(to right, rgba(201,162,77,0.07), transparent)",
        }}
      >
        {/* Dòng 1: Icon + Title + Year */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <SparkleIcon
              size={14}
              weight="fill"
              style={{ color: "var(--accent-gold)" }}
            />
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                color: "#7a5a1e",
              }}
            >
              Daily Fact - Bạn có biết?
            </span>
          </div>

          {fact.year && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: "#8a4a1a",
                background: "rgba(196,106,47,0.1)",
                border: "1px solid rgba(196,106,47,0.22)",
                borderRadius: 5,
                padding: "2px 8px",
              }}
            >
              {fact.year}
            </span>
          )}
        </div>

        {/* Dòng 2: Danh sách Tags */}
        <div
          style={{ display: "flex", flexWrap: "wrap", gap: 6, marginLeft: 22 }}
        >
          {fact.tags.map((tag) => (
            <span
              key={tag}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontSize: 10,
                padding: "2px 10px",
                borderRadius: 20,
                background: "rgba(201,162,77,0.08)",
                border: "1px solid rgba(201,162,77,0.2)",
                color: "#7a5a1e",
                fontWeight: 600,
              }}
            >
              <TagIcon size={9} weight="bold" />
              {tag}
            </span>
          ))}
        </div>
      </div>
      {/* --- KẾT THÚC PHẦN HEADER MỚI --- */}

      {/* Body */}
      <div ref={cardRef} style={{ padding: "16px 14px", flex: 1 }}>
        <p
          style={{
            fontSize: 14,
            lineHeight: 1.6,
            color: "var(--content-text)",
            margin: 0,
          }}
        >
          {fact.content}
        </p>
      </div>

      {/* Footer */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          padding: "0 14px 14px",
        }}
      >
        <button
          onClick={next}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            padding: "6px 12px",
            borderRadius: 8,
            background: "#e8d5a8",
            border: "1px solid #b8922a",
            color: "#5c3d0e",
          }}
        >
          <ArrowCounterClockwiseIcon size={12} weight="bold" />
          Sự kiện khác
        </button>
      </div>
    </div>
  );
}
