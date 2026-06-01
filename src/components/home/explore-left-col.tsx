"use client";

import Link from "next/link";
import { useState, useCallback, useEffect, useRef } from "react";
import {
  BankIcon,
  UserIcon,
  ChatTextIcon,
  ClipboardTextIcon,
  BookmarkIcon,
  CaretRightIcon,
  SparkleIcon,
  ArrowCounterClockwiseIcon,
  TagIcon,
} from "@phosphor-icons/react";
import { facts } from "@/store/fact";

// ─────────────────────────────────────────
// Feature list data
// ─────────────────────────────────────────

const FEATURE_CARDS = [
  {
    icon: BankIcon,
    title: "Sự kiện lịch sử",
    desc: "Dòng thời gian tương tác",
    href: "/events",
    accentHex: "#c9a24d",
    glow: "rgba(201,162,77,0.1)",
  },
  {
    icon: UserIcon,
    title: "Nhân vật",
    desc: "Những người làm thay đổi lịch sử",
    href: "/characters",
    accentHex: "#c46a2f",
    glow: "rgba(196,106,47,0.1)",
  },
  {
    icon: ChatTextIcon,
    title: "Chat với lịch sử",
    desc: "AI đóng vai nhân vật lịch sử",
    href: "/chat-history",
    accentHex: "#8fb3c8",
    glow: "rgba(143,179,200,0.1)",
  },
  {
    icon: ClipboardTextIcon,
    title: "Câu đố lịch sử",
    desc: "Hàng nghìn câu hỏi theo chủ đề",
    href: "/quiz",
    accentHex: "#ffb162",
    glow: "rgba(255,177,98,0.1)",
  },
  {
    icon: BankIcon,
    title: "Thư viện",
    desc: "Tư liệu & hình ảnh lịch sử",
    href: "/library",
    accentHex: "#2f8a8e",
    glow: "rgba(47,111,115,0.1)",
  },
  {
    icon: BookmarkIcon,
    title: "Đã lưu",
    desc: "Nội dung bạn đã đánh dấu",
    href: "/saved",
    accentHex: "#e2c77a",
    glow: "rgba(226,199,122,0.1)",
  },
];

// ─────────────────────────────────────────
// Inline Fact Card (compact, inside panel)
// ─────────────────────────────────────────

function getRandomIndex(max: number, exclude?: number): number {
  if (max <= 1) return 0;
  let i: number;
  do {
    i = Math.floor(Math.random() * max);
  } while (i === exclude);
  return i;
}

