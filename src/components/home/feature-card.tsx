"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Landmark,
  User,
  MessageSquareText,
  ClipboardList,
  Bookmark,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const ALL_CARDS = [
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

// Show 4 cards per page in a 2×2 grid
const PAGE_SIZE = 6;

export function FeatureCards() {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(ALL_CARDS.length / PAGE_SIZE);
  const visible = ALL_CARDS.slice(
    page * PAGE_SIZE,
    page * PAGE_SIZE + PAGE_SIZE,
  );

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--text-primary)] rounded-[2px] overflow-hidden flex flex-col pb-5">
      {/* Header */}
      <div className="flex items-center justify-between p-[11px]">
        {/* Pagination arrows */}
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className={`w-6 h-6 rounded-[2px] border flex items-center justify-center transition-colors duration-150 ${
                page === 0
                  ? "bg-transparent border-[var(--border-default)] text-content-subtle cursor-default"
                  : "bg-transparent border-[var(--text-primary)] text-[var(--text-primary)] cursor-pointer hover:bg-[var(--text-primary)] hover:text-[var(--text-inverse)]"
              }`}
            >
              <ChevronLeft size={11} strokeWidth={2.5} />
            </button>
            <span className="text-[10px] text-content-muted font-bold tracking-[0.1em]">
              {page + 1}/{totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className={`w-6 h-6 rounded-[2px] border flex items-center justify-center transition-colors duration-150 ${
                page === totalPages - 1
                  ? "bg-transparent border-[var(--border-default)] text-content-subtle cursor-default"
                  : "bg-transparent border-[var(--text-primary)] text-[var(--text-primary)] cursor-pointer hover:bg-[var(--text-primary)] hover:text-[var(--text-inverse)]"
              }`}
            >
              <ChevronRight size={11} strokeWidth={2.5} />
            </button>
          </div>
        )}
      </div>

      {/* 2×2 grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5">
        {visible.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group block no-underline"
          >
            <div className="h-full flex flex-col gap-2.5 p-3 rounded-[2px] border border-[var(--border-strong)] bg-[var(--bg-elevated)] transition-colors duration-150 cursor-pointer group-hover:border-[var(--text-primary)] group-hover:bg-[var(--text-primary)]">
              {/* Icon */}
              <div className="w-8 h-8 rounded-[2px] flex items-center justify-center border border-[var(--border-strong)] text-[var(--accent-gold)] transition-colors duration-150 group-hover:border-[var(--accent-on-ink)] group-hover:text-[var(--accent-on-ink)]">
                <card.icon size={16} />
              </div>

              {/* Text */}
              <div>
                <p className="m-0 archive-title is-plain text-[19px] transition-colors duration-150 group-hover:text-[var(--text-inverse)]">
                  {card.title}
                </p>
                <p className="m-0 mt-[3px] text-sm text-content-muted leading-[1.4] transition-colors duration-150 group-hover:text-[var(--text-inverse)] group-hover:opacity-70">
                  {card.desc}
                </p>
              </div>

              <div
                className="flex items-center gap-[3px] text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--gold-on-light)] opacity-80 group-hover:opacity-100 group-hover:text-[var(--accent-on-ink)] transition-[opacity,color] mt-1"
              >
                Khám phá ngay <ChevronRight size={10} strokeWidth={2.5} />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
