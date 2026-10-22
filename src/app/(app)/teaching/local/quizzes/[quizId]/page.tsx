"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Check, Eye, EyeOff, Pencil, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/commons/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { StaffFormInput, StaffFormSelect } from "@/components/staff/staff-form";
import { QuestionAnswerSummary, QuestionForm, fromStaffQuestion, toQuestionPayload, type QuizQuestion } from "@/components/staff/quiz-question-editor";
import { QueryState } from "@/components/saas/local-content-ui";
import { Field, IconAction, Panel, SaasShell, SectionHeading } from "@/components/saas/saas-ui";
import { ROUTES } from "@/constants/routes";
import { apiErrorMessage, apiErrorStatus } from "@/features/saas/hooks-api";
import { useLocalQuiz, useLocalQuizMutations } from "@/features/saas/hooks-local-content";
import { LEVEL_LABELS } from "@/features/saas/hooks-teaching";
import type { LocalQuiz } from "@/services/local-quiz.service";
import type { StaffQuizLevel } from "@/services/staff.quiz.service";

const LEVEL_OPTIONS = (Object.keys(LEVEL_LABELS) as StaffQuizLevel[]).map((l) => ({ value: l, label: LEVEL_LABELS[l] }));

/** Teacher: questions of a quiz written for a local context (Sprint 7, /teacher/local-contents/quizzes/**). */
export default function LocalQuizPage() {
  const { quizId } = useParams<{ quizId: string }>();
  const params = useSearchParams();
  // Chi chap nhan quay ve trang giao bai (tranh open redirect qua ?returnTo=).
  const rawReturn = params.get("returnTo");
  const returnTo = rawReturn?.startsWith(`${ROUTES.TEACHING.ASSIGNMENT_NEW}?`) ? rawReturn : null;
  const query = useLocalQuiz(quizId);
  const status = apiErrorStatus(query.error);
  const back = query.data?.contextId ? ROUTES.TEACHING.LOCAL_EDIT(query.data.contextId, "CONTEXT") : ROUTES.TEACHING.LOCAL;

  return (
    <SaasShell
      variant="app"
      live
      title={query.data?.title ?? "Bộ đề"}
      description="Soạn câu hỏi trắc nghiệm, điền từ hoặc ghép cặp. Bật xuất bản để giao cho lớp ở mục Bài tập."
      backLink={
        <Link href={back} className="archive-link">
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> {query.data?.contextTitle ? `Bối cảnh “${query.data.contextTitle}”` : "Soạn tư liệu"}
        </Link>
      }
    >
      {status === 403 || status === 404 ? (
        <EmptyState title="Không mở được bộ đề" description="Bộ đề đã bị xóa hoặc không phải do bạn soạn." />
      ) : (
        <QueryState isLoading={query.isLoading} isError={query.isError} error={query.error} onRetry={() => void query.refetch()}>
          {query.data && <QuizEditor key={query.data.quizId} quiz={query.data} returnTo={returnTo} />}
        </QueryState>
      )}
    </SaasShell>
  );
}

