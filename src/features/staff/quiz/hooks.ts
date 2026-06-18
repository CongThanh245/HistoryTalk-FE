import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/query-key";
import {
  staffQuizService,
  type GetStaffQuizzesParams,
  type CreateQuizPayload,
  type CreateQuestionPayload,
  type UpdateQuizPayload,
  type UpdateQuestionPayload,
  type ImportQuizFromCsvResponse,
} from "@/services/staff.quiz.service";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/utils/api-error";

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

// POST /staff/quizzes/import — import quiz từ CSV
export function useImportQuizzesFromCsv() {
  const queryClient = useQueryClient();
  return useMutation<ImportQuizFromCsvResponse, Error, File>({
    mutationFn: (file: File) => staffQuizService.importFromCsv(file),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.staffQuizzes.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.quizzes.all });

      if (result.successCount > 0) {
        toast.success(`Đã import thành công ${result.successCount} bộ quiz từ CSV`);
      }

      if (result.skippedCount > 0) {
        toast.warning(`Đã bỏ qua ${result.skippedCount} bộ quiz (trùng lặp hoặc lỗi)`);
      }

      if (result.errors.length > 0) {
        result.errors.slice(0, 3).forEach((error) => {
          toast.error(error);
        });
        if (result.errors.length > 3) {
          toast.error(`... và ${result.errors.length - 3} lỗi khác`);
        }
      }
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Import CSV thất bại"));
    },
  });
}
