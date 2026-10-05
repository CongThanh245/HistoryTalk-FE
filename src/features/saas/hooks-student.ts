"use client";

import { useMemo } from "react";
import { DEMO_TODAY } from "./mock-classroom";
import { DEMO_STUDENT_ID } from "./mock-data";
import { useSaasStore } from "./store";
import type {
  Assignment,
  Classroom,
  LocalCharacter,
  LocalContent,
  LocalContext,
  LocalQuiz,
  LocalQuizQuestion,
  Submission,
  SubmissionStatus,
  TeacherAccount,
} from "./types";

/**
 * Derived, student-scoped views of the mock store (Role Matrix rows 14, 17, 25).
 * Every hook selects raw arrays from the store and derives in useMemo so selectors stay stable.
 * Due / overdue logic runs against DEMO_TODAY so the seed always shows the same mix of work.
 */

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
/** "Sắp hết hạn" window. */
export const DUE_SOON_MS = 48 * HOUR;

/** The demo clock. Swap for `new Date()` once the data comes from the API. */
export const studentNow = () => DEMO_TODAY;

export type AssignmentBucket = "TODO" | "DUE_SOON" | "DONE" | "OVERDUE";

export const isDone = (status: SubmissionStatus | undefined) => status === "SUBMITTED" || status === "LATE";

/** Open / closed state of an assignment at `now`. */
export function assignmentWindow(a: Assignment, now: Date = studentNow()) {
  const notOpen = now.getTime() < new Date(a.openAt).getTime();
  const pastDue = now.getTime() > new Date(a.dueAt).getTime();
  const closed = pastDue && !a.allowLate;
  return { notOpen, pastDue, closed, canWork: !notOpen && !closed };
}

/** Status to store when the student hands in now. */
export const submitStatus = (a: Assignment, now: Date = studentNow()): SubmissionStatus =>
  assignmentWindow(a, now).pastDue ? "LATE" : "SUBMITTED";

export function assignmentBucket(a: Assignment, sub: Submission | undefined, now: Date = studentNow()): AssignmentBucket {
  if (isDone(sub?.status)) return "DONE";
  const left = new Date(a.dueAt).getTime() - now.getTime();
  if (left < 0) return "OVERDUE";
  if (left <= DUE_SOON_MS) return "DUE_SOON";
  return "TODO";
}

/** "Còn 2 ngày 4 giờ" / "Còn 35 phút" / "Quá hạn 1 ngày". */
export function relativeTime(iso: string, now: Date = studentNow()) {
  const diff = new Date(iso).getTime() - now.getTime();
  const abs = Math.abs(diff);
  const days = Math.floor(abs / DAY);
  const hours = Math.floor((abs % DAY) / HOUR);
  const minutes = Math.max(1, Math.floor((abs % HOUR) / 60_000));
  const text = days > 0 ? `${days} ngày${hours ? ` ${hours} giờ` : ""}` : hours > 0 ? `${hours} giờ` : `${minutes} phút`;
  return diff >= 0 ? `Còn ${text}` : `Quá hạn ${text}`;
}

export function formatDateTime(iso: string | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" });
}

/** Score on a scale of 10, for averages across tests with different max scores. */
export const toScale10 = (score: number, max: number | undefined) => (max && max > 0 ? (score / max) * 10 : score);

export interface StudentAssignmentRow {
  assignment: Assignment;
  submission: Submission | undefined;
  classroom: Classroom;
  teacher: TeacherAccount | undefined;
  bucket: AssignmentBucket;
}

/** Assignments of every class the logged-in student belongs to, soonest due first. */
export function useStudentAssignments(role: string | null | undefined) {
  const allClasses = useSaasStore((s) => s.classes);
  const assignments = useSaasStore((s) => s.assignments);
  const submissions = useSaasStore((s) => s.submissions);
  const teachers = useSaasStore((s) => s.teachers);
  const studentId = DEMO_STUDENT_ID;

  return useMemo(() => {
    const now = studentNow();
    // Same rule as useMyClasses("SCHOOL_STUDENT"), derived here so the memo has stable inputs.
    const myClasses = role === "SCHOOL_STUDENT" ? allClasses.filter((c) => c.studentIds.includes(studentId)) : [];
    const classById = new Map(myClasses.map((c) => [c.id, c]));
    const teacherById = new Map(teachers.map((t) => [t.id, t]));
    const subByAssignment = new Map(
      submissions.filter((x) => x.studentId === studentId).map((x) => [x.assignmentId, x]),
    );
    const rows: StudentAssignmentRow[] = [];
    for (const a of assignments) {
      const classroom = classById.get(a.classId);
      if (!classroom) continue;
      const submission = subByAssignment.get(a.id);
      rows.push({ assignment: a, submission, classroom, teacher: teacherById.get(a.teacherId), bucket: assignmentBucket(a, submission, now) });
    }
    rows.sort((x, y) => new Date(x.assignment.dueAt).getTime() - new Date(y.assignment.dueAt).getTime());
    return { rows, studentId, classes: myClasses };
  }, [role, allClasses, assignments, submissions, teachers, studentId]);
}

