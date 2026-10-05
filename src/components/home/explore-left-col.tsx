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
  },
  {
    icon: User,
    title: "Nhân vật",
    desc: "Những người làm thay đổi lịch sử",
    href: "/characters",
  },
  {
    icon: MessageSquareText,
    title: "Chat với lịch sử",
    desc: "AI đóng vai nhân vật lịch sử",
    href: "/chat-history",
  },
  {
    icon: ClipboardList,
    title: "Câu đố lịch sử",
    desc: "Hàng nghìn câu hỏi theo chủ đề",
    href: "/quiz",
  },
  {
    icon: Landmark,
    title: "Thư viện",
    desc: "Tư liệu & hình ảnh lịch sử",
    href: "/library",
  },
  {
    icon: Bookmark,
    title: "Đã lưu",
    desc: "Nội dung bạn đã đánh dấu",
    href: "/saved",
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
    <div className="bg-[var(--bg-surface)] border border-[var(--text-primary)] rounded-[2px] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 pt-[11px] pb-2.5 border-b border-[var(--text-primary)]">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-[13px] h-[13px] text-accent-gold" fill="currentColor" />
          <span className="font-display text-[17px] font-extrabold leading-[1.1] uppercase text-content-heading">
            Bạn có biết?
          </span>
        </div>
        {fact.year && (
          <span className="font-display text-[13px] font-extrabold text-white bg-[var(--accent-gold)] rounded-[2px] px-[7px] py-px">
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
              className="inline-flex items-center gap-[3px] text-[10px] px-2 py-0.5 rounded-[2px] border border-[var(--border-strong)] text-[var(--text-secondary)] font-semibold"
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
          className="btn-line min-h-[30px] px-[11px] gap-[5px] text-[11px] cursor-pointer"
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
}: (typeof FEATURE_CARDS)[0]) {
  return (
    <Link href={href} className="group block no-underline">
      <div className="flex items-center gap-[11px] px-3.5 py-[9px] border-b border-[var(--border-default)] transition-colors duration-150 group-last:border-b-0 group-hover:bg-[var(--text-primary)]">
        {/* Icon bubble */}
        <div className="w-[34px] h-[34px] rounded-[2px] shrink-0 flex items-center justify-center border border-[var(--border-strong)] bg-[var(--bg-elevated)] text-[var(--accent-gold)] transition-colors duration-150 group-hover:border-[var(--accent-on-ink)] group-hover:bg-transparent group-hover:text-[var(--accent-on-ink)]">
          <Icon size={16} />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="m-0 text-[13px] font-bold text-content-heading transition-colors duration-150 group-hover:text-[var(--text-inverse)]">
            {title}
          </p>
          <p className="m-0 text-[11px] text-content-muted mt-px transition-colors duration-150 group-hover:text-[var(--text-inverse)] group-hover:opacity-70">
            {desc}
          </p>
        </div>

        {/* Arrow */}
        <ChevronRight
          size={13}
          strokeWidth={2.5}
          className="shrink-0 opacity-0 text-[var(--text-inverse)] transition-opacity duration-150 group-hover:opacity-100"
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
      <div className="bg-[var(--bg-surface)] border border-[var(--text-primary)] rounded-[2px] overflow-hidden">
        <div className="flex items-center gap-1.5 px-3.5 pt-[11px] pb-2.5 border-b border-[var(--text-primary)]">
          <span className="font-display text-[17px] font-extrabold leading-[1.1] uppercase text-content-heading">
            Khám phá
          </span>
        </div>
        <div>
          {FEATURE_CARDS.map((card) => (
            <FeatureRow key={card.href} {...card} />
          ))}
        </div>
      </div>
    </div>
  );
}
