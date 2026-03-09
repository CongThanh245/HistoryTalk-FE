"use client";

import Link from "next/link";
import { useState } from "react";
import {
  BankIcon,
  UserIcon,
  ChatTextIcon,
  ClipboardTextIcon,
  BookmarkIcon,
  CaretLeftIcon,
  CaretRightIcon,
} from "@phosphor-icons/react";

const ALL_CARDS = [
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
    title: "Trắc nghiệm",
    desc: "Hàng nghìn câu hỏi theo chủ đề",
    href: "/quiz",
    accentHex: "#e8924a",
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
    <div
      style={{
        background: "var(--card-light-bg)",
        border: "1px solid var(--card-light-border)",
        borderRadius: 14,
        overflow: "hidden",
        boxShadow: "0 1px 6px rgba(27,38,50,0.06)",
        display: "flex",
        flexDirection: "column",
        paddingBottom: "20px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "11px 11px",
        }}
      >
        {/* Pagination arrows */}
        {totalPages > 1 && (
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                border: "1px solid var(--card-light-border)",
                background: page === 0 ? "transparent" : "var(--card-light-bg)",
                color: page === 0 ? "var(--content-subtle)" : "#7a5a1e",
                cursor: page === 0 ? "default" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.15s",
              }}
            >
              <CaretLeftIcon size={11} weight="bold" />
            </button>
            <span
              style={{
                fontSize: 10,
                color: "var(--content-muted)",
                fontWeight: 600,
              }}
            >
              {page + 1}/{totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                border: "1px solid var(--card-light-border)",
                background:
                  page === totalPages - 1
                    ? "transparent"
                    : "var(--card-light-bg)",
                color:
                  page === totalPages - 1 ? "var(--content-subtle)" : "#7a5a1e",
                cursor: page === totalPages - 1 ? "default" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.15s",
              }}
            >
              <CaretRightIcon size={11} weight="bold" />
            </button>
          </div>
        )}
      </div>

      {/* 2×2 grid */}
      <div
        style={{
          padding: 10,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 15,
        }}
      >
        {visible.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group"
            style={{ textDecoration: "none" }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                padding: "12px 12px",
                borderRadius: 10,
                border: "1px solid var(--card-light-border)",
                background: "var(--card-light-bg)",
                transition: "all 0.15s",
                cursor: "pointer",
              }}
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
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: card.glow,
                  border: `1px solid ${card.accentHex}28`,
                }}
              >
                <card.icon size={16} style={{ color: card.accentHex }} />
              </div>

              {/* Text */}
              <div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 16,
                    fontWeight: 700,
                    color: "var(--content-heading)",
                    lineHeight: 1.3,
                  }}
                >
                  {card.title}
                </p>
                <p
                  style={{
                    margin: "3px 0 0",
                    fontSize: 14,
                    color: "var(--content-muted)",
                    lineHeight: 1.4,
                  }}
                >
                  {card.desc}
                </p>
              </div>

              {/* Arrow on hover */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                  fontSize: 11,
                  fontWeight: 600,
                  color: card.accentHex,
                  opacity: 0,
                }}
                className="group-hover:opacity-100"
              >
                Mở <CaretRightIcon size={10} weight="bold" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