/** Target of an assignment when it points at the school's local content. */
export function useLocalTarget(a: Assignment | undefined) {
  const localContent = useSaasStore((s) => s.localContent);
  return useMemo(() => {
    if (!a || a.source !== "LOCAL") return null;
    return localContent.find((x) => x.id === a.targetId) ?? null;
  }, [a, localContent]);
}

/** Can this viewer see the local item: published (or viewer is a teacher) and shared with the class. */
export const canSeeLocal = (item: LocalContent, classId: string, role: string | null | undefined) =>
  item.classIds.includes(classId) && (item.status === "PUBLISHED" || role === "TEACHER") && item.status !== "TRASH";

/** Published local content shared with one class (row 14). */
export function useClassLocalContent(classId: string | undefined, role: string | null | undefined) {
  const localContent = useSaasStore((s) => s.localContent);
  return useMemo(
    () => (classId ? localContent.filter((x) => canSeeLocal(x, classId, role)) : []),
    [localContent, classId, role],
  );
}

export const localTitle = (item: LocalContent) => (item.kind === "CHARACTER" ? item.name : item.title);

export type { LocalCharacter, LocalContext, LocalQuiz };

/** Daily AI-chat messages of the student for the last `days` days (oldest first, zero-filled). */
export function useStudentChatActivity(days = 14) {
  const chatActivity = useSaasStore((s) => s.chatActivity);
  const studentId = DEMO_STUDENT_ID;
  return useMemo(() => {
    const now = studentNow();
    const byDate = new Map<string, { messages: number; tokens: number }>();
    for (const x of chatActivity) {
      if (x.studentId !== studentId) continue;
      const prev = byDate.get(x.date) ?? { messages: 0, tokens: 0 };
      byDate.set(x.date, { messages: prev.messages + x.messages, tokens: prev.tokens + x.tokens });
    }
    const list: { date: string; messages: number; tokens: number }[] = [];
    for (let d = days - 1; d >= 0; d -= 1) {
      const date = new Date(now.getTime() - d * DAY).toISOString().slice(0, 10);
      list.push({ date, ...(byDate.get(date) ?? { messages: 0, tokens: 0 }) });
    }
    return list;
  }, [chatActivity, studentId, days]);
}

export interface ClassGradeSummary {
  classroom: Classroom;
  tests: StudentAssignmentRow[];
  /** Average of graded tests, on a scale of 10; null when nothing is graded yet. */
  average: number | null;
  completed: number;
  /** Assignments already open (the denominator of the completion rate). */
  opened: number;
  upcoming: StudentAssignmentRow[];
}

/** Grade book per class for the logged-in student (row 25). */
export function useStudentGradeBook(role: string | null | undefined) {
  const { rows, classes } = useStudentAssignments(role);
  return useMemo<ClassGradeSummary[]>(() => {
    const now = studentNow();
    return classes.map((classroom) => {
      const mine = rows.filter((r) => r.classroom.id === classroom.id);
      const tests = mine.filter((r) => r.assignment.type === "TEST" && r.assignment.graded);
      const scored = tests.filter((r) => typeof r.submission?.score === "number");
      const average = scored.length
        ? scored.reduce((sum, r) => sum + toScale10(r.submission!.score!, r.assignment.maxScore), 0) / scored.length
        : null;
      const openedRows = mine.filter((r) => !assignmentWindow(r.assignment, now).notOpen);
      return {
        classroom,
        tests,
        average,
        completed: openedRows.filter((r) => isDone(r.submission?.status)).length,
        opened: openedRows.length,
        upcoming: mine.filter((r) => r.bucket === "TODO" || r.bucket === "DUE_SOON"),
      };
    });
  }, [rows, classes]);
}

// ── Built-in mock quiz for GLOBAL tests (no local question data until the API links global quizzes) ──

