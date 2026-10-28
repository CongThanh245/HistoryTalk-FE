"use client";

import * as React from "react";
import {
  ArrowLeft, ChevronLeft, ChevronRight, Library, Link2, Pencil, Plus, Search, Trash2, X,
} from "lucide-react";
import { toast } from "sonner";

import { StaffShell } from "@/components/staff/staff-shell";
import { ConfirmDialog } from "@/components/commons/confirm-dialog";
import {
  QuestionAnswerSummary,
  QuestionForm,
  fromStaffQuestion,
  toQuestionPayload,
  type QuizQuestion,
} from "@/components/staff/quiz-question-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectEmpty, SelectItem, SelectSearch, SelectTrigger, SelectValue, useSelectSearch,
} from "@/components/ui/select";
import {
  useAttachBankQuestion,
  useCreateBankQuestion,
  useDetachBankQuestion,
  useQuestionBank,
  useSoftDeleteBankQuestion,
  useStaffQuizzes,
  useUpdateBankQuestion,
} from "@/features/staff/quiz/hooks";
import { QUESTION_TYPE_LABELS, type QuestionType } from "@/features/quiz/question-data";
import type { QuestionBankItem } from "@/services/staff.quiz.service";
import { getApiErrorMessage } from "@/lib/utils/api-error";
import { cn } from "@/lib/utils/cn";

const PAGE_SIZE = 20;
const TYPE_FILTERS: { value: QuestionType | ""; label: string }[] = [
  { value: "", label: "Tất cả" },
  { value: "MULTIPLE_CHOICE", label: QUESTION_TYPE_LABELS.MULTIPLE_CHOICE },
  { value: "FILL_IN_BLANK", label: QUESTION_TYPE_LABELS.FILL_IN_BLANK },
  { value: "MATCHING", label: QUESTION_TYPE_LABELS.MATCHING },
];

