"use client";

import { useMemo } from "react";
import { ERA_CONFIG } from "@/constants/eras";
import { DEMO_TODAY } from "./mock-classroom";
import { useDemoStudentId, useDemoTeacherId, useSaasStore } from "./store";
import type {
  Assignment,
  AssignmentType,
  ChatActivity,
  Classroom,
  LocalContent,
  LocalContentKind,
  LocalContentStatus,
  StudentAccount,
  Submission,
  SubmissionStatus,
} from "./types";

/**
 * Teacher-side derived views of the mock store (Sprint 6: bài tập, lịch sử địa phương, dashboard).
 * Selectors return raw arrays; all filtering happens in useMemo so zustand never sees a fresh array.
 * "Today" is the demo date so the seed's upcoming / overdue split stays meaningful.
 */

export const TODAY = DEMO_TODAY;
export const DAY_MS = 86_400_000;
const DUE_SOON_DAYS = 3;

// ── Labels ───────────────────────────────────────────────────────────────────

export const ASSIGNMENT_TYPE_LABELS: Record<AssignmentType, string> = {
  EVENT: "Sự kiện",
  CHAT: "Chat AI",
  TEST: "Bài kiểm tra",
};

export const ASSIGNMENT_TYPE_HINTS: Record<AssignmentType, string> = {
  EVENT: "Học sinh đọc một bối cảnh / sự kiện lịch sử.",
  CHAT: "Học sinh trò chuyện với nhân vật lịch sử, đặt số tin nhắn tối thiểu.",
  TEST: "Học sinh làm bộ câu hỏi trắc nghiệm, có thể tính điểm.",
};

/** Which local content kind an assignment type points at. */
export const KIND_FOR_TYPE: Record<AssignmentType, LocalContentKind> = {
  EVENT: "CONTEXT",
  CHAT: "CHARACTER",
  TEST: "QUIZ",
};

export const SUBMISSION_STATUS_LABELS: Record<SubmissionStatus, string> = {
  NOT_STARTED: "Chưa làm",
  IN_PROGRESS: "Đang làm",
  SUBMITTED: "Đã nộp",
  LATE: "Nộp muộn",
  MISSING: "Thiếu bài",
};

export const LOCAL_STATUS_LABELS: Record<LocalContentStatus, string> = {
  DRAFT: "Nháp",
  PENDING: "Chờ duyệt",
  PUBLISHED: "Đã xuất bản",
  INACTIVE: "Ngừng hiển thị",
  TRASH: "Thùng rác",
};

export const LOCAL_KIND_LABELS: Record<LocalContentKind, string> = {
  CONTEXT: "Bối cảnh",
  CHARACTER: "Nhân vật",
  QUIZ: "Câu đố",
};

export const LOCAL_ERA_OPTIONS: { value: "ANCIENT" | "MEDIEVAL" | "MODERN" | "CONTEMPORARY"; label: string }[] = [
  { value: "ANCIENT", label: ERA_CONFIG.ancient.label },
  { value: "MEDIEVAL", label: ERA_CONFIG.medieval.label },
  { value: "MODERN", label: ERA_CONFIG.modern.label },
  { value: "CONTEMPORARY", label: ERA_CONFIG.contemporary.label },
];

export const LEVEL_LABELS: Record<"EASY" | "MEDIUM" | "HARD", string> = { EASY: "Dễ", MEDIUM: "Trung bình", HARD: "Khó" };

export const localTitle = (c: LocalContent) => (c.kind === "CHARACTER" ? c.name : c.title);

export const formatYear = (y: number | undefined | null) => (y == null ? "—" : y < 0 ? `${Math.abs(y)} TCN` : String(y));

// ── Assignment state ─────────────────────────────────────────────────────────

export type AssignmentState = "UPCOMING" | "OPEN" | "DUE_SOON" | "CLOSED";

export const ASSIGNMENT_STATE_LABELS: Record<AssignmentState, string> = {
  UPCOMING: "Chưa mở",
  OPEN: "Đang mở",
  DUE_SOON: "Sắp đến hạn",
  CLOSED: "Đã hết hạn",
};

