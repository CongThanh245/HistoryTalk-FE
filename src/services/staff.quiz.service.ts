import { axiosClient } from "@/configs/axios.client";
import {
  parseQuestionData,
  parseQuestionType,
  type QuestionData,
  type QuestionType,
} from "@/features/quiz/question-data";

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
  questionType: QuestionType;
  /** Staff luon nhan questionData day du (co dap an). */
  questionData: QuestionData;
  explanation?: string;
}

export interface CreateQuestionPayload {
  content: string;
  questionType: QuestionType;
  questionData: QuestionData;
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
  createdBy: string | { uid?: string; userName?: string };
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
  level?: "EASY" | "MEDIUM" | "HARD";
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

export type UpdateQuestionPayload = Partial<CreateQuestionPayload>;

// ── Question Bank ─────────────────────────────────────────

export interface QuestionBankItem extends StaffQuizQuestion {
  /** Cau hoi dang duoc gan vao it nhat 1 quiz. */
  assignedToQuiz: boolean;
}

export interface GetQuestionBankParams {
  questionType?: QuestionType;
  search?: string;
  page?: number;
  size?: number;
}

export interface GetQuestionBankResponse {
  content: QuestionBankItem[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// ── Import CSV Types ──────────────────────────────────────

export interface ImportQuizFromCsvResponse {
  totalQuizzesAttempted: number;
  successCount: number;
  skippedCount: number;
  errors: string[];
  imported: StaffQuizSet[];
}

type RawStaffQuizQuestion = Record<string, unknown>;

type RawStaffQuizSet = Partial<Omit<StaffQuizSet, "questions">> & {
  questions?: RawStaffQuizQuestion[];
};

// ── Map functions ──────────────────────────────────────────

export function mapStaffQuestion(raw: RawStaffQuizQuestion): StaffQuizQuestion {
  return {
    questionId: typeof raw.questionId === "string" ? raw.questionId : "",
    content: typeof raw.content === "string" ? raw.content : "",
    questionType: parseQuestionType(raw.questionType),
    questionData: parseQuestionData(raw),
    explanation: typeof raw.explanation === "string" ? raw.explanation : undefined,
  };
}

export function mapQuestionBankItem(raw: RawStaffQuizQuestion): QuestionBankItem {
  return {
    ...mapStaffQuestion(raw),
    assignedToQuiz: Boolean(raw.assignedToQuiz),
  };
}

export function mapStaffQuizSet(raw: RawStaffQuizSet): StaffQuizSet {
  return {
    quizId: raw.quizId ?? "",
    title: raw.title ?? "",
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
      toContractQuestionPayload(payload),
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


  // ── Question Bank ───────────────────────────────────────

  // GET /staff/question-bank?questionType=&search=&page=&size=
  getQuestionBank: async (
    params?: GetQuestionBankParams,
  ): Promise<GetQuestionBankResponse> => {
    const res = await axiosClient.get("/staff/question-bank", { params });
    const raw = res.data.data;
    return {
      ...raw,
      content: (raw.content ?? []).map(mapQuestionBankItem),
    };
  },

  // POST /staff/question-bank
  createBankQuestion: async (payload: CreateQuestionPayload): Promise<QuestionBankItem> => {
    const res = await axiosClient.post(
      "/staff/question-bank",
      toContractQuestionPayload(payload),
    );
    return mapQuestionBankItem(res.data.data);
  },

  // PUT /staff/question-bank/:questionId
  updateBankQuestion: async (
    questionId: string,
    payload: UpdateQuestionPayload,
  ): Promise<QuestionBankItem> => {
    const res = await axiosClient.put(
      `/staff/question-bank/${questionId}`,
      toContractQuestionPayload(payload),
    );
    return mapQuestionBankItem(res.data.data);
  },

  // PATCH /staff/question-bank/:questionId/soft-delete
  softDeleteBankQuestion: async (questionId: string): Promise<void> => {
    await axiosClient.patch(`/staff/question-bank/${questionId}/soft-delete`);
  },

  // POST /staff/question-bank/:questionId/attach/:quizId
  attachBankQuestion: async (questionId: string, quizId: string): Promise<void> => {
    await axiosClient.post(`/staff/question-bank/${questionId}/attach/${quizId}`);
  },

  // DELETE /staff/question-bank/:questionId/detach/:quizId
  detachBankQuestion: async (questionId: string, quizId: string): Promise<void> => {
    await axiosClient.delete(`/staff/question-bank/${questionId}/detach/${quizId}`);
  },
};

// ── Internal helpers ───────────────────────────────────────

export function toContractQuestionPayload(question: UpdateQuestionPayload) {
  return {
    ...(question.content !== undefined && { content: question.content }),
    ...(question.questionType !== undefined && { questionType: question.questionType }),
    ...(question.questionData !== undefined && { questionData: question.questionData }),
    ...(question.explanation !== undefined && { explanation: question.explanation }),
  };
}

export function toContractQuizPayload(payload: CreateQuizPayload | UpdateQuizPayload) {
  return {
    ...(payload.title !== undefined && { title: payload.title }),
    ...(payload.contextId !== undefined && { contextId: payload.contextId }),
    ...(payload.level !== undefined && { level: payload.level }),
    ...(payload.isPublished !== undefined && { isPublished: payload.isPublished }),
    ...("questions" in payload && {
      questions: payload.questions.map(toContractQuestionPayload),
    }),
  };
}
