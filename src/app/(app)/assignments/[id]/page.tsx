"use client";

// Lam mot bai duoc giao: GET /student/assignments/{id}, POST .../start, POST .../submit (API that).
// Bai kiem tra chay ngay trong trang nay (khong sang trang luyen tap /quiz) va tu nop bai khi em nop bo de.
import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Info,
  Loader2,
  Play,
  Send,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/ui/empty-state";
import { Panel, SaasShell } from "@/components/saas/saas-ui";
import { QuizSessionPage } from "@/components/quiz/QuizSessionPage";
import {
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
import {
  useQuizDetail,
  useStartQuiz,
  useSubmitQuiz,
} from "@/features/quiz/hooks";
import { clearQuizProgress } from "@/features/quiz/progress-storage";
import {
  isAnswerComplete,
  toAnswerPayload,
  type AnswerData,
} from "@/features/quiz/question-data";
import {
  useMyAssignment,
  useStartAssignment,
  useSubmitAssignment,
} from "@/features/saas/hooks-assignment-api";
import { apiErrorMessage, apiErrorStatus } from "@/features/saas/hooks-api";
import { useStudentLocalItem } from "@/features/saas/hooks-local-content";
import type {
  StudentAssignment,
  SubmitAssignmentPayload,
} from "@/services/assignment.service";
import { chatService, type ChatSession } from "@/services/chat.service";
import {
  quizService,
  type QuizQuestion,
  type QuizResult,
} from "@/services/quiz.service";

/** Học sinh làm một bài được giao (Role Matrix row 17). */
export default function MyAssignmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const role = useRole();
  // Dang lam bai kiem tra: an tieu de trang de cau hoi len sat dau trang.
  const [takingQuiz, setTakingQuiz] = React.useState(false);
  return (
    <SaasShell
      variant="app"
      title="Làm bài tập"
      description="Hoàn thành bài trước hạn nộp. Điểm do hệ thống tự chấm khi bạn nộp bài."
      hideHeading={takingQuiz}
    >
      {role === "SCHOOL_STUDENT" ? (
        <AssignmentDetail
          id={id}
          takingQuiz={takingQuiz}
          setTakingQuiz={setTakingQuiz}
        />
      ) : (
        <EmptyState
          title="Trang dành cho học sinh"
          description="Chỉ tài khoản học sinh của trường mới làm được bài tập được giao."
        />
      )}
    </SaasShell>
  );
}

const back = (
  <Link href={ROUTES.MY_ASSIGNMENTS} className="archive-link">
    <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Bài tập được giao
  </Link>
);

function AssignmentDetail({
  id,
  takingQuiz,
  setTakingQuiz,
}: {
  id: string;
  takingQuiz: boolean;
  setTakingQuiz: (v: boolean) => void;
}) {
  const { data: a, isLoading, isError, error, refetch } = useMyAssignment(id);

  if (isLoading) return <AssignmentListSkeleton count={1} />;
  if (isError) {
    const status = apiErrorStatus(error);
    if (status === 404 || status === 403) {
      return (
        <EmptyState
          title="Không tìm thấy bài tập"
          description="Bài không tồn tại, đã bị hủy hoặc không thuộc lớp của bạn."
          action={back}
        />
      );
    }
    return (
      <AssignmentLoadError
        message={apiErrorMessage(
          error,
          "Vui lòng kiểm tra kết nối rồi thử lại.",
        )}
        onRetry={() => void refetch()}
      />
    );
  }
  if (!a) return null;

  if (takingQuiz)
    return (
      <AssignmentQuizRunner
        assignment={a}
        onExit={() => setTakingQuiz(false)}
      />
    );

  const req = requirementText(a);
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
            <h2 className="archive-title is-plain text-2xl sm:text-3xl">
              {a.title}
            </h2>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-content-muted">
              <span className="inline-flex items-center gap-1.5">
                <UsersRound className="h-3.5 w-3.5" aria-hidden="true" /> Lớp{" "}
                {a.className}
              </span>
              <DueLine assignment={a} />
              {req && <span>Yêu cầu: {req}</span>}
            </div>
          </div>
          {a.score !== null && <ScoreChip score={a.score} size="lg" />}
        </div>

        {a.description && (
          <div className="border-l-2 border-[var(--accent-gold)] pl-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-content-muted">
              Lời dặn của thầy cô
            </p>
            <p className="mt-0.5 whitespace-pre-wrap text-[14px] leading-relaxed text-content-text">
              {a.description}
            </p>
          </div>
        )}

        <div className="border-t border-[var(--border-default)] pt-4">
          <AssignmentActions
            assignment={a}
            onTakeQuiz={() => setTakingQuiz(true)}
          />
        </div>
      </Panel>
    </div>
  );
}