export function assignmentState(a: Pick<Assignment, "openAt" | "dueAt">, today: Date = TODAY): AssignmentState {
  const t = today.getTime();
  const due = new Date(a.dueAt).getTime();
  if (due < t) return "CLOSED";
  if (new Date(a.openAt).getTime() > t) return "UPCOMING";
  if (due - t <= DUE_SOON_DAYS * DAY_MS) return "DUE_SOON";
  return "OPEN";
}

export const isOpenState = (s: AssignmentState) => s === "OPEN" || s === "DUE_SOON";
export const isDone = (s: SubmissionStatus) => s === "SUBMITTED" || s === "LATE";

/** NOT_STARTED / IN_PROGRESS work past the deadline counts as missing. */
export function effectiveStatus(sub: Submission | undefined, a: Assignment, today: Date = TODAY): SubmissionStatus {
  const status = sub?.status ?? "NOT_STARTED";
  if (!isDone(status) && status !== "MISSING" && new Date(a.dueAt).getTime() < today.getTime()) return "MISSING";
  return status;
}

/** TEST score normalised to a 10-point scale. */
export function score10(sub: Submission | undefined, a: Assignment): number | null {
  if (!sub || sub.score == null || a.type !== "TEST") return null;
  const max = a.maxScore && a.maxScore > 0 ? a.maxScore : 10;
  return (sub.score / max) * 10;
}

export type ScoreBand = "EXCELLENT" | "GOOD" | "PASS" | "FAIL";
export const SCORE_BAND_LABELS: Record<ScoreBand, string> = { EXCELLENT: "Giỏi ≥ 8", GOOD: "Khá 6,5–8", PASS: "Trung bình 5–6,5", FAIL: "Dưới 5" };
export const SCORE_BAND_CLASS: Record<ScoreBand, string> = {
  EXCELLENT: "text-[var(--jade)]",
  GOOD: "text-[var(--men-lam)]",
  PASS: "text-[var(--status-warning)]",
  FAIL: "text-[var(--accent-danger)]",
};
export const SCORE_BAND_FILL: Record<ScoreBand, string> = {
  EXCELLENT: "bg-[var(--jade)]",
  GOOD: "bg-[var(--men-lam)]",
  PASS: "bg-[var(--status-warning)]",
  FAIL: "bg-[var(--accent-danger)]",
};
export function scoreBand(v: number): ScoreBand {
  if (v >= 8) return "EXCELLENT";
  if (v >= 6.5) return "GOOD";
  if (v >= 5) return "PASS";
  return "FAIL";
}

export const formatScore = (v: number | null | undefined, digits = 1) =>
  v == null || Number.isNaN(v) ? "—" : v.toLocaleString("vi-VN", { maximumFractionDigits: digits, minimumFractionDigits: 0 });

export const formatPercent = (ratio: number | null) => (ratio == null ? "—" : `${Math.round(ratio * 100)}%`);

// ── Dates ────────────────────────────────────────────────────────────────────

const pad = (n: number) => String(n).padStart(2, "0");

