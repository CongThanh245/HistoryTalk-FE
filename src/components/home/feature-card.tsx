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
    accentHex: "#e8924a",
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
    accentHex: "#b89a3a",
    glow: "rgba(226,199,122,0.1)",
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
    <div className="bg-card-light-bg border border-card-light-border rounded-[14px] overflow-hidden shadow-[0_1px_6px_rgba(27,38,50,0.06)] flex flex-col pb-5">
      {/* Header */}
      <div className="flex items-center justify-between p-[11px]">
        {/* Pagination arrows */}
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className={`w-6 h-6 rounded-md border border-card-light-border flex items-center justify-center transition-all duration-150 ${
                page === 0
                  ? "bg-transparent text-content-subtle cursor-default"
                  : "bg-card-light-bg text-[#7a5a1e] cursor-pointer"
              }`}
            >
              <ChevronLeft size={11} strokeWidth={2.5} />
            </button>
            <span className="text-[10px] text-content-muted font-semibold">
              {page + 1}/{totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className={`w-6 h-6 rounded-md border border-card-light-border flex items-center justify-center transition-all duration-150 ${
                page === totalPages - 1
                  ? "bg-transparent text-content-subtle cursor-default"
                  : "bg-card-light-bg text-[#7a5a1e] cursor-pointer"
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
            className="group no-underline"
          >
            <div
              className="flex flex-col gap-2.5 p-3 rounded-[10px] border border-card-light-border bg-card-light-bg transition-all duration-150 cursor-pointer"
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = card.glow;
                el.style.borderColor = `${card.accentHex}40`;
                el.style.transform = "translateY(-1px)";
                el.style.boxShadow = `0 4px 16px ${card.accentHex}14`;
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = "var(--card-light-bg)";
                el.style.borderColor = "var(--card-light-border)";
                el.style.transform = "translateY(0)";
                el.style.boxShadow = "none";
              }}
            >
              {/* Icon */}
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{
                  background: card.glow,
                  border: `1px solid ${card.accentHex}28`,
                }}
              >
                <card.icon size={16} style={{ color: card.accentHex }} />
              </div>

              {/* Text */}
              <div>
                <p className="m-0 text-base font-bold text-content-heading leading-[1.3]">
                  {card.title}
                </p>
                <p className="m-0 mt-[3px] text-sm text-content-muted leading-[1.4]">
                  {card.desc}
                </p>
              </div>

              <div
                className="flex items-center gap-[3px] text-[11px] font-semibold opacity-60 group-hover:opacity-100 transition-opacity mt-1"
                style={{ color: card.accentHex }}
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