// ─── Hanh dong chinh ───────────────────────────────────────────────────────

/** Lan lam quiz da hoan thanh gan nhat cho quiz cua bai (BE khong loc theo quizId). */
async function latestQuizResult(quizId: string): Promise<QuizResult | null> {
  const res = await quizService.getMyResults({ page: 0, size: 50 });
  const mine = res.content.filter((r) => r.quizId === quizId && r.completedAt);
  mine.sort(
    (x, y) =>
      (parseLocal(y.completedAt)?.getTime() ?? 0) -
      (parseLocal(x.completedAt)?.getTime() ?? 0),
  );
  return mine[0] ?? null;
}

/** Phien chat gan nhat voi nhan vat cua bai (BE bo qua contextId). */
async function latestChatSession(
  characterId: string,
): Promise<ChatSession | null> {
  const sessions = await chatService.getSessions(characterId, "");
  const mine = (sessions ?? []).filter(
    (s) => s.characterId === characterId || !s.characterId,
  );
  mine.sort(
    (x, y) =>
      (parseLocal(y.lastMessageAt)?.getTime() ?? 0) -
      (parseLocal(x.lastMessageAt)?.getTime() ?? 0),
  );
  return mine[0] ?? null;
}

/**
 * Mot nut chinh theo trang thai:
 * - Bai kiem tra: "Bắt đầu làm bài" -> lam ngay tai day, nop bo de la nop bai.
 * - Tro chuyen / doc: "Bắt đầu" (bat dau tinh + mo noi dung), sau do "Nộp bài".
 */
