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
  isPublished: boolean;
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
  isPublished?: boolean;
}

export interface UpdateQuizPayload {
  title?: string;
  contextId?: string;
  level?: string;
  isPublished?: boolean;
}

export interface UpdateQuestionPayload {
  content?: string;
  options?: string[];
  correctAnswer?: number;
  explanation?: string;
}

// ── Import CSV Types ──────────────────────────────────────

export interface ImportQuizFromCsvResponse {
  totalQuizzesAttempted: number;
  successCount: number;
  skippedCount: number;
  errors: string[];
  imported: StaffQuizSet[];
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
    isPublished: raw.isPublished ?? false,
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

  // POST /staff/quizzes/import
  importFromCsv: async (file: File): Promise<ImportQuizFromCsvResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await axiosClient.post("/staff/quizzes/import", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    const data = res.data.data;
    return {
      totalQuizzesAttempted: data.totalQuizzesAttempted ?? 0,
      successCount: data.successCount ?? 0,
      skippedCount: data.skippedCount ?? 0,
      errors: data.errors ?? [],
      imported: (data.imported ?? []).map(mapStaffQuizSet),
    };
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
    ...((payload as any).isPublished !== undefined && { isPublished: (payload as any).isPublished }),
    ...("questions" in payload && {
      questions: payload.questions.map(toContractQuestionPayload),
    }),
  };
}
