"use client";

import * as React from "react";
import Link from "next/link";
import { BookOpen, CheckCircle2, ExternalLink, Lock, MessageCirclePlus, MessageSquareText } from "lucide-react";
import { toast } from "sonner";
import { Panel } from "@/components/saas/saas-ui";
import { StudentContextArticle } from "@/components/saas/student-context-article";
import { StudentMockChat } from "@/components/saas/student-mock-chat";
import { StudentQuizRunner } from "@/components/saas/student-quiz-runner";
import { ASSIGNMENT_TYPE_META, ProgressMeter } from "@/components/saas/student-ui";
import { ROUTES } from "@/constants/routes";
import {
  assignmentWindow,
  canSeeLocal,
  formatDateTime,
  globalMockQuiz,
  isDone,
  studentNow,
  submitStatus,
  useLocalTarget,
  type StudentAssignmentRow,
} from "@/features/saas/hooks-student";
import { useSaasStore } from "@/features/saas/store";
import type { Assignment, Submission } from "@/features/saas/types";

/**
 * The "do the work" part of an assignment (Role Matrix row 17): read an event, chat with a character
 * or take a graded test. All progress goes through `upsertSubmission` of the mock store.
 */

interface WorkProps {
  row: StudentAssignmentRow;
  studentId: string;
  role: string | null;
}

const mapHref = (classId: string) => `${ROUTES.HISTORICAL_MAP}?layer=class&classId=${classId}`;

/** Live submission, read straight from the store (avoids stale closures in rapid chat updates). */
const currentSubmission = (assignmentId: string, studentId: string): Submission | undefined =>
  useSaasStore.getState().submissions.find((x) => x.assignmentId === assignmentId && x.studentId === studentId);

export function StudentAssignmentWork(props: WorkProps) {
  const { assignment: a, submission } = props.row;
  const win = assignmentWindow(a);

  if (win.notOpen) {
    return <LockedNotice title="Bài chưa mở" text={`Bài sẽ mở lúc ${formatDateTime(a.openAt)}. Em quay lại sau nhé.`} />;
  }
  if (win.closed && !isDone(submission?.status) && a.type === "TEST") {
    return <LockedNotice title="Bài kiểm tra đã đóng" text="Đã hết hạn nộp và thầy cô không nhận bài muộn." />;
  }

  return (
    <>
      {isDone(submission?.status) && <DoneBanner assignment={a} submission={submission!} />}
      {a.type === "EVENT" && <EventWork {...props} />}
      {a.type === "CHAT" && <ChatWork {...props} />}
      {a.type === "TEST" && <TestWork {...props} />}
    </>
  );
}

function LockedNotice({ title, text }: { title: string; text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-[2px] border border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] p-4">
      <Lock className="mt-0.5 h-4 w-4 shrink-0 text-[var(--status-warning)]" aria-hidden="true" />
      <div>
        <p className="text-[14px] font-bold text-content-text">{title}</p>
        <p className="text-[13px] text-content-muted">{text}</p>
      </div>
    </div>
  );
}

function DoneBanner({ assignment: a, submission }: { assignment: Assignment; submission: Submission }) {
  return (
    <div className="flex items-start gap-3 rounded-[2px] border border-[var(--jade)] bg-[color-mix(in_srgb,var(--jade)_9%,var(--bg-surface))] p-4">
      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[var(--jade)]" aria-hidden="true" />
      <div className="space-y-0.5">
        <p className="text-[14px] font-bold text-content-text">
          {submission.status === "LATE" ? "Đã nộp muộn" : "Đã nộp bài"}
          {submission.submittedAt ? ` lúc ${formatDateTime(submission.submittedAt)}` : ""}
        </p>
        <p className="text-[13px] text-content-muted">
          {a.type === "TEST" ? "Kết quả và đáp án ở bên dưới." : "Thầy cô sẽ xem bài của em trong bảng theo dõi của lớp."}
        </p>
        {submission.teacherComment && (
          <p className="pt-1 text-[13px] text-content-text">
            <span className="font-bold">Nhận xét của thầy cô:</span> {submission.teacherComment}
          </p>
        )}
      </div>
    </div>
  );
}

function UnavailableTarget({ title }: { title: string }) {
  return (
    <LockedNotice
      title={`Tư liệu "${title}" hiện không khả dụng`}
      text="Nội dung đang được nhà trường cập nhật hoặc đã tạm ẩn. Em hãy báo thầy cô nếu cần."
    />
  );
}

// ── EVENT: đọc sự kiện ──────────────────────────────────────────────────────

