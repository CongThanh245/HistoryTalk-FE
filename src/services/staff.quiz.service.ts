import { axiosClient } from "@/configs/axios.client";

// ── Types ──────────────────────────────────────────────────

export type StaffQuizEra =
  | "ANCIENT"
  | "MEDIEVAL"
  | "MODERN"
  | "CONTEMPORARY";

// ── Question types ─────────────────────────────────────────

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
  orderIndex: number;
  explanation?: string;
}

// ── Quiz types ─────────────────────────────────────────────

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
  questions: StaffQuizQuestion[];
}

// ── Request / Response types ───────────────────────────────

export interface GetStaffQuizzesParams {
  search?: string;
  grade?: number;
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
  description: string;
  contextId: string;
  grade: number;
  chapterNumber: number;
  chapterTitle: string;
  era: StaffQuizEra;
  durationSeconds: number;
  questions: CreateQuestionPayload[];
}

// Partial update — tất cả field đều optional
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
  orderIndex?: number;
  explanation?: string;
}


// ── Map functions ──────────────────────────────────────────

export function mapStaffQuestion(raw: any): StaffQuizQuestion {
  return {
    questionId: raw.questionId,
    content: raw.content,
    options: raw.options ?? [],
    correctAnswer: raw.correctAnswer,
    orderIndex: raw.orderIndex,
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
    questions: (raw.questions ?? []).map(mapStaffQuestion),
  };
}

// ── Service ────────────────────────────────────────────────

export const staffQuizService = {
  // GET /staff/quizzes — danh sách bộ quiz (staff)
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

  // POST /staff/quizzes — tạo bộ quiz mới
  create: async (payload: CreateQuizPayload): Promise<StaffQuizSet> => {
    const res = await axiosClient.post("/staff/quizzes", payload);
    return mapStaffQuizSet(res.data.data);
  },

  // POST /staff/quizzes/{quizId}/questions — thêm câu hỏi vào quiz
  addQuestion: async (
    quizId: string,
    payload: CreateQuestionPayload,
  ): Promise<StaffQuizQuestion> => {
    const res = await axiosClient.post(
      `/staff/quizzes/${quizId}/questions`,
      payload,
    );
    return mapStaffQuestion(res.data.data);
  },

  // GET /staff/quizzes/{quizId} — chi tiết quiz kèm toàn bộ câu hỏi
  getById: async (quizId: string): Promise<StaffQuizSet> => {
    const res = await axiosClient.get(`/staff/quizzes/${quizId}`);
    return mapStaffQuizSet(res.data.data);
  },

  // PUT /staff/quizzes/{quizId} — cập nhật thông tin quiz
  updateQuiz: async (
    quizId: string,
    payload: UpdateQuizPayload,
  ): Promise<StaffQuizSet> => {
    const res = await axiosClient.put(`/staff/quizzes/${quizId}`, payload);
    return mapStaffQuizSet(res.data.data);
  },

  // PUT /staff/quizzes/{quizId}/questions/{questionId} — sửa câu hỏi
  updateQuestion: async (
    quizId: string,
    questionId: string,
    payload: UpdateQuestionPayload,
  ): Promise<void> => {
    await axiosClient.put(
      `/staff/quizzes/${quizId}/questions/${questionId}`,
      payload,
    );
  },

  // DELETE /staff/quizzes/{quizId} — xóa bộ quiz
  deleteQuiz: async (quizId: string): Promise<void> => {
    await axiosClient.delete(`/staff/quizzes/${quizId}`);
  },

  // DELETE /staff/quizzes/{quizId}/questions/{questionId} — xóa câu hỏi
  deleteQuestion: async (
    quizId: string,
    questionId: string,
  ): Promise<void> => {
    await axiosClient.delete(
      `/staff/quizzes/${quizId}/questions/${questionId}`,
    );
  },
};

