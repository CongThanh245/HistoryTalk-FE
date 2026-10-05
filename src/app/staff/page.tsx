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
  },
  {
    icon: Users,
    title: "Manage Character",
    desc: "Quản lý nhân vật: tiểu sử, vai trò, thời kỳ để dùng cho chat/quiz.",
    href: ROUTES.STAFF.CHARACTERS,
    accent: "var(--accent-bronze)",
  },
  {
    icon: ClipboardList,
    title: "Quản lý câu đố",
    desc: "Quản lý quiz theo chủ đề, độ khó và số câu hỏi.",
    href: ROUTES.STAFF.QUIZZES,
    accent: "var(--accent-blue)",
  },
] as const;

export default function StaffPage() {
  return (
    <StaffShell
      title="Quản trị"
      label="Điều hành"
      description="Màn hình dành cho role Staff. Chọn module ở sidebar để thao tác nhanh."
      icon={Shield}
      accent="var(--accent-gold)"
    >
      <section>
        <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
          Các module quản trị
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {MODULES.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.href}
                href={card.href}
                className="group relative flex flex-col gap-3 rounded-[2px] p-5 border transition-colors duration-200 overflow-hidden bg-[var(--bg-surface)] border-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
              >
                <div className="w-10 h-10 rounded-[2px] flex items-center justify-center shrink-0 border border-[var(--border-strong)] bg-[var(--bg-elevated)]">
                  <Icon className="w-5 h-5" style={{ color: card.accent }} />
                </div>

                <div className="relative z-10 flex-1">
                  <h3 className="text-sm font-semibold mb-1 text-content-heading transition-colors group-hover:text-[var(--accent-gold)]">
                    {card.title}
                  </h3>
                  <p className="text-xs leading-relaxed text-content-muted">
                    {card.desc}
                  </p>
                </div>

                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-200">
                  <ChevronRight className="w-4 h-4 text-[var(--accent-gold)]" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </StaffShell>
  );
}
