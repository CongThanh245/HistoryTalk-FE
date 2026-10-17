"use client";

// Lam mot bai duoc giao: GET /student/assignments/{id}, POST .../start, POST .../submit (API that).
import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, ExternalLink, Info, Loader2, Play, Send, ShieldCheck, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/ui/empty-state";
import { Panel, SaasShell, SectionHeading } from "@/components/saas/saas-ui";
import {
  AssignmentFacts,
  AssignmentListSkeleton,
  AssignmentLoadError,
  AssignmentTypeBadge,
  DueLine,
  ScoreChip,
  SubmissionStatusBadge,
  formatDateTime,
  formatScore,
  isDone,
  parseLocal,
  requirementText,
  targetHref,
} from "@/components/saas/student-assignment-card";
import { ROUTES } from "@/constants/routes";
import { useRole } from "@/features/auth/usePermission";
import { useMyAssignment, useStartAssignment, useSubmitAssignment } from "@/features/saas/hooks-assignment-api";
import { apiErrorMessage, apiErrorStatus } from "@/features/saas/hooks-api";
import type { StudentAssignment, SubmitAssignmentPayload } from "@/services/assignment.service";
import { chatService, type ChatSession } from "@/services/chat.service";
import { quizService, type QuizResult } from "@/services/quiz.service";

/** Học sinh làm một bài được giao (Role Matrix row 17). */
export default function MyAssignmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const role = useRole();
  return (
    <SaasShell variant="app" title="Làm bài tập" description="Hoàn thành bài trước hạn nộp. Điểm do hệ thống tự chấm khi em nộp bài.">
      {role === "SCHOOL_STUDENT" ? (
        <AssignmentDetail id={id} />
      ) : (
        <EmptyState title="Trang dành cho học sinh" description="Chỉ tài khoản học sinh của trường mới làm được bài tập được giao." />
      )}
    </SaasShell>
  );
}

const back = (
  <Link href={ROUTES.MY_ASSIGNMENTS} className="archive-link">
    <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Bài tập được giao
  </Link>
);

function AssignmentDetail({ id }: { id: string }) {
  const { data: a, isLoading, isError, error, refetch } = useMyAssignment(id);

  if (isLoading) return <AssignmentListSkeleton count={2} />;
  if (isError) {
    const status = apiErrorStatus(error);
    if (status === 404 || status === 403) {
      return <EmptyState title="Không tìm thấy bài tập" description="Bài không tồn tại, đã bị hủy hoặc không thuộc lớp của em." action={back} />;
    }
    return <AssignmentLoadError message={apiErrorMessage(error, "Vui lòng kiểm tra kết nối rồi thử lại.")} onRetry={() => void refetch()} />;
  }
  if (!a) return null;

  return (
    <div className="space-y-5">
      {back}
      <Panel>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <AssignmentTypeBadge type={a.assignmentType} />
              <SubmissionStatusBadge assignment={a} />
            </div>
            <h2 className="archive-title is-plain text-2xl sm:text-3xl">{a.title}</h2>
            <p className="inline-flex flex-wrap items-center gap-x-1.5 text-[13px] text-content-muted">
              <UsersRound className="h-3.5 w-3.5" aria-hidden="true" />
              Lớp {a.className}
              <span>· Nội dung: {a.targetTitle ?? "—"}</span>
            </p>
            <DueLine assignment={a} />
          </div>
          {a.score !== null && <ScoreChip score={a.score} size="lg" />}
        </div>
        {a.description && (
          <div className="border-t border-[var(--border-default)] pt-3">
            <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-content-muted">Yêu cầu</p>
            <p className="mt-1 whitespace-pre-wrap text-[14px] leading-relaxed text-content-text">{a.description}</p>
          </div>
        )}
        <AssignmentFacts assignment={a} className="border-t border-[var(--border-default)] pt-3" />
      </Panel>

      <AssignmentWork assignment={a} />
    </div>
  );
}

// ─── Lam bai ───────────────────────────────────────────────────────────────

/** Lan lam quiz da hoan thanh gan nhat cho quiz cua bai (BE khong loc theo quizId). */
async function latestQuizResult(quizId: string): Promise<QuizResult | null> {
  const res = await quizService.getMyResults({ page: 0, size: 50 });
  const mine = res.content.filter((r) => r.quizId === quizId && r.completedAt);
  mine.sort((x, y) => (parseLocal(y.completedAt)?.getTime() ?? 0) - (parseLocal(x.completedAt)?.getTime() ?? 0));
  return mine[0] ?? null;
}

/** Phien chat gan nhat voi nhan vat cua bai (BE bo qua contextId). */
async function latestChatSession(characterId: string): Promise<ChatSession | null> {
  const sessions = await chatService.getSessions(characterId, "");
  const mine = (sessions ?? []).filter((s) => s.characterId === characterId || !s.characterId);
  mine.sort((x, y) => (parseLocal(y.lastMessageAt)?.getTime() ?? 0) - (parseLocal(x.lastMessageAt)?.getTime() ?? 0));
  return mine[0] ?? null;
}