function QuizEditor({ quiz, returnTo }: { quiz: LocalQuiz; returnTo: string | null }) {
  const router = useRouter();
  const m = useLocalQuizMutations();
  const [title, setTitle] = React.useState(quiz.title);
  const [level, setLevel] = React.useState<StaffQuizLevel>(quiz.level);
  const [adding, setAdding] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [deleteQuiz, setDeleteQuiz] = React.useState(false);
  const [deleteQuestion, setDeleteQuestion] = React.useState<QuizQuestion | null>(null);

  const questions = quiz.questions.map((q, i) => ({ ...fromStaffQuestion(q), orderIndex: i }));
  const dirty = title.trim() !== quiz.title || level !== quiz.level;
  const fail = (fallback: string) => (e: unknown) => toast.error(apiErrorMessage(e, fallback));

  const saveInfo = () => {
    if (!title.trim()) {
      toast.error("Nhập tên bộ đề");
      return;
    }
    m.update.mutate(
      { quizId: quiz.quizId, payload: { title: title.trim(), level } },
      { onSuccess: () => toast.success("Đã lưu thông tin bộ đề"), onError: fail("Không lưu được bộ đề.") },
    );
  };

  const togglePublish = () => {
    if (!quiz.isPublished && questions.length === 0) {
      toast.error("Thêm ít nhất một câu hỏi trước khi xuất bản.");
      return;
    }
    m.togglePublish.mutate(quiz.quizId, {
      onSuccess: (q) => toast.success(q.isPublished ? "Đã xuất bản bộ đề" : "Đã chuyển bộ đề về nháp"),
      onError: fail("Không đổi được trạng thái."),
    });
  };

  const saveQuestion = (q: QuizQuestion, existingId?: string) => {
    const payload = toQuestionPayload(q);
    const done = { onSuccess: () => (existingId ? setEditingId(null) : setAdding(false)), onError: fail("Không lưu được câu hỏi.") };
    if (existingId) {
      m.updateQuestion.mutate({ quizId: quiz.quizId, questionId: existingId, payload }, { ...done, onSuccess: () => { done.onSuccess(); toast.success("Đã lưu câu hỏi"); } });
    } else {
      m.addQuestion.mutate({ quizId: quiz.quizId, payload }, { ...done, onSuccess: () => { done.onSuccess(); toast.success("Đã thêm câu hỏi"); } });
    }
  };

  const busyQuestion = m.addQuestion.isPending || m.updateQuestion.isPending;

  // Den tu trang giao bai: xuat ban (neu can) roi quay lai, bo de duoc chon san.
  const backToAssignment = () => {
    if (!returnTo) return;
    if (quiz.isPublished) {
      router.push(returnTo);
      return;
    }
    m.togglePublish.mutate(quiz.quizId, {
      onSuccess: () => {
        toast.success("Đã xuất bản bộ đề");
        router.push(returnTo);
      },
      onError: fail("Không xuất bản được bộ đề."),
    });
  };

  return (
    <div className="space-y-6">
      {returnTo && (
        <div className="flex flex-col gap-3 rounded-[2px] border-2 border-[var(--accent-gold)] bg-[var(--accent-gold-active-bg)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-content-heading">
            {questions.length === 0
              ? "Bạn đang soạn bộ đề để giao bài. Thêm ít nhất 1 câu hỏi để tiếp tục."
              : `Đã có ${questions.length} câu hỏi. Soạn xong thì quay lại để giao cho lớp.`}
          </p>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Link href={returnTo} className="btn-line">
              Quay lại, chưa giao
            </Link>
            <button
              type="button"
              className="btn-crimson disabled:opacity-60"
              disabled={questions.length === 0 || m.togglePublish.isPending || adding || editingId !== null}
              onClick={backToAssignment}
            >
              <Check className="h-4 w-4" aria-hidden="true" />
              {quiz.isPublished ? "Dùng bộ đề này để giao" : "Xuất bản & dùng để giao"}
            </button>
          </div>
        </div>
      )}
      <Panel>
        <div className="grid gap-4 sm:grid-cols-[1fr_200px]">
          <Field label="Tên bộ đề" required htmlFor="lq-title">
            <StaffFormInput id="lq-title" value={title} maxLength={200} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field label="Mức độ">
            <StaffFormSelect value={level} onValueChange={setLevel} options={LEVEL_OPTIONS} className="w-full" />
          </Field>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm text-content-muted">
            {quiz.isPublished ? "Đã xuất bản: có thể giao cho lớp ở mục Bài tập." : "Nháp: học sinh chưa làm được."}
          </span>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-line text-[var(--accent-danger)]" onClick={() => setDeleteQuiz(true)}>
              <Trash2 className="h-4 w-4" aria-hidden="true" /> Xóa bộ đề
            </button>
            <button type="button" className="btn-line disabled:opacity-60" disabled={m.togglePublish.isPending} onClick={togglePublish}>
              {quiz.isPublished ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
              {quiz.isPublished ? "Chuyển về nháp" : "Xuất bản"}
            </button>
            <button type="button" className="btn-crimson disabled:opacity-60" disabled={!dirty || m.update.isPending} onClick={saveInfo}>
              <Save className="h-4 w-4" aria-hidden="true" /> Lưu thông tin
            </button>
          </div>
        </div>
      </Panel>

      <section className="space-y-4">
        <SectionHeading
          title={`Câu hỏi (${questions.length})`}
          description="Mỗi câu hỏi được lưu ngay khi bạn bấm lưu trong ô soạn."
          actions={
            !adding && (
              <button
                type="button"
                className="btn-ink"
                onClick={() => {
                  setEditingId(null);
                  setAdding(true);
                }}
              >
                <Plus className="h-4 w-4" aria-hidden="true" /> Thêm câu hỏi
              </button>
            )
          }
        />

        {questions.length === 0 && !adding && <p className="text-sm text-content-muted">Chưa có câu hỏi nào.</p>}

        <ol className="space-y-3">
          {questions.map((q, i) =>
            editingId === q.questionId ? (
              <li key={q.questionId}>
                <QuestionForm initial={q} orderIndex={i} isSaving={busyQuestion} onSave={(d) => saveQuestion(d, q.questionId)} onCancel={() => setEditingId(null)} />
              </li>
            ) : (
              <li key={q.questionId} className="flex items-start gap-3 rounded-[2px] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-4 py-3">
                <span className="mt-0.5 w-6 shrink-0 text-sm font-bold tabular-nums text-content-muted">{i + 1}.</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-content-heading">{q.content}</p>
                  <QuestionAnswerSummary q={q} />
                </div>
                <div className="flex shrink-0">
                  <IconAction label={`Sửa câu ${i + 1}`} onClick={() => { setAdding(false); setEditingId(q.questionId); }}>
                    <Pencil className="h-4 w-4" />
                  </IconAction>
                  <IconAction label={`Xóa câu ${i + 1}`} tone="danger" onClick={() => setDeleteQuestion(q)}>
                    <Trash2 className="h-4 w-4" />
                  </IconAction>
                </div>
              </li>
            ),
          )}
        </ol>

        {adding && <QuestionForm orderIndex={questions.length} isSaving={busyQuestion} onSave={(d) => saveQuestion(d)} onCancel={() => setAdding(false)} />}
      </section>

      <ConfirmDialog
        open={!!deleteQuestion}
        onOpenChange={(o) => !o && setDeleteQuestion(null)}
        variant="danger"
        title="Xóa câu hỏi?"
        description={deleteQuestion?.content}
        confirmLabel="Xóa"
        onConfirm={() => {
          const q = deleteQuestion;
          setDeleteQuestion(null);
          if (!q) return;
          m.deleteQuestion.mutate(
            { quizId: quiz.quizId, questionId: q.questionId },
            { onSuccess: () => toast.success("Đã xóa câu hỏi"), onError: fail("Không xóa được câu hỏi.") },
          );
        }}
      />

      <ConfirmDialog
        open={deleteQuiz}
        onOpenChange={setDeleteQuiz}
        variant="danger"
        title={`Xóa bộ đề “${quiz.title}”?`}
        description="Bài tập đã giao bằng bộ đề này có thể không làm tiếp được."
        confirmLabel="Xóa bộ đề"
        onConfirm={() =>
          m.remove.mutate(quiz.quizId, {
            onSuccess: () => {
              toast.success("Đã xóa bộ đề");
              router.push(quiz.contextId ? ROUTES.TEACHING.LOCAL_EDIT(quiz.contextId, "CONTEXT") : ROUTES.TEACHING.LOCAL);
            },
            onError: fail("Không xóa được bộ đề."),
          })
        }
      />
    </div>
  );
}
