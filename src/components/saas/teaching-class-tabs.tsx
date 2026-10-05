"use client";

import Link from "next/link";
import { ArrowRight, BookMarked, ClipboardList, MapPin, Plus } from "lucide-react";

import { formatNumber } from "@/components/saas/saas-ui";
import {
  AssignmentStateBadge,
  AssignmentTypeBadge,
  KpiTile,
  LocalStatusBadge,
  ProgressBar,
  ScoreValue,
  SubmissionStatusBadge,
  TD,
  TH,
  TR,
  TableShell,
} from "@/components/saas/teaching-ui";
import { ROUTES } from "@/constants/routes";
import {
  LOCAL_KIND_LABELS,
  assignmentState,
  effectiveStatus,
  formatDateTime,
  formatPercent,
  formatScore,
  localTitle,
  relativeDue,
  score10,
  useDashboardStats,
  type TeachingData,
} from "@/features/saas/hooks-teaching";
import { useDemoStudentId } from "@/features/saas/store";
import type { Classroom, LocalContent } from "@/features/saas/types";
import { cn } from "@/lib/utils/cn";

const mapHref = (classId: string) => `${ROUTES.HISTORICAL_MAP}?layer=class&classId=${encodeURIComponent(classId)}`;

function sortedForClass(data: TeachingData, classId: string) {
  return data.assignments
    .filter((a) => a.classId === classId)
    .map((a) => ({ a, state: assignmentState(a) }))
    .sort((x, y) => {
      const rank = (s: string) => (s === "DUE_SOON" ? 0 : s === "OPEN" ? 1 : s === "UPCOMING" ? 2 : 3);
      return rank(x.state) - rank(y.state) || x.a.dueAt.localeCompare(y.a.dueAt);
    });
}

/* ───────────────────────── Teacher tabs ───────────────────────── */

export function TeacherAssignmentsTab({ data, classroom }: { data: TeachingData; classroom: Classroom }) {
  const rows = sortedForClass(data, classroom.id);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-content-muted">{rows.length} bài đã giao cho lớp.</p>
        <Link href={`${ROUTES.TEACHING.ASSIGNMENT_NEW}?classId=${encodeURIComponent(classroom.id)}`} className="btn-crimson">
          <Plus className="h-4 w-4" aria-hidden="true" /> Giao bài tập
        </Link>
      </div>
      {rows.length === 0 ? (
        <p className="rounded-[2px] border border-dashed border-[var(--border-strong)] p-6 text-center text-sm text-content-muted">Lớp chưa có bài tập nào.</p>
      ) : (
        <TableShell>
          <thead>
            <tr className="border-b border-[var(--border-strong)]">
              <th className={TH}>Loại</th>
              <th className={TH}>Bài tập</th>
              <th className={TH}>Hạn nộp</th>
              <th className={TH}>Đã nộp</th>
              <th className={TH}>Điểm TB</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ a, state }) => {
              const p = data.progress.get(a.id);
              return (
                <tr key={a.id} className={TR}>
                  <td className={TD}>
                    <AssignmentTypeBadge type={a.type} />
                  </td>
                  <td className={cn(TD, "max-w-[320px]")}>
                    <Link href={ROUTES.TEACHING.ASSIGNMENT_DETAIL(a.id)} className="font-semibold text-content-heading hover:text-[var(--accent-gold)]">
                      {a.title}
                    </Link>
                  </td>
                  <td className={TD}>
                    <span className="block tabular-nums">{formatDateTime(a.dueAt)}</span>
                    <AssignmentStateBadge state={state} />
                  </td>
                  <td className={TD}>
                    <ProgressBar done={p?.done ?? 0} total={p?.total ?? 0} />
                  </td>
                  <td className={cn(TD, "text-center")}>{a.type === "TEST" ? <ScoreValue value={p?.average ?? null} /> : <span className="text-content-subtle">—</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </TableShell>
      )}
    </div>
  );
}