function AssignmentWork({ assignment: a }: { assignment: StudentAssignment }) {
  const start = useStartAssignment();
  const submit = useSubmitAssignment();
  const type = a.assignmentType;
  const done = isDone(a.submissionStatus);
  const open = !done && a.submissionStatus !== "EXEMPTED";

  // Xem truoc phien se dung de nop (quiz / chat).
  const evidence = useQuery({
    queryKey: ["assignments", "student", "evidence", a.assignmentId, type, a.targetId],
    queryFn: async () =>
      type === "QUIZ_TEST"
        ? { quiz: await latestQuizResult(a.targetId), chat: null }
        : { quiz: null, chat: await latestChatSession(a.targetId) },
    enabled: open && type !== "CONTEXT_READING",
    staleTime: 0,
  });

  if (a.submissionStatus === "EXEMPTED") {
    return (
      <Notice icon={ShieldCheck} title="Em được miễn bài này">
        Thầy cô đã miễn bài tập này cho em, không cần nộp.
      </Notice>
    );
  }

  if (done) {
    return (
      <Notice icon={CheckCircle2} title={a.submissionStatus === "LATE_SUBMITTED" ? "Đã nộp muộn" : "Đã nộp bài"} tone="success">
        Nộp lúc {formatDateTime(a.submittedAt)}
        {a.score !== null ? ` · Điểm ${formatScore(a.score)} / 10.` : "."} Bài đã nộp không thể nộp lại.
      </Notice>
    );
  }

  const notStarted = a.submissionStatus === "NOT_STARTED";
  const req = requirementText(a);

  const handleStart = () =>
    start.mutate(a.assignmentId, {
      onSuccess: () => toast.success(type === "CONTEXT_READING" ? "Đã bắt đầu, thời gian đọc đang được tính" : "Đã bắt đầu làm bài"),
      onError: (e) => toast.error(apiErrorMessage(e, "Không bắt đầu được bài tập")),
    });

  const handleSubmit = async () => {
    let payload: SubmitAssignmentPayload = {};
    if (type !== "CONTEXT_READING") {
      const fresh = await evidence.refetch();
      if (fresh.isError) {
        toast.error(apiErrorMessage(fresh.error, "Không kiểm tra được bài làm của em"));
        return;
      }
      if (type === "QUIZ_TEST") {
        const quiz = fresh.data?.quiz;
        if (!quiz) {
          toast.error("Em chưa hoàn thành quiz này. Hãy làm và nộp quiz trước rồi quay lại nộp bài.");
          return;
        }
        payload = { quizSessionId: quiz.sessionId };
      } else {
        const chat = fresh.data?.chat;
        if (!chat) {
          toast.error("Em chưa trò chuyện với nhân vật này. Hãy mở trò chuyện trước rồi quay lại nộp bài.");
          return;
        }
        payload = { chatSessionId: chat.id };
      }
    }
    submit.mutate(
      { id: a.assignmentId, payload },
      {
        onSuccess: (s) =>
          toast.success(
            `${s.status === "LATE_SUBMITTED" ? "Đã nộp muộn" : "Đã nộp bài"}${s.score !== null ? `: ${formatScore(s.score)} / 10 điểm` : ""}`,
          ),
        onError: (e) => toast.error(apiErrorMessage(e, "Không nộp được bài")),
      },
    );
  };

  const submitting = submit.isPending || evidence.isFetching;

  return (
    <Panel>
      <SectionHeading title="Làm bài" description={howTo(a, req)} />

      {a.submissionStatus === "MISSED" && (
        <Notice icon={Info} title="Bài đã bị đánh dấu bỏ lỡ" tone="danger">
          Hệ thống vẫn nhận bài nếu em nộp bây giờ, nhưng bài sẽ tính là nộp muộn.
        </Notice>
      )}

      <ol className="space-y-4">
        <Step n={1} title="Bắt đầu">
          {notStarted ? (
            <button type="button" className="btn-ink" onClick={handleStart} disabled={start.isPending}>
              {start.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}
              Bắt đầu
            </button>
          ) : (
            <p className="text-[13px] text-content-muted">Em đã bắt đầu lúc {formatDateTime(a.startedAt)}.</p>
          )}
        </Step>

        <Step n={2} title={type === "CONTEXT_READING" ? "Đọc bối cảnh" : type === "AI_CHAT_ROLEPLAY" ? "Trò chuyện với nhân vật" : "Làm quiz"}>
          <div className="flex flex-wrap items-center gap-2">
            <Link href={targetHref(a)} className="btn-line" target={type === "CONTEXT_READING" ? "_blank" : undefined}>
              Mở “{a.targetTitle ?? "nội dung"}” <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </Link>
            {type === "CONTEXT_READING" && (
              <Link href={ROUTES.CLASS_MATERIAL_DETAIL("CONTEXT", a.targetId)} className="archive-link" target="_blank">
                Bối cảnh giáo viên soạn? Mở trong tư liệu lớp & trường
              </Link>
            )}
          </div>
          <EvidenceLine assignment={a} evidence={evidence} />
        </Step>

        <Step n={3} title="Nộp bài">
          <button
            type="button"
            className="btn-crimson"
            onClick={() => void handleSubmit()}
            disabled={submitting || (type === "CONTEXT_READING" && notStarted)}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
            Nộp bài
          </button>
          {type === "CONTEXT_READING" && notStarted && (
            <p className="text-[12px] text-content-muted">Bấm “Bắt đầu” trước, nếu không thời gian đọc sẽ gần như bằng 0.</p>
          )}
          {a.expired && <p className="text-[12px] text-[var(--accent-danger)]">Đã quá hạn: bài nộp bây giờ sẽ tính là nộp muộn.</p>}
        </Step>
      </ol>
    </Panel>
  );
}

