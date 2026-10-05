"use client";

import { useMemo } from "react";
import { useSchoolData } from "./hooks";
import { DEMO_TODAY } from "./mock-classroom";
import { useSaasStore } from "./store";
import type { Classroom, LocalContent, LocalContentKind, LocalContentStatus, TeacherAccount } from "./types";

/**
 * School Admin derived views (Role Matrix rows 13 and 23): the local-content review queue and the
 * school report dashboard. Everything is computed from the mock store against DEMO_TODAY.
 */

const DAY = 86_400_000;
/** Same day key the chat-activity seed uses (UTC date of the instant). */
export const dayKey = (d: Date) => d.toISOString().slice(0, 10);
export const TODAY_KEY = dayKey(DEMO_TODAY);

/** Day keys for the last `days` days, oldest first, ending today. */
export function lastDays(days: number) {
  return Array.from({ length: days }, (_, i) => dayKey(new Date(DEMO_TODAY.getTime() - (days - 1 - i) * DAY)));
}

/** "2026-10-05" → "05/10". */
export const shortDay = (key: string) => `${key.slice(8, 10)}/${key.slice(5, 7)}`;

// ── Local content review (row 13) ──────────────────────────────────────────

export const CONTENT_KIND_LABELS: Record<LocalContentKind, string> = {
  CONTEXT: "Bối cảnh",
  CHARACTER: "Nhân vật",
  QUIZ: "Câu đố",
};

export const CONTENT_STATUS_LABELS: Record<LocalContentStatus, string> = {
  DRAFT: "Nháp",
  PENDING: "Chờ duyệt",
  PUBLISHED: "Đã xuất bản",
  INACTIVE: "Ngừng hiển thị",
  TRASH: "Thùng rác",
};

export const contentTitle = (c: LocalContent) => (c.kind === "CHARACTER" ? c.name : c.title);

export interface ReviewItem {
  content: LocalContent;
  title: string;
  author: TeacherAccount | undefined;
  classes: Classroom[];
  /** Students in the target classes, i.e. who sees it once published. */
  audience: number;
}

export function useSchoolContentReview(schoolId: string) {
  const { teachers, classes, teacherById } = useSchoolData(schoolId);
  const all = useSaasStore((s) => s.localContent);

  return useMemo(() => {
    const classById = new Map(classes.map((c) => [c.id, c]));
    const content = all.filter((c) => c.schoolId === schoolId);
    const byId = new Map(content.map((c) => [c.id, c]));
    const items: ReviewItem[] = content
      .map((c) => {
        const cls = c.classIds.map((id) => classById.get(id)).filter((x): x is Classroom => !!x);
        const audience = new Set(cls.flatMap((x) => x.studentIds)).size;
        return { content: c, title: contentTitle(c), author: teacherById.get(c.authorId), classes: cls, audience };
      })
      .sort((a, b) => b.content.updatedAt.localeCompare(a.content.updatedAt));

    const counts: Record<LocalContentStatus, number> = { DRAFT: 0, PENDING: 0, PUBLISHED: 0, INACTIVE: 0, TRASH: 0 };
    for (const c of content) counts[c.status] += 1;

    return { items, counts, byId, teachers, classes };
  }, [all, schoolId, classes, teachers, teacherById]);
}

// ── School dashboard (row 23) ──────────────────────────────────────────────

export interface DailyPoint {
  date: string;
  activeStudents: number;
  messages: number;
  tokens: number;
}

export interface ClassReportRow {
  id: string;
  name: string;
  grade: number;
  homeroom: string;
  students: number;
  openAssignments: number;
  /** 0..1, null when no assignment has opened yet. */
  submissionRate: number | null;
  /** Average TEST score on a 10-point scale, null without graded work. */
  avgTestScore: number | null;
  /** Latest day key with chat or submission activity. */
  lastActivity: string | null;
  tokensToday: number;
  tokensPeriod: number;
}

export interface TeacherReportRow {
  id: string;
  name: string;
  status: TeacherAccount["status"];
  assignments30d: number;
  content: Record<LocalContentStatus, number>;
  classes: string[];
}