const noteKey = (assignmentId: string, studentId: string) => `historytalk:assignment-note:${assignmentId}:${studentId}`;

function readNote(key: string) {
  try {
    return window.localStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
}

function EventWork({ row, studentId, role }: WorkProps) {
  const { assignment: a, submission } = row;
  const target = useLocalTarget(a);
  const upsert = useSaasStore((s) => s.upsertSubmission);
  const done = isDone(submission?.status);
  const { canWork } = assignmentWindow(a);
  const key = noteKey(a.id, studentId);
  const [note, setNote] = React.useState(() => (typeof window === "undefined" ? "" : readNote(key)));

  function saveNote(value: string) {
    setNote(value);
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // Storage blocked: the note just isn't kept after reload.
    }
  }

  function complete() {
    upsert(a.id, studentId, { status: submitStatus(a), submittedAt: studentNow().toISOString() });
    toast.success(submitStatus(a) === "LATE" ? "Đã nộp muộn bài đọc" : "Đã hoàn thành bài đọc");
  }

  return (
    <div className="space-y-5">
      {a.source === "LOCAL" ? (
        target && target.kind === "CONTEXT" && canSeeLocal(target, a.classId, role) ? (
          <StudentContextArticle context={target} mapHref={mapHref(a.classId)} />
        ) : (
          <UnavailableTarget title={a.targetTitle} />
        )
      ) : (
        <Panel>
          <div className="flex flex-wrap items-center gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[2px] bg-[var(--jade)] text-white" aria-hidden="true">
              <BookOpen className="h-6 w-6" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-bold text-[var(--jade)]">Sự kiện trong thư viện HistoryTalk</p>
              <p className="archive-title is-plain text-2xl">{a.targetTitle}</p>
            </div>
            <Link href={`${ROUTES.EVENTS}?event=${encodeURIComponent(a.targetId)}`} className="btn-ink">
              Mở sự kiện <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <p className="text-[13px] text-content-muted">Đọc xong sự kiện, quay lại đây ghi cảm nhận và đánh dấu hoàn thành.</p>
        </Panel>
      )}

      <Panel>
        <label htmlFor="event-note" className="block font-display text-xl font-extrabold uppercase leading-tight text-content-text">
          Ghi chú / cảm nhận
        </label>
        <textarea
          id="event-note"
          rows={4}
          value={note}
          onChange={(e) => saveNote(e.target.value)}
          readOnly={done}
          maxLength={2000}
          placeholder="Em rút ra được điều gì? Ghi lại ý chính theo yêu cầu của thầy cô..."
          className="w-full rounded-[2px] border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-3 py-2.5 text-[14px] leading-relaxed text-content-text outline-none focus-visible:border-[var(--text-primary)] read-only:opacity-80"
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-[12px] text-content-muted">Ghi chú được lưu trên máy này.</span>
          {!done && (
            <button type="button" className="btn-crimson disabled:opacity-50" disabled={!canWork} onClick={complete}>
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Đánh dấu đã hoàn thành
            </button>
          )}
        </div>
        {!done && !canWork && <p className="text-[13px] text-[var(--accent-danger)]">Đã hết hạn nộp, thầy cô không nhận bài muộn.</p>}
      </Panel>
    </div>
  );
}

// ── CHAT: trò chuyện với nhân vật ─────────────────────────────────────────────

