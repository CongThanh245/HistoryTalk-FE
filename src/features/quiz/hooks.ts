import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/shared/query-key";
import { GetQuizSetsParams, quizService, SubmitQuizPayload } from "@/services/quiz.service";

// GET /quizzes — danh sách bộ câu hỏi
export function useQuizSets(params?: GetQuizSetsParams) {
  return useQuery({
    queryKey: queryKeys.quizzes.list(params),
    queryFn: () => quizService.getAll(params),
    placeholderData: (prev) => prev,
  });
}

// GET /quizzes/:id
export function useQuizDetail(quizId: string) {
  return useQuery({
    queryKey: queryKeys.quizzes.detail(quizId),
    queryFn: () => quizService.getById(quizId),
    enabled: !!quizId,
  });
}

// GET /quizzes/results/me
export function useMyQuizResults() {
  return useQuery({
    queryKey: queryKeys.quizzes.myResults,
    queryFn: () => quizService.getMyResults(),
  });
}

// POST /quizzes/:id/start
export function useStartQuiz() {
  return useMutation({
    mutationFn: (quizId: string) => quizService.startQuiz(quizId),
  });
}

// POST /quizzes/submit
export function useSubmitQuiz() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SubmitQuizPayload) => quizService.submitQuiz(payload),
    onSuccess: () => {
      // invalidate kết quả sau khi nộp bài
      queryClient.invalidateQueries({ queryKey: queryKeys.quizzes.myResults });
    },
  });
}
