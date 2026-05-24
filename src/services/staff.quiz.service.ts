import { axiosClient } from "@/configs/axios.client";

export type StaffQuizEra =
  | "ANCIENT"
  | "MEDIEVAL"
  | "MODERN"
  | "CONTEMPORARY";

export type StaffQuizLevel = "EASY" | "MEDIUM" | "HARD";

// ── Question ───────────────────────────────────────────────

export interface StaffQuizQuestion {
  questionId: string;
  content: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export interface CreateQuestionPayload {
  content: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

// ── QuizSet ────────────────────────────────────────────────

export interface StaffQuizSet {
  quizId: string;
  title: string;
  era: StaffQuizEra;
  level: StaffQuizLevel;
  playCount: number;
  contextId: string;
  contextTitle: string;
  createdBy: string;
  createdDate: string;
  updatedDate: string;
  isActive: boolean;
  deletedAt?: string | null;
  questions: StaffQuizQuestion[];
}

// ── Params & Responses ─────────────────────────────────────

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

// ── Payloads ───────────────────────────────────────────────

export interface CreateQuizPayload {
  title: string;
  contextId: string;
  level: string;
  questions: CreateQuestionPayload[];
}

export interface UpdateQuizPayload {
  title?: string;
  contextId?: string;
  level?: string;
}

export interface UpdateQuestionPayload {
  content?: string;
  options?: string[];
  correctAnswer?: number;
  explanation?: string;
}

// ── Map functions ──────────────────────────────────────────

export function mapStaffQuestion(raw: any): StaffQuizQuestion {
  return {
    questionId: raw.questionId,
    content: raw.content,
    options: raw.options ?? [],
    correctAnswer: raw.correctAnswer,
    explanation: raw.explanation,
  };
}

export function mapStaffQuizSet(raw: any): StaffQuizSet {
  return {
    quizId: raw.quizId,
    title: raw.title,
    era: raw.era as StaffQuizEra,
    level: (raw.level as StaffQuizLevel) ?? "MEDIUM",
    playCount: raw.playCount ?? 0,
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

// ── Service Methods ────────────────────────────────────────

export const staffQuizService = {
  // GET /staff/quizzes
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

  // GET /staff/quizzes/:quizId
  getById: async (quizId: string): Promise<StaffQuizSet> => {
    const res = await axiosClient.get(`/staff/quizzes/${quizId}`);
    return mapStaffQuizSet(res.data.data);
  },

  // POST /staff/quizzes
  create: async (payload: CreateQuizPayload): Promise<StaffQuizSet> => {
    const res = await axiosClient.post("/staff/quizzes", toContractQuizPayload(payload));
    return mapStaffQuizSet(res.data.data);
  },

  // PUT /staff/quizzes/:quizId
  updateQuiz: async (
    quizId: string,
    payload: UpdateQuizPayload,
  ): Promise<StaffQuizSet> => {
    const res = await axiosClient.put(
      `/staff/quizzes/${quizId}`,
      toContractQuizPayload(payload),
    );
    return mapStaffQuizSet(res.data.data);
  },

  // DELETE /staff/quizzes/:quizId
  permanentDelete: async (quizId: string): Promise<void> => {
    await axiosClient.delete(`/staff/quizzes/${quizId}`);
  },

  // PATCH /staff/quizzes/:quizId/soft-delete
  softDelete: async (quizId: string): Promise<void> => {
    await axiosClient.patch(`/staff/quizzes/${quizId}/soft-delete`);
  },

  // PATCH /staff/quizzes/:quizId/toggle-active
  toggleActive: async (quizId: string): Promise<void> => {
    await axiosClient.patch(`/staff/quizzes/${quizId}/toggle-active`);
  },

  // POST /staff/quizzes/:quizId/questions
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

  // PUT /staff/quizzes/:quizId/questions/:questionId
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

  // DELETE /staff/quizzes/:quizId/questions/:questionId
  deleteQuestion: async (
    quizId: string,
    questionId: string,
  ): Promise<void> => {
    await axiosClient.delete(
      `/staff/quizzes/${quizId}/questions/${questionId}`,
    );
  },
};

// ── Internal helpers ───────────────────────────────────────

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
    ...((payload as any).level !== undefined && { level: (payload as any).level }),
    ...("questions" in payload && {
      questions: payload.questions.map(toContractQuestionPayload),
    }),
  };
}