const BACH_DANG_938: LocalQuizQuestion[] = [
  { id: "g1", prompt: "Ai lãnh đạo quân dân ta trong trận Bạch Đằng năm 938?", options: ["Ngô Quyền", "Lê Hoàn", "Trần Hưng Đạo", "Lý Thường Kiệt"], correctIndex: 0, explanation: "Ngô Quyền chỉ huy trận Bạch Đằng năm 938, năm sau xưng vương, đóng đô ở Cổ Loa." },
  { id: "g2", prompt: "Quân xâm lược bị đánh bại trên sông Bạch Đằng năm 938 là quân nào?", options: ["Quân Tống", "Quân Nam Hán", "Quân Nguyên Mông", "Quân Minh"], correctIndex: 1, explanation: "Vua Nam Hán sai con là Lưu Hoằng Tháo đem quân theo đường biển sang xâm lược." },
  { id: "g3", prompt: "Cách đánh nổi bật của Ngô Quyền trong trận này là gì?", options: ["Đắp thành lũy kiên cố", "Đánh úp doanh trại vào ban đêm", "Cắm cọc gỗ đầu bịt sắt dưới lòng sông, lợi dụng thủy triều", "Rút lui chiến lược về rừng núi"], correctIndex: 2, explanation: "Bãi cọc ngầm lộ ra khi nước triều rút khiến thuyền giặc mắc cạn, vỡ trận." },
  { id: "g4", prompt: "Tướng giặc nào tử trận trong trận Bạch Đằng năm 938?", options: ["Thoát Hoan", "Ô Mã Nhi", "Liễu Thăng", "Lưu Hoằng Tháo"], correctIndex: 3, explanation: "Lưu Hoằng Tháo tử trận; vua Nam Hán phải bỏ ý định xâm lược." },
  { id: "g5", prompt: "Ý nghĩa lớn nhất của chiến thắng Bạch Đằng năm 938?", options: ["Mở rộng lãnh thổ về phía Nam", "Chấm dứt hơn một nghìn năm Bắc thuộc, mở ra thời kỳ độc lập lâu dài", "Thống nhất đất nước sau thời loạn 12 sứ quân", "Đánh bại quân Thanh, giải phóng Thăng Long"], correctIndex: 1 },
];

function genericQuiz(title: string): LocalQuizQuestion[] {
  return [
    { id: "g1", prompt: `Khi tìm hiểu "${title}", nguồn tư liệu nào có giá trị cao nhất?`, options: ["Bài đăng mạng xã hội không rõ tác giả", "Tư liệu gốc cùng thời và sách sử chính thống", "Phim ảnh hư cấu", "Lời kể truyền miệng chưa kiểm chứng"], correctIndex: 1, explanation: "Tư liệu gốc và sách sử đã được kiểm chứng là căn cứ đáng tin cậy nhất." },
    { id: "g2", prompt: `Để hiểu vì sao "${title}" xảy ra, em nên xem xét điều gì trước tiên?`, options: ["Bối cảnh lịch sử và nguyên nhân", "Màu sắc trang phục thời đó", "Số trang của sách giáo khoa", "Tên các con phố hiện nay"], correctIndex: 0 },
    { id: "g3", prompt: `Cách sắp xếp nào giúp ghi nhớ diễn biến "${title}" tốt nhất?`, options: ["Theo thứ tự chữ cái", "Theo trình tự thời gian và các mốc chính", "Theo độ dài của từng đoạn văn", "Ngẫu nhiên"], correctIndex: 1 },
    { id: "g4", prompt: `Bài học lịch sử rút ra từ "${title}" nên được trình bày thế nào?`, options: ["Chỉ chép lại nguyên văn sách", "Liên hệ với ý nghĩa và tác động đến giai đoạn sau", "Bỏ qua vì không có trong đề", "Chỉ ghi tên nhân vật"], correctIndex: 1 },
    { id: "g5", prompt: `Khi hai nguồn nói khác nhau về "${title}", em nên làm gì?`, options: ["Chọn nguồn ngắn hơn", "Đối chiếu, xem xét tác giả và thời điểm ra đời của từng nguồn", "Bỏ qua cả hai", "Tin nguồn mới nhất"], correctIndex: 1, explanation: "Đối chiếu nhiều nguồn là kỹ năng cơ bản của người học sử." },
  ];
}

/** Five built-in questions about a GLOBAL test's target (stand-in for the real quiz set). */
export function globalMockQuiz(targetId: string, targetTitle: string): LocalQuizQuestion[] {
  if (/bach-dang|bạch đằng/i.test(`${targetId} ${targetTitle}`)) return BACH_DANG_938;
  return genericQuiz(targetTitle);
}