function AssignmentActions({
  assignment: a,
  onTakeQuiz,
}: {
  assignment: StudentAssignment;
  onTakeQuiz: () => void;
}) {
  const router = useRouter();
  const start = useStartAssignment();
  const submit = useSubmitAssignment();
  const type = a.assignmentType;
  const done = isDone(a.submissionStatus);
  const open = !done && a.submissionStatus !== "EXEMPTED";
  const notStarted = a.submissionStatus === "NOT_STARTED";

  // Boi canh do giao vien soan nam o kho tu lieu, khong o trang su kien HistoryTalk.
  const localContext = useStudentLocalItem(
    type === "CONTEXT_READING" ? "CONTEXT" : null,
    a.targetId,
  );
  const contentHref =
    type === "CONTEXT_READING" && localContext.isSuccess
      ? ROUTES.CLASS_MATERIAL_DETAIL("CONTEXT", a.targetId)
      : targetHref(a);

  // Lan lam / phien chat se dung de nop (bai kiem tra lam o trang luyen tap truoc day van nop duoc).
  const evidence = useQuery({
    queryKey: [
      "assignments",
      "student",
      "evidence",
      a.assignmentId,
      type,
      a.targetId,
    ],
    queryFn: async () =>
      type === "QUIZ_TEST"
        ? { quiz: await latestQuizResult(a.targetId), chat: null }
        : { quiz: null, chat: await latestChatSession(a.targetId) },
    enabled: open && type !== "CONTEXT_READING",
    staleTime: 0,
  });

  if (a.submissionStatus === "EXEMPTED") {
    return (
      <Notice icon={ShieldCheck} title="Bạn được miễn bài này">
        Thầy cô đã miễn bài tập này cho bạn, không cần nộp.
      </Notice>
    );
  }
  if (done) {
    return (
      <Notice
        icon={CheckCircle2}
        title={
          a.submissionStatus === "LATE_SUBMITTED" ? "Đã nộp muộn" : "Đã nộp bài"
        }
        tone="success"
      >
        Nộp lúc {formatDateTime(a.submittedAt)}
        {a.score !== null ? ` · Điểm ${formatScore(a.score)} / 10.` : "."} Bài
        đã nộp không thể nộp lại.
      </Notice>
    );
  }

  const ensureStarted = async () => {
    if (!notStarted) return true;
    try {
      await start.mutateAsync(a.assignmentId);
      return true;
    } catch (e) {
      toast.error(apiErrorMessage(e, "Không bắt đầu được bài tập"));
      return false;
    }
  };

  const submitWith = (payload: SubmitAssignmentPayload) =>
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

  const busy = start.isPending || submit.isPending;
  const spinner = (
    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
  );
  const late = a.expired || a.submissionStatus === "MISSED";

  let primary: React.ReactNode;
  let secondary: React.ReactNode = null;
  let hint: React.ReactNode;

  if (type === "QUIZ_TEST") {
    const prev = evidence.data?.quiz;
    primary = (
      <button
        type="button"
        className="btn-crimson"
        disabled={busy}
        onClick={async () => {
          if (await ensureStarted()) onTakeQuiz();
        }}
      >
        {busy ? spinner : <Play className="h-4 w-4" aria-hidden="true" />}
        {notStarted ? "Bắt đầu làm bài" : "Làm bài"}
      </button>
    );
    if (prev) {
      secondary = (
        <button
          type="button"
          className="btn-line"
          disabled={busy}
          onClick={() => submitWith({ quizSessionId: prev.sessionId })}
        >
          <Send className="h-4 w-4" aria-hidden="true" /> Nộp lần làm trước (
          {prev.score}/{prev.totalQuestions} câu đúng)
        </button>
      );
    }
    hint =
      "Làm xong và bấm nộp là bài được nộp luôn. Điểm = số câu đúng / tổng số câu × 10.";
  } else if (type === "AI_CHAT_ROLEPLAY") {
    const chat = evidence.data?.chat;
    if (notStarted || !chat) {
      primary = (
        <button
          type="button"
          className="btn-crimson"
          disabled={busy}
          onClick={async () => {
            if (await ensureStarted()) router.push(contentHref);
          }}
        >
          {busy ? spinner : <Play className="h-4 w-4" aria-hidden="true" />}
          {notStarted ? "Bắt đầu trò chuyện" : "Tiếp tục trò chuyện"}
        </button>
      );
    } else {
      primary = (
        <button
          type="button"
          className="btn-crimson"
          disabled={busy || evidence.isFetching}
          onClick={() => submitWith({ chatSessionId: chat.id })}
        >
          {busy ? spinner : <Send className="h-4 w-4" aria-hidden="true" />} Nộp
          bài ({chat.messageCount ?? 0} tin nhắn)
        </button>
      );
      secondary = (
        <Link href={contentHref} className="btn-line">
          Tiếp tục trò chuyện
        </Link>
      );
    }
    hint = `Trò chuyện với ${a.targetTitle ?? "nhân vật"} rồi quay lại nộp bài. Cần ${requirementText(a)?.toLowerCase() ?? "đủ số tin nhắn"} để được 10 điểm.`;
  } else {
    if (notStarted) {
      primary = (
        <button
          type="button"
          className="btn-crimson"
          disabled={busy}
          onClick={async () => {
            if (await ensureStarted())
              window.open(contentHref, "_blank", "noopener");
          }}
        >
          {busy ? spinner : <Play className="h-4 w-4" aria-hidden="true" />} Bắt
          đầu đọc
        </button>
      );
    } else {
      primary = (
        <button
          type="button"
          className="btn-crimson"
          disabled={busy}
          onClick={() => submitWith({})}
        >
          {busy ? spinner : <Send className="h-4 w-4" aria-hidden="true" />} Nộp
          bài
        </button>
      );
      secondary = (
        <Link href={contentHref} className="btn-line" target="_blank">
          Mở lại bối cảnh{" "}
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
        </Link>
      );
    }
    hint = notStarted
      ? `Bối cảnh mở ở tab mới. Thời gian đọc tính từ lúc bấm “Bắt đầu đọc” đến lúc nộp; cần ${requirementText(a)?.toLowerCase() ?? "đủ thời gian"}.`
      : `Bạn bắt đầu đọc lúc ${formatDateTime(a.startedAt)}. Đọc xong thì bấm “Nộp bài”.`;
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {primary}
        {secondary}
      </div>
      <p className="text-[12px] text-content-muted">{hint}</p>
      {late && (
        <p className="text-[12px] text-[var(--accent-danger)]">
          Đã quá hạn: bài nộp bây giờ sẽ tính là nộp muộn.
        </p>
      )}
    </div>
  );
}

// ─── Lam bai kiem tra ngay trong trang ─────────────────────────────────────

