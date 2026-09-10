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
export function useMyQuizResults(
  params?: GetQuizResultsParams,
  enabled = true,
) {
  return useQuery({
    queryKey: [...queryKeys.quizzes.myResults, params ?? {}],
    queryFn: () => quizService.getMyResults(params),
    enabled,
    staleTime: 0,
    refetchOnMount: true,
  });
}

// POST /quizzes/:id/start
export function useStartQuiz() {
  return useMutation({
    mutationFn: ({
      quizId,
      limitedTime,
    }: {
      quizId: string;
      limitedTime?: number;
    }) => quizService.startQuiz(quizId, limitedTime),
  });
}

// GET /quizzes/results/me/:sessionId
export function useQuizSessionDetail(sessionId: string | null) {
  return useQuery({
    queryKey: [...queryKeys.quizzes.myResults, "detail", sessionId ?? ""],
    queryFn: () => quizService.getMyResultDetail(sessionId!),
    enabled: !!sessionId,
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

// PATCH /quizzes/sessions/:sessionId/soft-delete
export function useSoftDeleteQuizSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => quizService.softDeleteSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.quizzes.myResults });
    },
  });
}

// GET /quizzes/:quizId/rating/me
export function useMyQuizRating(quizId: string | null) {
  return useQuery({
    queryKey: queryKeys.quizzes.myRating(quizId ?? ""),
    queryFn: () => quizService.getMyRating(quizId!),
    enabled: !!quizId,
  });
}

// POST /quizzes/:quizId/rating
export function useRateQuiz(quizId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (value: number) => quizService.rateQuiz(quizId, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.quizzes.myRating(quizId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.quizzes.detail(quizId) });
    },
  });
}

// POST /quizzes/questions/:questionId/report
export function useReportQuestion() {
  return useMutation({
    mutationFn: ({ questionId, reason }: { questionId: string; reason?: string }) =>
      quizService.reportQuestion(questionId, reason),
  });
}