/** ISO → value for <input type="datetime-local"> in the browser's time zone. */
export function toDatetimeLocal(iso: string | Date) {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromDatetimeLocal(value: string) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function formatDateTime(iso: string | undefined | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${pad(d.getHours())}:${pad(d.getMinutes())} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** "còn 2 ngày", "quá hạn 1 ngày", relative to the demo today. */
export function relativeDue(iso: string, today: Date = TODAY) {
  const diff = new Date(iso).getTime() - today.getTime();
  const days = Math.round(Math.abs(diff) / DAY_MS);
  if (diff >= 0) return days === 0 ? "hết hạn hôm nay" : `còn ${days} ngày`;
  return days === 0 ? "vừa hết hạn" : `quá hạn ${days} ngày`;
}

/** yyyy-mm-dd keys of the last `n` days ending at the demo today (same keys the chat seed uses). */
export function lastDays(n: number, today: Date = TODAY) {
  return Array.from({ length: n }, (_, k) => new Date(today.getTime() - (n - 1 - k) * DAY_MS).toISOString().slice(0, 10));
}

// ── CSV ──────────────────────────────────────────────────────────────────────

export function downloadCsv(filename: string, rows: (string | number | null | undefined)[][]) {
  const esc = (v: string | number | null | undefined) => {
    const s = v == null ? "" : String(v);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = "﻿" + rows.map((r) => r.map(esc).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

// ── Hooks ────────────────────────────────────────────────────────────────────

export interface AssignmentProgress {
  done: number;
  total: number;
  missing: number;
  /** Average TEST score on a 10-point scale, null when nobody has a score. */
  average: number | null;
}

export function progressOf(a: Assignment, subs: Submission[], studentIds: string[]): AssignmentProgress {
  const byStudent = new Map(subs.map((s) => [s.studentId, s]));
  let done = 0;
  let missing = 0;
  let sum = 0;
  let scored = 0;
  for (const id of studentIds) {
    const sub = byStudent.get(id);
    const st = effectiveStatus(sub, a);
    if (isDone(st)) done += 1;
    if (st === "MISSING") missing += 1;
    const v = score10(sub, a);
    if (v != null) {
      sum += v;
      scored += 1;
    }
  }
  return { done, total: studentIds.length, missing, average: scored ? sum / scored : null };
}

/** Everything the teacher screens need: my classes, their assignments, submissions and students. */
export function useTeachingData(role: string | null | undefined) {
  const teacherId = useDemoTeacherId();
  const studentId = useDemoStudentId();
  const classesAll = useSaasStore((s) => s.classes);
  const assignmentsAll = useSaasStore((s) => s.assignments);
  const submissionsAll = useSaasStore((s) => s.submissions);
  const studentsAll = useSaasStore((s) => s.students);
  const localAll = useSaasStore((s) => s.localContent);
  const classPins = useSaasStore((s) => s.classPins);

  return useMemo(() => {
    // Same rule as useMyClasses, computed here so the memo depends on the stable store array.
    const mine = classesAll.filter((c) =>
      role === "TEACHER"
        ? c.teacherIds.includes(teacherId) || c.homeroomTeacherId === teacherId
        : role === "SCHOOL_STUDENT"
          ? c.studentIds.includes(studentId)
          : false,
    );
    const classes = mine.sort((a, b) => a.grade - b.grade || a.name.localeCompare(b.name, "vi"));
    const classById = new Map<string, Classroom>(classes.map((c) => [c.id, c]));
    const assignments = assignmentsAll
      .filter((a) => classById.has(a.classId))
      .sort((a, b) => b.dueAt.localeCompare(a.dueAt));
    const subsByAssignment = new Map<string, Submission[]>();
    for (const s of submissionsAll) {
      const list = subsByAssignment.get(s.assignmentId);
      if (list) list.push(s);
      else subsByAssignment.set(s.assignmentId, [s]);
    }
    const studentById = new Map<string, StudentAccount>(studentsAll.map((s) => [s.id, s]));
    const progress = new Map<string, AssignmentProgress>(
      assignments.map((a) => [a.id, progressOf(a, subsByAssignment.get(a.id) ?? [], classById.get(a.classId)?.studentIds ?? [])]),
    );
    /** Mine, plus content other teachers made visible to one of my classes (row 14). */
    const localContent = localAll.filter(
      (c) => c.authorId === teacherId || c.classIds.some((id) => classById.has(id)),
    );
    return { teacherId, classes, classById, assignments, subsByAssignment, studentById, progress, localContent, classPins };
  }, [role, classesAll, assignmentsAll, submissionsAll, studentsAll, localAll, classPins, teacherId, studentId]);
}

export type TeachingData = ReturnType<typeof useTeachingData>;

export interface StudentRow {
  student: StudentAccount;
  classroom: Classroom;
  /** assignmentId → score on a 10-point scale. */
  scores: Map<string, number>;
  average: number | null;
  missing: number;
  messages: number;
  tokens: number;
}

/** Dashboard numbers for a set of classes (Role Matrix row 24). */
export function useDashboardStats(data: TeachingData, classIds: string[]) {
  const chatActivity = useSaasStore((s) => s.chatActivity);
  const key = classIds.join("|");

  return useMemo(() => {
    const ids = new Set(classIds);
    const classes = data.classes.filter((c) => ids.has(c.id));
    const assignments = data.assignments.filter((a) => ids.has(a.classId));
    const studentClass = new Map<string, Classroom>();
    for (const c of classes) for (const id of c.studentIds) if (!studentClass.has(id)) studentClass.set(id, c);

    const t = TODAY.getTime();
    const openAssignments = assignments.filter((a) => isOpenState(assignmentState(a)));
    const started = assignments.filter((a) => new Date(a.openAt).getTime() <= t);
    let done = 0;
    let total = 0;
    for (const a of started) {
      const p = data.progress.get(a.id);
      if (!p) continue;
      done += p.done;
      total += p.total;
    }

    const gradedTests = assignments
      .filter((a) => a.type === "TEST" && a.graded !== false)
      .sort((a, b) => a.dueAt.localeCompare(b.dueAt));

    const days14 = lastDays(14);
    const days7 = new Set(days14.slice(-7));
    const daySet = new Set(days14);
    const perDay = new Map<string, number>(days14.map((d) => [d, 0]));
    const perStudent = new Map<string, { messages: number; tokens: number }>();
    let messages7 = 0;
    for (const row of chatActivity as ChatActivity[]) {
      if (!studentClass.has(row.studentId) || !daySet.has(row.date)) continue;
      perDay.set(row.date, (perDay.get(row.date) ?? 0) + row.messages);
      if (days7.has(row.date)) messages7 += row.messages;
      const cur = perStudent.get(row.studentId) ?? { messages: 0, tokens: 0 };
      cur.messages += row.messages;
      cur.tokens += row.tokens;
      perStudent.set(row.studentId, cur);
    }

    const rows: StudentRow[] = [];
    let scoreSum = 0;
    let scoreCount = 0;
    for (const [studentId, classroom] of studentClass) {
      const student = data.studentById.get(studentId);
      if (!student) continue;
      const scores = new Map<string, number>();
      let missing = 0;
      for (const a of assignments) {
        if (a.classId !== classroom.id) continue;
        const sub = data.subsByAssignment.get(a.id)?.find((s) => s.studentId === studentId);
        if (effectiveStatus(sub, a) === "MISSING") missing += 1;
        if (a.type === "TEST" && a.graded !== false) {
          const v = score10(sub, a);
          if (v != null) {
            scores.set(a.id, v);
            scoreSum += v;
            scoreCount += 1;
          }
        }
      }
      const values = [...scores.values()];
      const chat = perStudent.get(studentId) ?? { messages: 0, tokens: 0 };
      rows.push({
        student,
        classroom,
        scores,
        average: values.length ? values.reduce((x, y) => x + y, 0) / values.length : null,
        missing,
        messages: chat.messages,
        tokens: chat.tokens,
      });
    }

    const attention = rows
      .filter((r) => r.missing >= 2 || (r.average != null && r.average < 5))
      .sort((a, b) => b.missing - a.missing || (a.average ?? 10) - (b.average ?? 10));

    const upcoming = assignments
      .filter((a) => new Date(a.dueAt).getTime() >= t)
      .sort((a, b) => a.dueAt.localeCompare(b.dueAt));

    return {
      classes,
      assignments,
      openAssignments,
      submissionRate: total ? done / total : null,
      submissionDone: done,
      submissionTotal: total,
      averageScore: scoreCount ? scoreSum / scoreCount : null,
      messages7,
      gradedTests,
      rows,
      perDay: days14.map((d) => ({ date: d, messages: perDay.get(d) ?? 0 })),
      attention,
      upcoming,
    };
    // key covers classIds.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, key, chatActivity]);
}
