"use client";

import Link from "next/link";
import {
  Shield,
  Scroll,
  Users,
  ClipboardList,
  ChevronRight,
} from "lucide-react";

import { StaffShell } from "@/components/staff/staff-shell";
import { ROUTES } from "@/constants/routes";

const MODULES = [
  {
    icon: Scroll,
    title: "Quản lý bối cảnh lịch sử",
    desc: "Tạo/cập nhật bối cảnh lịch sử để dùng cho sự kiện và cuộc trò chuyện.",
    href: ROUTES.STAFF.CONTEXTS,
    accent: "var(--accent-gold)",
    glow: "rgba(201,162,77,0.12)",
  },
  {
    icon: Users,
    title: "Manage Character",
    desc: "Quản lý nhân vật: tiểu sử, vai trò, thời kỳ để dùng cho chat/quiz.",
    href: ROUTES.STAFF.CHARACTERS,
    accent: "var(--accent-bronze)",
    glow: "rgba(196,106,47,0.12)",
  },
  {
    icon: ClipboardList,
    title: "Quản lý câu đố",
    desc: "Quản lý quiz theo chủ đề, độ khó và số câu hỏi.",
    href: ROUTES.STAFF.QUIZZES,
    accent: "var(--accent-blue)",
    glow: "rgba(143,179,200,0.12)",
  },
] as const;

export default function StaffPage() {
  return (
    <StaffShell
      title="Quản trị"
      description="Màn hình dành cho role Staff. Chọn module ở sidebar để thao tác nhanh."
      icon={Shield}
      accent="var(--accent-gold)"
    >
      <section>
        <h2 className="text-base font-semibold mb-4 text-content-heading">
          Các module quản trị
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {MODULES.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.href}
                href={card.href}
                className="group relative flex flex-col gap-3 rounded-xl p-5 border transition-all duration-200 overflow-hidden bg-card-light-bg border-card-light-border"
              >
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{
                    background: `radial-gradient(ellipse at top left, ${card.glow} 0%, transparent 65%)`,
                  }}
                />
                <div
                  className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{ boxShadow: `inset 0 0 0 1px ${card.accent}40` }}
                />

                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110"
                  style={{
                    background: card.glow,
                    border: `1px solid ${card.accent}30`,
                  }}
                >
                  <Icon className="w-5 h-5" style={{ color: card.accent }} />
                </div>

                <div className="relative z-10 flex-1">
                  <h3 className="text-sm font-semibold mb-1 text-content-heading">
                    {card.title}
                  </h3>
                  <p className="text-xs leading-relaxed text-content-muted">
                    {card.desc}
                  </p>
                </div>

                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-200">
                  <ChevronRight
                    className="w-4 h-4"
                    style={{ color: card.accent }}
                  />
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </StaffShell>
  );
}
