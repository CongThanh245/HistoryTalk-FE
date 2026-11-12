import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/query-key";
import {
  staffQuizService,
  type GetStaffQuizzesParams,
  type CreateQuizPayload,
  type CreateQuestionPayload,
  type UpdateQuizPayload,
  type UpdateQuestionPayload,
  type ImportQuizFromCsvPayload,
  type StaffQuizSet,
  type GetQuestionBankParams,
} from "@/services/staff.quiz.service";
import { toast } from "sonner";

// GET /staff/quizzes — danh sách quiz của staff
export function useStaffQuizzes(params?: GetStaffQuizzesParams) {
  return useQuery({
    queryKey: queryKeys.staffQuizzes.list(params),
    queryFn: () => staffQuizService.getAll(params),
    placeholderData: (prev) => prev,
  });
}

// GET /staff/quizzes/{quizId} — chi tiết quiz
export function useStaffQuizDetail(quizId: string) {
  return useQuery({
    queryKey: queryKeys.staffQuizzes.detail(quizId),
    queryFn: () => staffQuizService.getById(quizId),
    enabled: !!quizId,
  });
}

// POST /staff/quizzes — tạo quiz mới
export function useCreateStaffQuiz() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateQuizPayload) => staffQuizService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.staffQuizzes.all });
    },
  });
}

// PUT /staff/quizzes/{quizId} — cập nhật thông tin quiz
export function useUpdateStaffQuiz() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ quizId, payload }: { quizId: string; payload: UpdateQuizPayload }) =>
      staffQuizService.updateQuiz(quizId, payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(
        queryKeys.staffQuizzes.detail(updated.quizId),
        updated,
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.staffQuizzes.all });
    },
  });
}

// POST /staff/quizzes/{quizId}/questions — thêm câu hỏi
export function useAddQuizQuestion(quizId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateQuestionPayload) =>
      staffQuizService.addQuestion(quizId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.staffQuizzes.detail(quizId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.staffQuizzes.all });
    },
  });
}

// PUT /staff/quizzes/{quizId}/questions/{questionId} — sửa câu hỏi
export function useUpdateQuizQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      quizId,
      questionId,
      payload,
    }: {
      quizId: string;
      questionId: string;
      payload: UpdateQuestionPayload;
    }) => staffQuizService.updateQuestion(quizId, questionId, payload),
    onSuccess: (_result, { quizId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.staffQuizzes.detail(quizId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.staffQuizzes.all });
    },
  });
}

// PATCH /staff/quizzes/{quizId}/soft-delete — xóa tạm thời
export function useSoftDeleteStaffQuiz() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (quizId: string) => staffQuizService.softDelete(quizId),
    onSuccess: (_, quizId) => {
      queryClient.setQueriesData(
        { queryKey: queryKeys.staffQuizzes.all },
        (old: unknown) => {
          if (
            typeof old !== "object" ||
            old === null ||
            !Array.isArray((old as { content?: unknown }).content)
          ) {
            return old;
          }

          const response = old as { content: { quizId: string }[]; totalElements?: number };
          return {
            ...response,
            content: response.content.filter((quiz) => quiz.quizId !== quizId),
            totalElements:
              typeof response.totalElements === "number"
                ? Math.max(0, response.totalElements - 1)
                : response.totalElements,
          };
        },
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.staffQuizzes.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.quizzes.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.trash.quizzes });
    },
  });
}

// DELETE /staff/quizzes/{quizId} — xóa vĩnh viễn
export function usePermanentDeleteStaffQuiz() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (quizId: string) => staffQuizService.permanentDelete(quizId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.staffQuizzes.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.quizzes.all });
    },
  });
}

// DELETE /staff/quizzes/{quizId}/questions/{questionId} — xóa câu hỏi
export function useDeleteQuizQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ quizId, questionId }: { quizId: string; questionId: string }) =>
      staffQuizService.deleteQuestion(quizId, questionId),
    onSuccess: (_result, { quizId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.staffQuizzes.detail(quizId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.staffQuizzes.all });
    },
  });
}

// POST /staff/quizzes/import — tạo 1 bộ đề nháp từ CSV (tiêu đề + bối cảnh lấy từ form).
// Errors are left to the caller: the 400 message is multi-line and needs pre-line rendering.
export function useImportQuizzesFromCsv() {
  const queryClient = useQueryClient();
  return useMutation<StaffQuizSet, Error, ImportQuizFromCsvPayload>({
    mutationFn: (payload) => staffQuizService.importFromCsv(payload),
    onSuccess: (quiz) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.staffQuizzes.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.quizzes.all });
      toast.success(`Đã tạo bộ đề "${quiz.title}" với ${quiz.questions.length} câu hỏi từ CSV.`);
    },
  });
}

// ── Question Bank ───────────────────────────────────────────

// GET /staff/question-bank — ngân hàng câu hỏi độc lập
export function useQuestionBank(params?: GetQuestionBankParams) {
  return useQuery({
    queryKey: queryKeys.staffQuizzes.questionBank(params),
    queryFn: () => staffQuizService.getQuestionBank(params),
    placeholderData: (prev) => prev,
  });
}

function useInvalidateQuestionBank() {
  const queryClient = useQueryClient();
  // Gắn / gỡ / sửa câu hỏi trong bank làm thay đổi cả danh sách quiz.
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.staffQuizzes.all });
}

// POST /staff/question-bank
export function useCreateBankQuestion() {
  const invalidate = useInvalidateQuestionBank();
  return useMutation({
    mutationFn: (payload: CreateQuestionPayload) => staffQuizService.createBankQuestion(payload),
    onSuccess: invalidate,
  });
}

// PUT /staff/question-bank/{questionId}
export function useUpdateBankQuestion() {
  const invalidate = useInvalidateQuestionBank();
  return useMutation({
    mutationFn: ({ questionId, payload }: { questionId: string; payload: UpdateQuestionPayload }) =>
      staffQuizService.updateBankQuestion(questionId, payload),
    onSuccess: invalidate,
  });
}

// PATCH /staff/question-bank/{questionId}/soft-delete
export function useSoftDeleteBankQuestion() {
  const invalidate = useInvalidateQuestionBank();
  return useMutation({
    mutationFn: (questionId: string) => staffQuizService.softDeleteBankQuestion(questionId),
    onSuccess: invalidate,
  });
}

// POST /staff/question-bank/{questionId}/attach/{quizId}
export function useAttachBankQuestion() {
  const invalidate = useInvalidateQuestionBank();
  return useMutation({
    mutationFn: ({ questionId, quizId }: { questionId: string; quizId: string }) =>
      staffQuizService.attachBankQuestion(questionId, quizId),
    onSuccess: invalidate,
  });
}

// DELETE /staff/question-bank/{questionId}/detach/{quizId}
export function useDetachBankQuestion() {
  const invalidate = useInvalidateQuestionBank();
  return useMutation({
    mutationFn: ({ questionId, quizId }: { questionId: string; quizId: string }) =>
      staffQuizService.detachBankQuestion(questionId, quizId),
    onSuccess: invalidate,
  });
}