function ChatWork({ row, studentId, role }: WorkProps) {
  const { assignment: a, submission } = row;
  const target = useLocalTarget(a);
  const upsert = useSaasStore((s) => s.upsertSubmission);
  const done = isDone(submission?.status);
  const { canWork } = assignmentWindow(a);
  const count = submission?.messageCount ?? 0;
  const min = a.minMessages ?? 1;
  const color = ASSIGNMENT_TYPE_META.CHAT.color;

  const bump = React.useCallback(() => {
    const cur = currentSubmission(a.id, studentId);
    if (isDone(cur?.status)) return;
    upsert(a.id, studentId, { status: "IN_PROGRESS", messageCount: (cur?.messageCount ?? 0) + 1 });
  }, [a.id, studentId, upsert]);

  function handIn() {
    upsert(a.id, studentId, { status: submitStatus(a), submittedAt: studentNow().toISOString() });
    toast.success("Đã nộp bài trò chuyện");
  }

  const locked = done || !canWork;
  const lockedReason = done ? "Em đã nộp bài này" : "Đã hết hạn nộp";

  return (
    <div className="space-y-5">
      <Panel>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-content-muted">Tiến độ</p>
            <p className="font-display text-4xl font-extrabold tabular-nums" style={{ color }}>
              {Math.min(count, min)}
              <span className="text-lg text-content-muted"> / {min} tin nhắn</span>
            </p>
          </div>
          {!done && (
            <button type="button" className="btn-crimson disabled:opacity-50" disabled={!canWork || count < min} onClick={handIn}>
              Nộp bài
            </button>
          )}
        </div>
        <ProgressMeter value={count} max={min} color={color} label="Tiến độ tin nhắn" />
        {!done && (
          <p className="text-[13px] text-content-muted">
            {count >= min
              ? "Em đã gửi đủ tin nhắn. Bấm Nộp bài khi hoàn tất."
              : `Gửi thêm ${min - count} tin nhắn để có thể nộp bài.`}
            {!canWork && " Đã hết hạn nộp."}
          </p>
        )}
      </Panel>

      {a.source === "LOCAL" ? (
        target && target.kind === "CHARACTER" && canSeeLocal(target, a.classId, role) ? (
          <StudentMockChat character={target} onStudentMessage={bump} disabled={locked} disabledReason={lockedReason} />
        ) : (
          <UnavailableTarget title={a.targetTitle} />
        )
      ) : (
        <Panel>
          <div className="flex flex-wrap items-center gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[2px] text-white" style={{ background: color }} aria-hidden="true">
              <MessageSquareText className="h-6 w-6" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-bold" style={{ color }}>Nhân vật trong thư viện HistoryTalk</p>
              <p className="archive-title is-plain text-2xl">{a.targetTitle}</p>
            </div>
            <Link href={ROUTES.CHAT(a.targetId)} className="btn-ink">
              Mở trò chuyện <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border-default)] pt-4">
            <p className="max-w-xl text-[13px] text-content-muted">
              Bản demo chưa đếm tin nhắn từ trang trò chuyện thật. Dùng nút bên cạnh để mô phỏng một tin nhắn đã gửi.
            </p>
            <button type="button" className="btn-line disabled:opacity-50" disabled={locked} onClick={bump}>
              <MessageCirclePlus className="h-4 w-4" aria-hidden="true" /> Mô phỏng tin nhắn
            </button>
          </div>
        </Panel>
      )}
    </div>
  );
}

// ── TEST: bài kiểm tra lấy điểm ───────────────────────────────────────────────

function TestWork({ row, studentId, role }: WorkProps) {
  const { assignment: a, submission } = row;
  const target = useLocalTarget(a);
  const upsert = useSaasStore((s) => s.upsertSubmission);
  const done = isDone(submission?.status);
  const maxScore = a.maxScore ?? 10;

  const quiz = React.useMemo(() => {
    if (a.source === "GLOBAL") return { title: a.targetTitle, questions: globalMockQuiz(a.targetId, a.targetTitle), duration: 10 };
    if (target && target.kind === "QUIZ" && canSeeLocal(target, a.classId, role)) {
      return { title: target.title, questions: target.questions, duration: target.durationMinutes };
    }
    return null;
  }, [a, target, role]);

  const onStart = React.useCallback(() => {
    if (!isDone(currentSubmission(a.id, studentId)?.status)) upsert(a.id, studentId, { status: "IN_PROGRESS" });
  }, [a.id, studentId, upsert]);

  const onSubmit = React.useCallback(
    (answers: number[], score: number) => {
      if (isDone(currentSubmission(a.id, studentId)?.status)) return;
      upsert(a.id, studentId, { status: submitStatus(a), answers, score, submittedAt: studentNow().toISOString() });
      toast.success(`Đã nộp bài: ${score.toLocaleString("vi-VN")} / ${maxScore} điểm`);
    },
    [a, studentId, upsert, maxScore],
  );

  if (!quiz) return <UnavailableTarget title={a.targetTitle} />;

  return (
    <div className="space-y-3">
      {a.source === "GLOBAL" && (
        <p className="text-[13px] text-content-muted">Bộ câu hỏi mô phỏng cho bài kiểm tra từ thư viện chung (5 câu).</p>
      )}
      <StudentQuizRunner
        title={quiz.title}
        questions={quiz.questions}
        mode="graded"
        durationMinutes={quiz.duration}
        maxScore={maxScore}
        result={done ? { answers: submission?.answers, score: submission?.score } : null}
        storageKey={`historytalk:test-attempt:${a.id}:${studentId}`}
        onStart={onStart}
        onSubmit={onSubmit}
      />
    </div>
  );
}
