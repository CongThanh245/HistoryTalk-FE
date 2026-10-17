"use client";

import Link from "next/link";
import { BookOpen, ChevronRight, UserRound, type LucideIcon } from "lucide-react";
import { LocalScopeTag, QueryState, localMeta } from "@/components/saas/local-content-ui";
import { ROUTES } from "@/constants/routes";
import { showsInClass, useStudentLocalContent, useTeacherLocalContent } from "@/features/saas/hooks-local-content";
import type { LocalKind } from "@/services/local-content.service";

const KIND_META: Record<LocalKind, { label: string; color: string; icon: LucideIcon }> = {
  CONTEXT: { label: "Bối cảnh", color: "var(--jade)", icon: BookOpen },
  CHARACTER: { label: "Nhân vật", color: "var(--accent-gold)", icon: UserRound },
};

export const localContentHref = (classId: string, contentId: string, kind?: LocalKind) =>
  `${ROUTES.CLASS_DETAIL(classId)}/local/${contentId}${kind ? `?kind=${kind}` : ""}`;

/**
 * Published local contexts / characters of the school (Role Matrix row 14): those assigned to this class, plus
 * items not assigned to any class.
 */
export function StudentLocalContentList({ classroom, role }: { classroom: { id: string; name: string }; role: string | null }) {
  const isTeacher = role === "TEACHER";
  const student = useStudentLocalContent(role === "SCHOOL_STUDENT");
  const teacher = useTeacherLocalContent(isTeacher);
  const query = isTeacher ? teacher : student;
  const items = (isTeacher ? [...teacher.contexts, ...teacher.characters] : student.items)
    .filter((i) => i.isPublished && showsInClass(i, classroom.id))
    .sort((a, b) => a.contentScope.localeCompare(b.contentScope) || a.type.localeCompare(b.type) || a.name.localeCompare(b.name, "vi"));

  return (
    <QueryState isLoading={query.isLoading} isError={query.isError} error={query.error} onRetry={query.refetch}>
      {items.length === 0 ? (
        <p className="text-[13px] text-content-muted">Lớp {classroom.name} chưa có tư liệu lớp hay tư liệu trường nào.</p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const meta = KIND_META[item.type];
            const Icon = meta.icon;
            return (
              <li key={`${item.type}-${item.id}`}>
                <Link
                  href={localContentHref(classroom.id, item.id, item.type)}
                  className="group flex h-full items-center gap-3 rounded-[2px] border border-[var(--border-strong)] bg-[var(--bg-surface)] p-3 motion-safe:transition-colors hover:border-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-gold)]"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[2px] text-white" style={{ background: meta.color }} aria-hidden="true">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-1.5">
                      <LocalScopeTag item={item} />
                      <span className="text-[11px] font-bold" style={{ color: meta.color }}>
                        {meta.label}
                      </span>
                    </span>
                    <span className="block truncate text-[14px] font-semibold text-content-text group-hover:text-[var(--accent-gold)]">{item.name}</span>
                    <span className="block truncate text-[12px] text-content-muted">{localMeta(item)}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-content-muted" aria-hidden="true" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </QueryState>
  );
}
