import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/query-key";
import {
  staffQuizService,
  type GetStaffQuizzesParams,
  type CreateQuizPayload,
  type CreateQuestionPayload,
  type UpdateQuizPayload,
  type UpdateQuestionPayload,
} from "@/services/staff.quiz.service";

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.staffQuizzes.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.quizzes.all });
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
