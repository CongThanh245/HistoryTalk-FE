"use client";

import Link from "next/link";
import { BookOpen, ChevronRight, ListChecks, UserRound, type LucideIcon } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { localTitle, useClassLocalContent } from "@/features/saas/hooks-student";
import type { Classroom, LocalContentKind } from "@/features/saas/types";

const KIND_META: Record<LocalContentKind, { label: string; color: string; icon: LucideIcon }> = {
  CONTEXT: { label: "Bối cảnh", color: "var(--jade)", icon: BookOpen },
  CHARACTER: { label: "Nhân vật", color: "var(--accent-gold)", icon: UserRound },
  QUIZ: { label: "Luyện tập", color: "var(--men-lam)", icon: ListChecks },
};

export const localContentHref = (classId: string, contentId: string) => `${ROUTES.CLASS_DETAIL(classId)}/local/${contentId}`;

/** Published local history content shared with a class (Role Matrix row 14). */
export function StudentLocalContentList({ classroom, role }: { classroom: Classroom; role: string | null }) {
  const items = useClassLocalContent(classroom.id, role);
  if (items.length === 0) {
    return <p className="text-[13px] text-content-muted">Lớp {classroom.name} chưa có tư liệu địa phương nào.</p>;
  }
  return (
    <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => {
        const meta = KIND_META[item.kind];
        const Icon = meta.icon;
        const sub =
          item.kind === "CONTEXT"
            ? `${item.location} · ${item.year}`
            : item.kind === "CHARACTER"
              ? item.title
              : `${item.questions.length} câu · ${item.durationMinutes} phút`;
        return (
          <li key={item.id}>
            <Link
              href={localContentHref(classroom.id, item.id)}
              className="group flex h-full items-center gap-3 rounded-[2px] border border-[var(--border-strong)] bg-[var(--bg-surface)] p-3 motion-safe:transition-colors hover:border-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-gold)]"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[2px] text-white" style={{ background: meta.color }} aria-hidden="true">
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[11px] font-bold" style={{ color: meta.color }}>
                  {meta.label}
                </span>
                <span className="block truncate text-[14px] font-semibold text-content-text group-hover:text-[var(--accent-gold)]">{localTitle(item)}</span>
                <span className="block truncate text-[12px] text-content-muted">{sub}</span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-content-muted" aria-hidden="true" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
