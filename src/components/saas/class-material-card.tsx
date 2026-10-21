"use client";

// The tu lieu (boi canh / nhan vat GV soan) dung chung cho Kho tu lieu va trang lop cua hoc sinh.
import * as React from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, MessageCircle, UserRound } from "lucide-react";

import { LocalScopeTag, localMeta } from "@/components/saas/local-content-ui";
import { assignmentBucket, parseLocal } from "@/components/saas/student-assignment-card";
import { ROUTES } from "@/constants/routes";
import { useMyAssignments } from "@/features/saas/hooks-assignment-api";
import type { StudentAssignment } from "@/services/assignment.service";
import type { LocalItem, LocalKind } from "@/services/local-content.service";
import { cn } from "@/lib/utils/cn";

export const KIND_LABEL: Record<LocalKind, string> = { CONTEXT: "Bối cảnh", CHARACTER: "Nhân vật" };
const KIND_ACTION: Record<LocalKind, string> = { CONTEXT: "Đọc", CHARACTER: "Trò chuyện" };
const KIND_ICON: Record<LocalKind, typeof BookOpen> = { CONTEXT: BookOpen, CHARACTER: UserRound };
const NEW_DAYS = 7;

/** Bai tap cua hoc sinh gan voi tu lieu nay (bai doc boi canh / bai tro chuyen nhan vat). */
export type Task = { assignment: StudentAssignment; done: boolean };

// Bai tap con phai lam (chua nop, chua het han) uu tien hon bai da xong.
export function useAssignmentTasks(enabled: boolean) {
  const assignments = useMyAssignments({ page: 0, size: 100 }, enabled);
  return React.useMemo(() => {
    const map = new Map<string, Task>();
    for (const a of assignments.data?.items ?? []) {
      if (a.assignmentType === "QUIZ_TEST") continue;
      const bucket = assignmentBucket(a);
      if (bucket === "EXEMPTED") continue;
      const task: Task = { assignment: a, done: bucket === "DONE" };
      const prev = map.get(a.targetId);
      if (!prev || (prev.done && !task.done)) map.set(a.targetId, task);
    }
    return map;
  }, [assignments.data]);
}

const shortDate = (value: string) => {
  const d = parseLocal(value);
  return d ? `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}` : "";
};

export function MaterialCard({ item, task, teacher }: { item: LocalItem; task?: Task; teacher: boolean }) {
  const Icon = KIND_ICON[item.type];
  const created = parseLocal(item.createdAt)?.getTime() ?? 0;
  const isNew = Date.now() - created < NEW_DAYS * 86_400_000;
  const todo = task && !task.done;

  return (
    <Link
      href={ROUTES.CLASS_MATERIAL_DETAIL(item.type, item.id)}
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-[2px] border bg-[var(--bg-surface)] motion-safe:transition-colors hover:border-[var(--accent-gold)] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--accent-gold)]",
        todo ? "border-[var(--accent-gold)]" : "border-[var(--border-strong)]",
      )}
    >
      <div className="relative h-28 shrink-0 overflow-hidden bg-[var(--bg-elevated)]">
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.imageUrl} alt="" className="h-full w-full object-cover motion-safe:transition-transform group-hover:scale-[1.03]" />
        ) : (
          <div
            className={cn(
              "grid h-full w-full place-items-center",
              item.type === "CHARACTER"
                ? "bg-[color-mix(in_srgb,var(--accent-gold)_14%,var(--bg-surface))] text-[var(--accent-gold)]"
                : "bg-[color-mix(in_srgb,var(--jade)_14%,var(--bg-surface))] text-[var(--jade)]",
            )}
          >
            <Icon className="h-10 w-10 opacity-80" aria-hidden="true" />
          </div>
        )}
        <span className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {todo && (
            <span className="rounded-[2px] bg-[var(--accent-gold)] px-2 py-0.5 text-[11px] font-bold text-[#FFFFFF]">
              Bài tập · hạn {shortDate(task.assignment.deadline)}
            </span>
          )}
          {task?.done && (
            <span className="rounded-[2px] bg-[var(--jade)] px-2 py-0.5 text-[11px] font-bold text-[#FFFFFF]">Đã làm bài</span>
          )}
          {isNew && !task && (
            <span className="rounded-[2px] bg-[var(--text-primary)] px-2 py-0.5 text-[11px] font-bold text-[var(--text-inverse)]">Mới</span>
          )}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <span className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.08em] text-content-muted">
          <Icon className="h-3.5 w-3.5" aria-hidden="true" /> {KIND_LABEL[item.type]}
          {teacher && <LocalScopeTag item={item} label={item.contentScope === "SCHOOL_WIDE" ? "Cả trường thấy" : "Lớp được giao thấy"} />}
        </span>
        <span className="archive-title is-plain block text-lg leading-snug text-content-text group-hover:text-[var(--accent-gold)]">{item.name}</span>
        <span className="text-[12px] text-content-muted">{localMeta(item)}</span>
        {item.description && <span className="line-clamp-2 text-sm leading-relaxed text-content-muted">{item.description}</span>}
        <span className="mt-auto flex items-center justify-between gap-2 pt-2">
          <span className="truncate text-[12px] text-content-muted">{item.createdBy?.fullName && `Soạn bởi ${item.createdBy.fullName}`}</span>
          <span className="inline-flex shrink-0 items-center gap-1 text-[13px] font-bold text-[var(--accent-gold)]">
            {item.type === "CHARACTER" ? <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" /> : null}
            {KIND_ACTION[item.type]} <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
        </span>
      </div>
    </Link>
  );
}