export function useSchoolDashboard(schoolId: string, periodDays: number) {
  const base = useSchoolData(schoolId);
  const assignments = useSaasStore((s) => s.assignments);
  const submissions = useSaasStore((s) => s.submissions);
  const chatActivity = useSaasStore((s) => s.chatActivity);
  const localContent = useSaasStore((s) => s.localContent);

  return useMemo(() => {
    const { school, teachers, students, classes, teacherById, studentById, classByStudent } = base;
    const now = DEMO_TODAY.getTime();

    const schoolChat = chatActivity.filter((a) => studentById.has(a.studentId));
    const days = lastDays(periodDays);
    const daySet = new Set(days);

    // Daily activity series.
    const perDay = new Map<string, { students: Set<string>; messages: number; tokens: number }>();
    for (const d of days) perDay.set(d, { students: new Set(), messages: 0, tokens: 0 });
    for (const a of schoolChat) {
      const bucket = perDay.get(a.date);
      if (!bucket) continue;
      if (a.messages > 0) bucket.students.add(a.studentId);
      bucket.messages += a.messages;
      bucket.tokens += a.tokens;
    }
    const daily: DailyPoint[] = days.map((date) => {
      const b = perDay.get(date)!;
      return { date, activeStudents: b.students.size, messages: b.messages, tokens: b.tokens };
    });
    const activeToday = new Set(schoolChat.filter((a) => a.date === TODAY_KEY && a.messages > 0).map((a) => a.studentId)).size;

    // Grades.
    const gradeSet = new Set<number>([...students.map((s) => s.grade), ...classes.map((c) => c.grade)]);
    const grades = Array.from(gradeSet)
      .sort((a, b) => a - b)
      .map((grade) => ({
        grade,
        students: students.filter((s) => s.grade === grade).length,
        classes: classes.filter((c) => c.grade === grade).length,
      }));

    // Class report.
    const schoolAssignments = assignments.filter((a) => classes.some((c) => c.id === a.classId));
    const assignmentById = new Map(schoolAssignments.map((a) => [a.id, a]));
    const classRows: ClassReportRow[] = classes.map((c) => {
      const mine = schoolAssignments.filter((a) => a.classId === c.id);
      const opened = mine.filter((a) => new Date(a.openAt).getTime() <= now);
      const openIds = new Set(opened.map((a) => a.id));
      const subs = submissions.filter((s) => openIds.has(s.assignmentId));
      const done = subs.filter((s) => s.status === "SUBMITTED" || s.status === "LATE").length;
      const scores = subs
        .filter((s) => s.score != null && assignmentById.get(s.assignmentId)?.type === "TEST")
        .map((s) => (s.score! / (assignmentById.get(s.assignmentId)?.maxScore ?? 10)) * 10);
      const memberSet = new Set(c.studentIds);
      const chats = schoolChat.filter((a) => memberSet.has(a.studentId));
      let last: string | null = null;
      for (const a of chats) if (a.messages > 0 && a.date <= TODAY_KEY && (!last || a.date > last)) last = a.date;
      for (const s of subs) {
        if (!s.submittedAt || !memberSet.has(s.studentId)) continue;
        const k = dayKey(new Date(s.submittedAt));
        if (k <= TODAY_KEY && (!last || k > last)) last = k;
      }
      const homeroom = c.homeroomTeacherId ? teacherById.get(c.homeroomTeacherId)?.fullName : undefined;
      return {
        id: c.id,
        name: c.name,
        grade: c.grade,
        homeroom: homeroom ?? "",
        students: c.studentIds.length,
        openAssignments: mine.filter((a) => new Date(a.openAt).getTime() <= now && new Date(a.dueAt).getTime() >= now).length,
        submissionRate: subs.length ? done / subs.length : null,
        avgTestScore: scores.length ? scores.reduce((x, y) => x + y, 0) / scores.length : null,
        lastActivity: last,
        tokensToday: c.studentIds.reduce((sum, id) => sum + (studentById.get(id)?.tokensUsedToday ?? 0), 0),
        tokensPeriod: chats.filter((a) => daySet.has(a.date)).reduce((sum, a) => sum + a.tokens, 0),
      };
    });

    // Teacher activity.
    const since = now - 30 * DAY;
    const schoolContent = localContent.filter((c) => c.schoolId === schoolId);
    const teacherRows: TeacherReportRow[] = teachers.map((t) => {
      const content: Record<LocalContentStatus, number> = { DRAFT: 0, PENDING: 0, PUBLISHED: 0, INACTIVE: 0, TRASH: 0 };
      for (const c of schoolContent) if (c.authorId === t.id) content[c.status] += 1;
      return {
        id: t.id,
        name: t.fullName,
        status: t.status,
        assignments30d: schoolAssignments.filter(
          (a) => a.teacherId === t.id && new Date(a.createdAt).getTime() >= since && new Date(a.createdAt).getTime() <= now,
        ).length,
        content,
        classes: classes.filter((c) => c.teacherIds.includes(t.id) || c.homeroomTeacherId === t.id).map((c) => c.name),
      };
    });

    const pendingReviews = schoolContent.filter((c) => c.status === "PENDING").length;
    const unassigned = students.filter((s) => !classByStudent.has(s.id)).length;

    return { ...base, school, daily, activeToday, grades, classRows, teacherRows, pendingReviews, unassigned };
  }, [base, assignments, submissions, chatActivity, localContent, schoolId, periodDays]);
}

/** Client-side CSV of the class report (UTF-8 BOM so Excel keeps the diacritics). */
export function classReportCsv(rows: ClassReportRow[]) {
  const header = ["Lớp", "Khối", "GV chủ nhiệm", "Sĩ số", "Bài đang mở", "Tỉ lệ nộp (%)", "Điểm TB kiểm tra", "Hoạt động gần nhất", "Token hôm nay"];
  const esc = (v: string | number) => {
    const s = String(v);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = rows.map((r) =>
    [
      r.name,
      r.grade,
      r.homeroom || "Chưa phân công",
      r.students,
      r.openAssignments,
      r.submissionRate == null ? "" : Math.round(r.submissionRate * 100),
      r.avgTestScore == null ? "" : r.avgTestScore.toFixed(1),
      r.lastActivity ?? "",
      r.tokensToday,
    ]
      .map(esc)
      .join(","),
  );
  return "﻿" + [header.map(esc).join(","), ...lines].join("\r\n");
}
