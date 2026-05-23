import { axiosClient } from "@/configs/axios.client";

export type StaffQuizEra =
  | "ANCIENT"
  | "MEDIEVAL"
  | "MODERN"
  | "CONTEMPORARY";

export interface StaffQuizQuestion {
  questionId: string;
  content: string;
  options: string[];
  correctAnswer: number;
  orderIndex: number;
  explanation?: string;
}

export interface CreateQuestionPayload {
  content: string;
  options: string[];
  correctAnswer: number;
  orderIndex?: number;
  explanation?: string;
}

export interface StaffQuizSet {
  quizId: string;
  title: string;
  description: string;
  grade: number;
  chapterNumber: number;
  chapterTitle: string;
  era: StaffQuizEra;
  durationSeconds: number;
  playCount: number;
  rating: number;
  contextId: string;
  contextTitle: string;
  createdBy: string;
  createdDate: string;
  updatedDate: string;
  isActive: boolean;
  deletedAt?: string | null;
  questions: StaffQuizQuestion[];
}

export interface GetStaffQuizzesParams {
  search?: string;
  era?: StaffQuizEra;
  page?: number;
  size?: number;
}

export interface GetStaffQuizzesResponse {
  content: StaffQuizSet[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface CreateQuizPayload {
  title: string;
  description?: string;
  contextId: string;
  grade?: number;
  chapterNumber?: number;
  chapterTitle?: string;
  era: StaffQuizEra;
  durationSeconds?: number;
  questions: CreateQuestionPayload[];
}

export interface UpdateQuizPayload {
  title?: string;
  description?: string;
  contextId?: string;
  grade?: number;
  chapterNumber?: number;
  chapterTitle?: string;
  era?: StaffQuizEra;
  durationSeconds?: number;
}

export interface UpdateQuestionPayload {
  content?: string;
  options?: string[];
  correctAnswer?: number;
  explanation?: string;
}

export function mapStaffQuestion(raw: any): StaffQuizQuestion {
  return {
    questionId: raw.questionId,
    content: raw.content,
    options: raw.options ?? [],
    correctAnswer: raw.correctAnswer,
    orderIndex: raw.orderIndex ?? 0,
    explanation: raw.explanation,
  };
}

export function mapStaffQuizSet(raw: any): StaffQuizSet {
  return {
    quizId: raw.quizId,
    title: raw.title,
    description: raw.description ?? "",
    grade: raw.grade ?? 0,
    chapterNumber: raw.chapterNumber ?? 1,
    chapterTitle: raw.chapterTitle ?? "",
    era: raw.era as StaffQuizEra,
    durationSeconds: raw.durationSeconds ?? 0,
    playCount: raw.playCount ?? 0,
    rating: raw.rating ?? 0,
    contextId: raw.contextId ?? "",
    contextTitle: raw.contextTitle ?? "",
    createdBy: raw.createdBy ?? "",
    createdDate: raw.createdDate ?? "",
    updatedDate: raw.updatedDate ?? "",
    isActive: raw.isActive ?? true,
    deletedAt: raw.deletedAt ?? null,
    questions: (raw.questions ?? []).map(mapStaffQuestion),
  };
}

export const staffQuizService = {
  getAll: async (
    params?: GetStaffQuizzesParams,
  ): Promise<GetStaffQuizzesResponse> => {
    const res = await axiosClient.get("/staff/quizzes", { params });
    const raw = res.data.data;
    return {
      ...raw,
      content: (raw.content ?? []).map(mapStaffQuizSet),
    };
  },

  create: async (payload: CreateQuizPayload): Promise<StaffQuizSet> => {
    const res = await axiosClient.post("/staff/quizzes", toContractQuizPayload(payload));
    return mapStaffQuizSet(res.data.data);
  },

  addQuestion: async (
    quizId: string,
    payload: CreateQuestionPayload,
  ): Promise<StaffQuizQuestion> => {
    const res = await axiosClient.post(
      `/staff/quizzes/${quizId}/questions`,
      toContractQuestionPayload(payload),
    );
    return mapStaffQuestion(res.data.data);
  },

  getById: async (quizId: string): Promise<StaffQuizSet> => {
    const res = await axiosClient.get(`/staff/quizzes/${quizId}`);
    return mapStaffQuizSet(res.data.data);
  },

  updateQuiz: async (
    quizId: string,
    payload: UpdateQuizPayload,
  ): Promise<StaffQuizSet> => {
    const res = await axiosClient.put(`/staff/quizzes/${quizId}`, toContractQuizPayload(payload));
    return mapStaffQuizSet(res.data.data);
  },

  updateQuestion: async (
    quizId: string,
    questionId: string,
    payload: UpdateQuestionPayload,
  ): Promise<void> => {
    await axiosClient.put(
      `/staff/quizzes/${quizId}/questions/${questionId}`,
      toContractQuestionPayload(payload as CreateQuestionPayload),
    );
  },

  permanentDelete: async (quizId: string): Promise<void> => {
    await axiosClient.delete(`/staff/quizzes/${quizId}`);
  },

  softDelete: async (quizId: string): Promise<void> => {
    await axiosClient.patch(`/staff/quizzes/${quizId}/soft-delete`);
  },

  restore: async (quizId: string): Promise<void> => {
    await axiosClient.patch(`/staff/quizzes/${quizId}/restore`);
  },

  deleteQuestion: async (
    quizId: string,
    questionId: string,
  ): Promise<void> => {
    await axiosClient.delete(
      `/staff/quizzes/${quizId}/questions/${questionId}`,
    );
  },
};

function toContractQuestionPayload(question: CreateQuestionPayload) {
  return {
    content: question.content,
    options: question.options,
    correctAnswer: question.correctAnswer,
    ...(question.explanation !== undefined && { explanation: question.explanation }),
  };
}

function toContractQuizPayload(payload: CreateQuizPayload | UpdateQuizPayload) {
  return {
    ...(payload.title !== undefined && { title: payload.title }),
    ...(payload.contextId !== undefined && { contextId: payload.contextId }),
    ...(payload.era !== undefined && { era: payload.era }),
    ...("questions" in payload && {
      questions: payload.questions.map(toContractQuestionPayload),
    }),
  };
}