/** Mo mot phien quiz cho bai (POST /quizzes/{id}/start), nop quiz roi nop bai bang sessionId do. */
function AssignmentQuizRunner({
  assignment: a,
  onExit,
}: {
  assignment: StudentAssignment;
  onExit: () => void;
}) {
  const quiz = useQuizDetail(a.targetId);
  const startQuiz = useStartQuiz();
  const submitQuiz = useSubmitQuiz();
  const submitAssignment = useSubmitAssignment();
  const [session, setSession] = React.useState<{
    id: string;
    questions: QuizQuestion[];
    startedAt: number;
  } | null>(null);
  const [failed, setFailed] = React.useState<string | null>(null);
  const startedRef = React.useRef(false);

  const begin = React.useCallback(() => {
    setFailed(null);
    clearQuizProgress(a.targetId);
    startQuiz
      .mutateAsync({ quizId: a.targetId })
      .then((s) =>
        setSession({
          id: s.sessionId,
          questions: s.questions,
          startedAt: Date.now(),
        }),
      )
      .catch((e) =>
        setFailed(apiErrorMessage(e, "Không mở được bài kiểm tra.")),
      );
  }, [a.targetId, startQuiz]);

  // Mot phien cho moi lan vao (StrictMode goi effect 2 lan o dev).
  React.useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    begin();
  }, [begin]);

  const handleSubmit = async (answers: Record<string, AnswerData>) => {
    if (!session) return false;
    try {
      await submitQuiz.mutateAsync({
        sessionId: session.id,
        answers: session.questions.flatMap((q) => {
          const ans = answers[q.questionId];
          return ans && isAnswerComplete(q, ans)
            ? [
                {
                  questionId: q.questionId,
                  answerData: toAnswerPayload(q, ans),
                },
              ]
            : [];
        }),
      });
      clearQuizProgress(a.targetId);
    } catch (e) {
      toast.error(
        apiErrorMessage(e, "Nộp bài kiểm tra thất bại. Vui lòng thử lại."),
      );
      return false;
    }
    try {
      const s = await submitAssignment.mutateAsync({
        id: a.assignmentId,
        payload: { quizSessionId: session.id },
      });
      toast.success(
        `${s.status === "LATE_SUBMITTED" ? "Đã nộp muộn" : "Đã nộp bài"}${s.score !== null ? `: ${formatScore(s.score)} / 10 điểm` : ""}`,
      );
    } catch (e) {
      // Quiz da luu: em co the bam "Nộp lần làm trước" o trang bai tap.
      toast.error(
        apiErrorMessage(
          e,
          "Đã lưu bài làm nhưng chưa nộp được bài tập. Bấm “Nộp lần làm trước” để thử lại.",
        ),
      );
    }
    onExit();
    return true;
  };

  if (failed) {
    return (
      <div className="space-y-4">
        <Notice icon={Info} title="Không mở được bài kiểm tra" tone="danger">
          {failed}
        </Notice>
        <div className="flex gap-2">
          <button type="button" className="btn-crimson" onClick={begin}>
            Thử lại
          </button>
          <button type="button" className="btn-line" onClick={onExit}>
            Quay lại bài tập
          </button>
        </div>
      </div>
    );
  }
  if (!session || !quiz.data) {
    return (
      <p className="flex items-center gap-2 text-sm text-content-muted">
        <Loader2
          className="h-4 w-4 animate-spin text-[var(--accent-gold)]"
          aria-hidden="true"
        />{" "}
        Đang chuẩn bị câu hỏi...
      </p>
    );
  }
  return (
    // Cau hoi chay theo chieu dai trang; cot thoi gian / nop bai dinh ben phai khi cuon.
    <QuizSessionPage
      embedded
      quiz={quiz.data}
      questions={session.questions}
      sessionId={session.id}
      onSubmit={handleSubmit}
      onBack={onExit}
      onRetry={() => {
        setSession(null);
        begin();
      }}
      startTime={session.startedAt}
    />
  );
}

// ─── UI nho ────────────────────────────────────────────────────────────────

const NOTICE_TONE = {
  neutral:
    "border-[var(--border-strong)] bg-[var(--bg-surface)] text-content-muted",
  success:
    "border-[var(--jade)] bg-[color-mix(in_srgb,var(--jade)_9%,var(--bg-surface))] text-[var(--jade)]",
  danger:
    "border-[var(--status-danger-border)] bg-[var(--status-danger-bg)] text-[var(--accent-danger)]",
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
    <div
      className={`flex items-start gap-3 rounded-[2px] border p-4 ${NOTICE_TONE[tone]}`}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <div className="space-y-0.5">
        <p className="text-[14px] font-bold text-content-text">{title}</p>
        <p className="text-[13px] text-content-muted">{children}</p>
      </div>
    </div>
  );
}