function InlineFactCard() {
  const [idx, setIdx] = useState(0);
  const [fading, setFading] = useState(false);
  const gsapRef = useRef<any>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIdx(getRandomIndex(facts.length));
    import("gsap").then((m) => {
      gsapRef.current = m.gsap ?? m.default;
    });
  }, []);

  const fact = facts[idx];

  const next = useCallback(() => {
    if (fading) return;
    const g = gsapRef.current;
    if (g && bodyRef.current) {
      setFading(true);
      g.to(bodyRef.current, {
        opacity: 0,
        y: -6,
        duration: 0.15,
        ease: "power2.in",
        onComplete: () => {
          setIdx((p) => getRandomIndex(facts.length, p));
          g.fromTo(
            bodyRef.current,
            { opacity: 0, y: 8 },
            {
              opacity: 1,
              y: 0,
              duration: 0.22,
              ease: "power3.out",
              onComplete: () => setFading(false),
            },
          );
        },
      });
    } else {
      setIdx((p) => getRandomIndex(facts.length, p));
    }
  }, [fading]);

  return (
    <div
      style={{
        background: "var(--card-light-bg)",
        border: "1px solid var(--card-light-border)",
        borderRadius: 14,
        overflow: "hidden",
        boxShadow: "0 1px 8px rgba(27,38,50,0.06)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "11px 14px 10px",
          borderBottom: "1px solid var(--card-light-border)",
          background:
            "linear-gradient(to right, rgba(201,162,77,0.06), transparent)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <SparkleIcon
            size={13}
            weight="fill"
            style={{ color: "var(--accent-gold)" }}
          />
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#7a5a1e",
            }}
          >
            Bạn có biết?
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
              padding: "1px 7px",
            }}
          >
            {fact.year}
          </span>
        )}
      </div>

      {/* Body */}
      <div ref={bodyRef} style={{ padding: "12px 14px 10px" }}>
        <p
          style={{
            fontSize: 12.5,
            lineHeight: 1.75,
            color: "var(--content-text)",
            margin: 0,
          }}
        >
          {fact.content}
        </p>
        <div
          style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 10 }}
        >
          {fact.tags.map((tag) => (
            <span
              key={tag}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 3,
                fontSize: 10,
                padding: "2px 8px",
                borderRadius: 20,
                background: "rgba(201,162,77,0.08)",
                border: "1px solid rgba(201,162,77,0.2)",
                color: "#7a5a1e",
                fontWeight: 500,
              }}
            >
              <TagIcon size={9} weight="bold" />
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          padding: "0 14px 12px",
        }}
      >
        <button
          onClick={next}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            fontSize: 11,
            fontWeight: 700,
            cursor: "pointer",
            padding: "5px 11px",
            borderRadius: 7,
            background: "#e8d5a8",
            border: "1px solid #b8922a",
            color: "#5c3d0e",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#dcc88e";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#e8d5a8";
          }}
        >
          <ArrowCounterClockwiseIcon size={11} weight="bold" />
          Sự kiện khác
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Feature row item (compact horizontal)
// ─────────────────────────────────────────

function FeatureRow({
  icon: Icon,
  title,
  desc,
  href,
  accentHex,
  glow,
}: (typeof FEATURE_CARDS)[0]) {
  return (
    <Link href={href} className="group" style={{ textDecoration: "none" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 11,
          padding: "9px 12px",
          borderRadius: 11,
          border: "1px solid transparent",
          transition: "all 0.15s",
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.background = glow;
          el.style.borderColor = `${accentHex}30`;
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.background = "transparent";
          el.style.borderColor = "transparent";
        }}
      >
        {/* Icon bubble */}
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 9,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: glow,
            border: `1px solid ${accentHex}25`,
          }}
        >
          <Icon size={16} style={{ color: accentHex }} />
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              margin: 0,
              fontSize: 13,
              fontWeight: 600,
              color: "var(--content-heading)",
            }}
          >
            {title}
          </p>
          <p
            style={{
              margin: 0,
              fontSize: 11,
              color: "var(--content-muted)",
              marginTop: 1,
            }}
          >
            {desc}
          </p>
        </div>

        {/* Arrow */}
        <CaretRightIcon
          size={13}
          weight="bold"
          style={{
            color: accentHex,
            flexShrink: 0,
            opacity: 0,
            transition: "opacity 0.15s",
          }}
          className="group-hover:opacity-100"
        />
      </div>
    </Link>
  );
}

// ─────────────────────────────────────────
// Export: Left column only
// (used alongside HistoryMiniGame in page.tsx)
// ─────────────────────────────────────────

export function ExploreLeftCol() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Fact card */}
      <InlineFactCard />

      {/* Feature list */}
      <div
        style={{
          background: "var(--card-light-bg)",
          border: "1px solid var(--card-light-border)",
          borderRadius: 14,
          overflow: "hidden",
          boxShadow: "0 1px 8px rgba(27,38,50,0.06)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "11px 14px 10px",
            borderBottom: "1px solid var(--card-light-border)",
            background:
              "linear-gradient(to right, rgba(201,162,77,0.04), transparent)",
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#7a5a1e",
            }}
          >
            Khám phá
          </span>
        </div>
        <div style={{ padding: "6px 4px" }}>
          {FEATURE_CARDS.map((card) => (
            <FeatureRow key={card.href} {...card} />
          ))}
        </div>
      </div>
    </div>
  );
}
