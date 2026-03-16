import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/query-key";
import {
  staffQuizService,
  type GetStaffQuizzesParams,
  type CreateQuizPayload,
  type CreateQuestionPayload,
} from "@/services/staff.quiz.service";

// GET /staff/quizzes — danh sách quiz của staff
export function useStaffQuizzes(params?: GetStaffQuizzesParams) {
  return useQuery({
    queryKey: queryKeys.staffQuizzes.list(params),
    queryFn: () => staffQuizService.getAll(params),
    placeholderData: (prev) => prev, // giữ data cũ khi filter đang load
  });
}

// POST /staff/quizzes — tạo quiz mới
export function useCreateStaffQuiz() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateQuizPayload) => staffQuizService.create(payload),
    onSuccess: () => {
      // Invalidate danh sách sau khi tạo thành công
      queryClient.invalidateQueries({ queryKey: queryKeys.staffQuizzes.all });
    },
  });
}

// POST /staff/quizzes/{quizId}/questions — thêm câu hỏi vào quiz
export function useAddQuizQuestion(quizId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateQuestionPayload) =>
      staffQuizService.addQuestion(quizId, payload),
    onSuccess: () => {
      // Invalidate detail + list để refresh số câu hỏi
      queryClient.invalidateQueries({ queryKey: queryKeys.staffQuizzes.all });
    },
  });
}
