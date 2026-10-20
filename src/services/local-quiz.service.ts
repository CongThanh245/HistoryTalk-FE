// src/services/local-quiz.service.ts
// Teacher-authored quizzes of a local context (Sprint 7). The backend reuses the Content Admin quiz DTOs
// (CreateQuizRequest / QuizStaffResponse / QuestionRequest), so the staff mappers and payload helpers apply.
// Note: BE docs/FE-contract/LocalContent_APIContract.md §45–53 shows another shape (passingScore, options,
// correctOption) and other question paths; this follows the controller.
import { axiosClient } from "@/configs/axios.client";
import type { ApiPage } from "@/services/school.service";
import {
  mapStaffQuestion,
  mapStaffQuizSet,
  toContractQuestionPayload,
  toContractQuizPayload,
  type CreateQuestionPayload,
  type StaffQuizLevel,
  type StaffQuizQuestion,
  type StaffQuizSet,
  type UpdateQuestionPayload,
  type UpdateQuizPayload,
} from "@/services/staff.quiz.service";

export type LocalQuiz = StaffQuizSet;
export type LocalQuizQuestion = StaffQuizQuestion;

export interface CreateLocalQuizPayload {
  title: string;
  level: StaffQuizLevel;
  isPublished?: boolean;
  /** BE bat buoc it nhat 1 cau hoi khi tao (CreateQuizRequest: "Yêu cầu ít nhất một câu hỏi"). */
  questions: CreateQuestionPayload[];
}

interface SpringPage<T> {
  content?: T[];
  totalElements?: number;
  totalPages?: number;
  currentPage?: number;
  pageSize?: number;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

const base = "/teacher/local-contents";

export const localQuizService = {
  listForContext: async (contextId: string, params: { page?: number; size?: number } = {}): Promise<ApiPage<LocalQuiz>> => {
    const res = await axiosClient.get(`${base}/contexts/${contextId}/quizzes`, { params: { page: 1, size: 50, ...params } });
    const raw = (res.data.data ?? {}) as SpringPage<Parameters<typeof mapStaffQuizSet>[0]>;
    const items = (raw.content ?? []).map(mapStaffQuizSet);
    return {
      items,
      page: raw.currentPage ?? 1,
      size: raw.pageSize ?? items.length,
      totalElements: raw.totalElements ?? items.length,
      totalPages: raw.totalPages ?? 1,
      hasNext: raw.hasNext ?? false,
      hasPrevious: raw.hasPrevious ?? false,
    };
  },
  create: async (contextId: string, payload: CreateLocalQuizPayload): Promise<LocalQuiz> => {
    const res = await axiosClient.post(
      `${base}/contexts/${contextId}/quizzes`,
      toContractQuizPayload({ ...payload, contextId }),
    );
    return mapStaffQuizSet(res.data.data);
  },
  get: async (quizId: string): Promise<LocalQuiz> => {
    const res = await axiosClient.get(`${base}/quizzes/${quizId}`);
    return mapStaffQuizSet(res.data.data);
  },
  update: async (quizId: string, payload: UpdateQuizPayload): Promise<LocalQuiz> => {
    const res = await axiosClient.put(`${base}/quizzes/${quizId}`, toContractQuizPayload(payload));
    return mapStaffQuizSet(res.data.data);
  },
  remove: async (quizId: string): Promise<void> => {
    await axiosClient.delete(`${base}/quizzes/${quizId}`);
  },
  togglePublish: async (quizId: string): Promise<LocalQuiz> => {
    const res = await axiosClient.patch(`${base}/quizzes/${quizId}/publish`);
    return mapStaffQuizSet(res.data.data);
  },
  addQuestion: async (quizId: string, payload: CreateQuestionPayload): Promise<LocalQuizQuestion> => {
    const res = await axiosClient.post(`${base}/quizzes/${quizId}/questions`, toContractQuestionPayload(payload));
    return mapStaffQuestion(res.data.data);
  },
  updateQuestion: async (quizId: string, questionId: string, payload: UpdateQuestionPayload): Promise<void> => {
    await axiosClient.put(`${base}/quizzes/${quizId}/questions/${questionId}`, toContractQuestionPayload(payload));
  },
  deleteQuestion: async (quizId: string, questionId: string): Promise<void> => {
    await axiosClient.delete(`${base}/quizzes/${quizId}/questions/${questionId}`);
  },
};