function LocalList({ items, hrefFor, showStatus }: { items: LocalContent[]; hrefFor: (c: LocalContent) => string; showStatus: boolean }) {
  return (
    <ul className="divide-y divide-[var(--border-default)] border-y border-[var(--text-primary)]">
      {items.map((c) => (
        <li key={c.id}>
          <Link href={hrefFor(c)} className="group flex flex-wrap items-center gap-x-3 gap-y-1 py-3">
            <span className="w-20 shrink-0 text-xs font-bold uppercase tracking-[0.08em] text-content-muted">{LOCAL_KIND_LABELS[c.kind]}</span>
            <span className="min-w-0 flex-1 font-semibold text-content-heading group-hover:text-[var(--accent-gold)]">{localTitle(c)}</span>
            {showStatus && <LocalStatusBadge status={c.status} />}
            <ArrowRight className="h-4 w-4 shrink-0 text-content-muted" aria-hidden="true" />
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function TeacherLocalTab({ data, classroom }: { data: TeachingData; classroom: Classroom }) {
  const items = data.localContent
    .filter((c) => c.classIds.includes(classroom.id) && c.status !== "TRASH" && (c.authorId === data.teacherId || c.status === "PUBLISHED"))
    .sort((a, b) => a.kind.localeCompare(b.kind) || b.updatedAt.localeCompare(a.updatedAt));
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-content-muted">Nội dung địa phương hiển thị cho lớp {classroom.name}. Học sinh chỉ thấy nội dung đã xuất bản.</p>
        <Link href={ROUTES.TEACHING.LOCAL} className="btn-line">
          <BookMarked className="h-4 w-4" aria-hidden="true" /> Quản lý nội dung
        </Link>
      </div>
      {items.length === 0 ? (
        <p className="rounded-[2px] border border-dashed border-[var(--border-strong)] p-6 text-center text-sm text-content-muted">Chưa có nội dung địa phương nào cho lớp.</p>
      ) : (
        <LocalList items={items} hrefFor={(c) => ROUTES.TEACHING.LOCAL_EDIT(c.id)} showStatus />
      )}
    </div>
  );
}

export function ClassMapTab({ data, classroom }: { data: TeachingData; classroom: Classroom }) {
  const pins = data.classPins.filter((p) => p.classId === classroom.id);
  const assignmentPins = pins.filter((p) => p.kind === "ASSIGNMENT").length;
  const localWithCoords = data.localContent.filter(
    (c) => c.kind === "CONTEXT" && c.status === "PUBLISHED" && c.classIds.includes(classroom.id) && c.latitude != null,
  ).length;
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiTile label="Điểm ghim của lớp" value={pins.length} icon={<MapPin className="h-4 w-4 text-[var(--men-lam)]" aria-hidden="true" />} />
        <KpiTile label="Ghim bài tập" value={assignmentPins} />
        <KpiTile label="Bối cảnh có tọa độ" value={localWithCoords} hint="Lịch sử địa phương đã xuất bản" />
      </div>
      <Link href={mapHref(classroom.id)} className="btn-ink w-full sm:w-auto">
        Mở bản đồ lớp <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </div>
  );
}

export function TeacherStatsTab({ data, classroom }: { data: TeachingData; classroom: Classroom }) {
  const stats = useDashboardStats(data, [classroom.id]);
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiTile label="Bài đang mở" value={stats.openAssignments.length} />
        <KpiTile label="Tỷ lệ nộp bài" value={formatPercent(stats.submissionRate)} accent="text-[var(--jade)]" />
        <KpiTile label="Điểm TB kiểm tra" value={formatScore(stats.averageScore)} accent="text-[var(--men-lam)]" />
        <KpiTile label="Tin nhắn AI · 7 ngày" value={formatNumber(stats.messages7)} accent="text-[var(--gold-leaf)]" />
      </div>
      {stats.attention.length > 0 && (
        <p className="text-sm text-[var(--text-secondary)]">
          <span className="font-bold text-[var(--status-warning)]">{stats.attention.length} học sinh cần quan tâm</span> (thiếu từ 2 bài hoặc điểm TB dưới 5).
        </p>
      )}
      <Link href={`${ROUTES.TEACHING.HOME}?classId=${encodeURIComponent(classroom.id)}`} className="archive-link">
        Xem tổng quan đầy đủ <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
      </Link>
    </div>
  );
}

/* ───────────────────────── Student tabs ───────────────────────── */

export function StudentAssignmentsTab({ data, classroom }: { data: TeachingData; classroom: Classroom }) {
  const me = useDemoStudentId();
  const rows = sortedForClass(data, classroom.id).filter(({ state }) => state !== "UPCOMING");
  if (rows.length === 0) {
    return (
      <p className="flex items-center justify-center gap-2 rounded-[2px] border border-dashed border-[var(--border-strong)] p-6 text-sm text-content-muted">
        <ClipboardList className="h-4 w-4" aria-hidden="true" /> Lớp chưa có bài tập nào.
      </p>
    );
  }
  return (
    <ul className="divide-y divide-[var(--border-default)] border-y border-[var(--text-primary)]">
      {rows.map(({ a }) => {
        const sub = data.subsByAssignment.get(a.id)?.find((s) => s.studentId === me);
        const status = effectiveStatus(sub, a);
        const v = score10(sub, a);
        return (
          <li key={a.id}>
            <Link href={ROUTES.MY_ASSIGNMENT_DETAIL(a.id)} className="group flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <AssignmentTypeBadge type={a.type} />
                  <span className="text-xs text-content-muted">
                    Hạn {formatDateTime(a.dueAt)} · {relativeDue(a.dueAt)}
                  </span>
                </div>
                <p className="mt-1 font-semibold text-content-heading group-hover:text-[var(--accent-gold)]">{a.title}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                {v != null && (
                  <span className="text-sm">
                    Điểm <ScoreValue value={v} />
                  </span>
                )}
                <SubmissionStatusBadge status={status} />
                <ArrowRight className="h-4 w-4 text-content-muted" aria-hidden="true" />
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function StudentLocalTab({ data, classroom }: { data: TeachingData; classroom: Classroom }) {
  const items = data.localContent
    .filter((c) => c.status === "PUBLISHED" && c.classIds.includes(classroom.id))
    .sort((a, b) => a.kind.localeCompare(b.kind) || localTitle(a).localeCompare(localTitle(b), "vi"));
  if (items.length === 0) {
    return <p className="rounded-[2px] border border-dashed border-[var(--border-strong)] p-6 text-center text-sm text-content-muted">Giáo viên chưa chia sẻ nội dung địa phương nào.</p>;
  }
  return (
    <div className="space-y-2">
      <p className="text-sm text-content-muted">Tư liệu lịch sử địa phương do giáo viên biên soạn cho lớp, đã được nhà trường duyệt.</p>
      <LocalList items={items} hrefFor={(c) => `${ROUTES.CLASS_DETAIL(classroom.id)}/local/${encodeURIComponent(c.id)}`} showStatus={false} />
    </div>
  );
}