function howTo(a: StudentAssignment, req: string | null) {
  switch (a.assignmentType) {
    case "CONTEXT_READING":
      return `Thời gian đọc do máy chủ đo từ lúc em bấm “Bắt đầu” đến lúc bấm “Nộp bài”. Đủ ${req} được 10 điểm, ít hơn thì điểm tính theo tỉ lệ.`;
    case "AI_CHAT_ROLEPLAY":
      return `Trò chuyện với nhân vật rồi nộp bài: hệ thống lấy phiên trò chuyện gần nhất của em với nhân vật này và đếm số tin nhắn em gửi. Đủ ${req} được 10 điểm.`;
    case "QUIZ_TEST":
      return "Làm và nộp quiz, sau đó quay lại nộp bài: hệ thống lấy lần làm quiz gần nhất của em. Điểm = số câu đúng / tổng số câu × 10.";
  }
}

function EvidenceLine({
  assignment: a,
  evidence,
}: {
  assignment: StudentAssignment;
  evidence: { data?: { quiz: QuizResult | null; chat: ChatSession | null }; isLoading: boolean; isError: boolean };
}) {
  if (a.assignmentType === "CONTEXT_READING") return null;
  if (evidence.isLoading) return <p className="text-[12px] text-content-muted">Đang kiểm tra bài làm của em…</p>;
  if (evidence.isError) return <p className="text-[12px] text-[var(--accent-danger)]">Không kiểm tra được bài làm của em.</p>;
  if (a.assignmentType === "QUIZ_TEST") {
    const q = evidence.data?.quiz;
    return (
      <p className="text-[12px] text-content-muted">
        {q
          ? `Lần làm gần nhất: ${q.score}/${q.totalQuestions} câu đúng, xong lúc ${formatDateTime(q.completedAt)}. Lần này sẽ được dùng để nộp.`
          : "Em chưa có lần làm quiz nào đã hoàn thành."}
      </p>
    );
  }
  const c = evidence.data?.chat;
  return (
    <p className="text-[12px] text-content-muted">
      {c
        ? `Phiên trò chuyện gần nhất: ${c.messageCount ?? 0} tin nhắn, lúc ${formatDateTime(c.lastMessageAt)}. Phiên này sẽ được dùng để nộp.`
        : "Em chưa có phiên trò chuyện nào với nhân vật này."}
    </p>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[2px] border border-[var(--text-primary)] font-display text-sm font-extrabold" aria-hidden="true">
        {n}
      </span>
      <div className="min-w-0 flex-1 space-y-2">
        <p className="text-[14px] font-bold text-content-text">{title}</p>
        {children}
      </div>
    </li>
  );
}

const NOTICE_TONE = {
  neutral: "border-[var(--border-strong)] bg-[var(--bg-surface)] text-content-muted",
  success: "border-[var(--jade)] bg-[color-mix(in_srgb,var(--jade)_9%,var(--bg-surface))] text-[var(--jade)]",
  danger: "border-[var(--status-danger-border)] bg-[var(--status-danger-bg)] text-[var(--accent-danger)]",
};

function Notice({
  icon: Icon,
  title,
  tone = "neutral",
  children,
}: {
  icon: typeof Info;
  title: string;
  tone?: keyof typeof NOTICE_TONE;
  children: React.ReactNode;
}) {
  return (
    <div className={`flex items-start gap-3 rounded-[2px] border p-4 ${NOTICE_TONE[tone]}`}>
      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <div className="space-y-0.5">
        <p className="text-[14px] font-bold text-content-text">{title}</p>
        <p className="text-[13px] text-content-muted">{children}</p>
      </div>
    </div>
  );
}