/** Ngan hang cau hoi doc lap: CRUD + gan / go cau hoi vao quiz (GET/POST/PUT/PATCH/DELETE /staff/question-bank). */
export function QuestionBankView({ onBack }: { onBack: () => void }) {
  const [search, setSearch] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState<QuestionType | "">("");
  const [page, setPage] = React.useState(0);
  const [editing, setEditing] = React.useState<QuestionBankItem | "new" | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<QuestionBankItem | null>(null);
  const [attachTarget, setAttachTarget] = React.useState<QuestionBankItem | null>(null);
  const [attachQuizId, setAttachQuizId] = React.useState("");
  const quizSearch = useSelectSearch();

  const params = React.useMemo(() => ({
    ...(search.trim() && { search: search.trim() }),
    ...(typeFilter && { questionType: typeFilter }),
    page,
    size: PAGE_SIZE,
  }), [search, typeFilter, page]);

  const { data, isLoading, isError, refetch } = useQuestionBank(params);
  // BE chi tra co `assignedToQuiz`; tim quiz chua cau hoi qua danh sach quiz (co kem questions).
  const { data: quizData } = useStaffQuizzes({ page: 0, size: 200 });
  const quizzes = React.useMemo(
    () => (quizData?.content ?? []).filter((quiz) => !quiz.deletedAt),
    [quizData?.content],
  );

  const createQuestion = useCreateBankQuestion();
  const updateQuestion = useUpdateBankQuestion();
  const softDelete = useSoftDeleteBankQuestion();
  const attach = useAttachBankQuestion();
  const detach = useDetachBankQuestion();

  const items = data?.content ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalItems = data?.totalElements ?? 0;

  const linkedQuizzes = (questionId: string) =>
    quizzes.filter((quiz) => quiz.questions.some((q) => q.questionId === questionId));

  const handleSave = (draft: QuizQuestion) => {
    const payload = toQuestionPayload(draft);
    const onError = (error: unknown) =>
      toast.error(getApiErrorMessage(error, "Lưu câu hỏi thất bại. Vui lòng thử lại."));
    if (editing === "new") {
      createQuestion.mutate(payload, {
        onSuccess: () => { toast.success("Đã thêm câu hỏi vào ngân hàng."); setEditing(null); },
        onError,
      });
    } else if (editing) {
      updateQuestion.mutate({ questionId: editing.questionId, payload }, {
        onSuccess: () => { toast.success("Đã cập nhật câu hỏi."); setEditing(null); },
        onError,
      });
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    softDelete.mutate(deleteTarget.questionId, {
      onSuccess: () => { toast.success("Đã xoá câu hỏi khỏi ngân hàng."); setDeleteTarget(null); },
      onError: (error) => toast.error(getApiErrorMessage(error, "Xoá câu hỏi thất bại.")),
    });
  };

  const handleAttach = () => {
    if (!attachTarget || !attachQuizId) return;
    attach.mutate({ questionId: attachTarget.questionId, quizId: attachQuizId }, {
      onSuccess: () => {
        toast.success("Đã gắn câu hỏi vào quiz.");
        setAttachTarget(null);
        setAttachQuizId("");
      },
      onError: (error) => toast.error(getApiErrorMessage(error, "Gắn câu hỏi thất bại.")),
    });
  };

  const handleDetach = (questionId: string, quizId: string, quizTitle: string) => {
    detach.mutate({ questionId, quizId }, {
      onSuccess: () => toast.success(`Đã gỡ câu hỏi khỏi "${quizTitle}".`),
      onError: (error) => toast.error(getApiErrorMessage(error, "Gỡ câu hỏi thất bại.")),
    });
  };

  const attachableQuizzes = attachTarget
    ? quizzes.filter((quiz) => !quiz.questions.some((q) => q.questionId === attachTarget.questionId))
    : [];

  return (
    <StaffShell
      title="Ngân hàng câu hỏi"
      label="Nội dung"
      description="Kho câu hỏi dùng chung (trắc nghiệm, điền chỗ trống, nối cặp) — có thể gắn vào nhiều quiz."
      icon={Library}
    >
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm mb-6 hover:opacity-70 transition-opacity text-content-muted"
      >
        <ArrowLeft className="h-4 w-4" /> Quay lại danh sách quiz
      </button>

      <section className="rounded-xl border p-6 space-y-5 bg-[var(--bg-surface)] border-border-card">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            {TYPE_FILTERS.map((opt) => (
              <button
                key={opt.value || "all"}
                type="button"
                onClick={() => { setTypeFilter(opt.value); setPage(0); }}
                className={cn(
                  "px-3 h-8 rounded-sm text-xs font-semibold border transition-all",
                  typeFilter === opt.value
                    ? "bg-[var(--accent-gold-active-bg)] border-accent-gold text-content-heading"
                    : "bg-transparent border-card-light-border text-content-muted",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-content-subtle" />
              <Input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                placeholder="Tìm câu hỏi..."
                className="pl-9 h-9 w-[220px] rounded-sm border-0 bg-[var(--status-neutral-bg)]"
              />
            </div>
            <Button
              type="button"
              className="h-9 rounded-sm px-4 font-semibold"
              onClick={() => setEditing("new")}
              disabled={editing !== null}
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Thêm câu hỏi
            </Button>
          </div>
        </div>

        {editing === "new" && (
          <QuestionForm
            orderIndex={1}
            onSave={handleSave}
            onCancel={() => setEditing(null)}
            isSaving={createQuestion.isPending}
          />
        )}

        {isLoading ? (
          <p className="py-10 text-center text-sm text-content-muted">Đang tải câu hỏi...</p>
        ) : isError ? (
          // A failed request must not look like an empty bank.
          <div className="py-10 text-center text-sm text-accent-danger">
            <p>Không tải được ngân hàng câu hỏi.</p>
            <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => void refetch()}>
              Thử lại
            </Button>
          </div>
        ) : items.length === 0 ? (
          <p className="py-10 text-center text-sm text-content-muted">Chưa có câu hỏi nào trong ngân hàng.</p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => {
              if (editing !== "new" && editing?.questionId === item.questionId) {
                return (
                  <QuestionForm
                    key={item.questionId}
                    initial={fromStaffQuestion(item)}
                    orderIndex={1}
                    onSave={handleSave}
                    onCancel={() => setEditing(null)}
                    isSaving={updateQuestion.isPending}
                  />
                );
              }
              const linked = linkedQuizzes(item.questionId);
              return (
                <div
                  key={item.questionId}
                  className="flex items-start gap-4 rounded-sm border border-card-light-border bg-card-light-bg px-5 py-4 group transition-all hover:border-[var(--text-primary)]"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold leading-relaxed text-content-text">{item.content}</p>
                    <QuestionAnswerSummary q={fromStaffQuestion(item)} />
                    {(linked.length > 0 || item.assignedToQuiz) && (
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span className="text-xs font-semibold text-content-subtle">Trong quiz:</span>
                        {linked.length === 0 && (
                          <span className="text-xs text-content-muted">Đã gắn vào quiz</span>
                        )}
                        {linked.map((quiz) => (
                          <span
                            key={quiz.quizId}
                            className="inline-flex items-center gap-1 rounded-sm border border-[var(--border-default)] bg-[var(--status-neutral-bg)] px-2 py-0.5 text-xs text-content-text"
                          >
                            {quiz.title}
                            <button
                              type="button"
                              className="text-content-subtle hover:text-accent-danger disabled:opacity-50"
                              disabled={detach.isPending}
                              onClick={() => handleDetach(item.questionId, quiz.quizId, quiz.title)}
                              title="Gỡ khỏi quiz"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button type="button" variant="ghost" size="icon-sm" className="rounded-sm h-8 w-8 text-content-heading"
                      onClick={() => { setAttachTarget(item); setAttachQuizId(""); }} title="Gắn vào quiz">
                      <Link2 className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon-sm" className="rounded-sm h-8 w-8 text-accent-blue"
                      disabled={editing !== null} onClick={() => setEditing(item)} title="Sửa">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon-sm" className="rounded-sm h-8 w-8 text-accent-danger"
                      onClick={() => setDeleteTarget(item)} title="Xoá">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-content-subtle">
              Trang {page + 1} / {totalPages} · {totalItems} câu hỏi
            </p>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon-sm" className="rounded-sm"
                disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon-sm" className="rounded-sm"
                disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </section>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Xoá câu hỏi khỏi ngân hàng?"
        description="Câu hỏi sẽ bị xoá mềm và không thể gắn thêm vào quiz."
        isPending={softDelete.isPending}
        confirmLabel="Xoá"
        variant="danger"
        onConfirm={handleDelete}
      />

      <ConfirmDialog
        open={!!attachTarget}
        onOpenChange={(open) => { if (!open) { setAttachTarget(null); setAttachQuizId(""); } }}
        title="Gắn câu hỏi vào quiz"
        description={attachTarget?.content}
        isPending={attach.isPending}
        confirmLabel="Gắn vào quiz"
        variant="primary"
        confirmDisabled={!attachQuizId}
        onConfirm={handleAttach}
      >
        {attachableQuizzes.length === 0 ? (
          <p className="text-sm text-content-muted">Không còn quiz nào để gắn câu hỏi này.</p>
        ) : (
          <Select value={attachQuizId} onValueChange={setAttachQuizId} onOpenChange={quizSearch.onOpenChange}>
            <SelectTrigger className="w-full rounded-sm">
              <SelectValue placeholder="Chọn quiz..." />
            </SelectTrigger>
            <SelectContent className="max-h-80">
              <SelectSearch value={quizSearch.search} onChange={quizSearch.setSearch} placeholder="Tìm quiz..." />
              {!attachableQuizzes.some((quiz) => quizSearch.matches(quiz.title)) && <SelectEmpty />}
              {attachableQuizzes.filter((quiz) => quiz.quizId === attachQuizId || quizSearch.matches(quiz.title)).map((quiz) => (
                <SelectItem key={quiz.quizId} value={quiz.quizId}>
                  {quiz.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </ConfirmDialog>
    </StaffShell>
  );
}
