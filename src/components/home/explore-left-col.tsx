"use client";

import Link from "next/link";
import { useState, useCallback, useEffect, useRef } from "react";
import {
  Landmark,
  User,
  MessageSquareText,
  ClipboardList,
  Bookmark,
  ChevronRight,
  Sparkles,
  RefreshCcw,
  Tag,
} from "lucide-react";
import { facts } from "@/store/fact";

// ─────────────────────────────────────────
// Feature list data
// ─────────────────────────────────────────

const FEATURE_CARDS = [
  {
    icon: Landmark,
    title: "Sự kiện lịch sử",
    desc: "Dòng thời gian tương tác",
    href: "/events",
    accentHex: "#c9a24d",
    glow: "rgba(201,162,77,0.1)",
  },
  {
    icon: User,
    title: "Nhân vật",
    desc: "Những người làm thay đổi lịch sử",
    href: "/characters",
    accentHex: "#c46a2f",
    glow: "rgba(196,106,47,0.1)",
  },
  {
    icon: MessageSquareText,
    title: "Chat với lịch sử",
    desc: "AI đóng vai nhân vật lịch sử",
    href: "/chat-history",
    accentHex: "#8fb3c8",
    glow: "rgba(143,179,200,0.1)",
  },
  {
    icon: ClipboardList,
    title: "Câu đố lịch sử",
    desc: "Hàng nghìn câu hỏi theo chủ đề",
    href: "/quiz",
    accentHex: "#ffb162",
    glow: "rgba(255,177,98,0.1)",
  },
  {
    icon: Landmark,
    title: "Thư viện",
    desc: "Tư liệu & hình ảnh lịch sử",
    href: "/library",
    accentHex: "#2f8a8e",
    glow: "rgba(47,111,115,0.1)",
  },
  {
    icon: Bookmark,
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
    <div className="bg-card-light-bg border border-card-light-border rounded-[14px] overflow-hidden shadow-[0_1px_8px_rgba(27,38,50,0.06)]">
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 pt-[11px] pb-2.5 border-b border-card-light-border bg-gradient-to-r from-accent-gold/[0.06] to-transparent">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-[13px] h-[13px] text-accent-gold" fill="currentColor" />
          <span className="text-[10px] font-extrabold tracking-[0.12em] uppercase text-[#7a5a1e]">
            Bạn có biết?
          </span>
        </div>
        {fact.year && (
          <span className="text-[10px] font-extrabold text-[#8a4a1a] bg-[rgba(196,106,47,0.1)] border border-[rgba(196,106,47,0.22)] rounded-[5px] px-[7px] py-px">
            {fact.year}
          </span>
        )}
      </div>

      {/* Body */}
      <div ref={bodyRef} className="px-3.5 pt-3 pb-2.5">
        <p className="text-[12.5px] leading-[1.75] text-content-text m-0">
          {fact.content}
        </p>
        <div className="flex flex-wrap gap-[5px] mt-2.5">
          {fact.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-[3px] text-[10px] px-2 py-0.5 rounded-[20px] bg-accent-gold/[0.08] border border-accent-gold/20 text-[#7a5a1e] font-medium"
            >
              <Tag className="w-[9px] h-[9px]" strokeWidth={2.5} />
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end px-3.5 pb-3">
        <button
          onClick={next}
          className="inline-flex items-center gap-[5px] text-[11px] font-bold cursor-pointer px-[11px] py-[5px] rounded-[7px] bg-[#e8d5a8] border border-[#b8922a] text-[#5c3d0e] transition-colors duration-150 hover:bg-[#dcc88e]"
        >
          <RefreshCcw className="w-[11px] h-[11px]" strokeWidth={2.5} />
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
    <Link href={href} className="group no-underline">
      <div
        className="flex items-center gap-[11px] px-3 py-[9px] rounded-[11px] border border-transparent transition-all duration-150"
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
          className="w-[34px] h-[34px] rounded-[9px] shrink-0 flex items-center justify-center"
          style={{
            background: glow,
            border: `1px solid ${accentHex}25`,
          }}
        >
          <Icon size={16} style={{ color: accentHex }} />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="m-0 text-[13px] font-semibold text-content-heading">
            {title}
          </p>
          <p className="m-0 text-[11px] text-content-muted mt-px">
            {desc}
          </p>
        </div>

        {/* Arrow */}
        <ChevronRight
          size={13}
          strokeWidth={2.5}
          className="shrink-0 opacity-0 transition-opacity duration-150 group-hover:opacity-100"
          style={{ color: accentHex }}
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
    <div className="flex flex-col gap-3">
      {/* Fact card */}
      <InlineFactCard />

      {/* Feature list */}
      <div className="bg-card-light-bg border border-card-light-border rounded-[14px] overflow-hidden shadow-[0_1px_8px_rgba(27,38,50,0.06)]">
        <div className="flex items-center gap-1.5 px-3.5 pt-[11px] pb-2.5 border-b border-card-light-border bg-gradient-to-r from-accent-gold/[0.04] to-transparent">
          <span className="text-[10px] font-extrabold tracking-[0.12em] uppercase text-[#7a5a1e]">
            Khám phá
          </span>
        </div>
        <div className="py-1.5 px-1">
          {FEATURE_CARDS.map((card) => (
            <FeatureRow key={card.href} {...card} />
          ))}
        </div>
      </div>
    </div>
  );
}
