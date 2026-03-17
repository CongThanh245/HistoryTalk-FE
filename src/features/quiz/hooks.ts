"use client";

// features/quiz/hooks.ts

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  quizService,
  type GetQuizSetsParams,
  type GetQuizResultsParams,
  type SubmitQuizPayload,
} from "@/services/quiz.service";
import { queryKeys } from "@/shared/query-key";

// GET /quizzes
export function useQuizSets(params?: GetQuizSetsParams) {
  return useQuery({
    queryKey: queryKeys.quizzes.list(params),
    queryFn: () => quizService.getAll(params),
    placeholderData: (prev) => prev,
  });
}

// GET /quizzes/:id
export function useQuizDetail(quizId: string | null) {
  return useQuery({
    queryKey: queryKeys.quizzes.detail(quizId ?? ""),
    queryFn: () => quizService.getById(quizId!),
    enabled: !!quizId,
  });
}

// GET /quizzes/results/me
export function useMyQuizResults(params?: GetQuizResultsParams) {
  return useQuery({
    queryKey: queryKeys.quizzes.myResults,
    queryFn: () => quizService.getMyResults(params),
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
      queryClient.invalidateQueries({ queryKey: queryKeys.quizzes.myResults });
    },
  });
}
