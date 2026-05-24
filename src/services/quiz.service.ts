import { axiosClient } from "@/configs/axios.client";

// ── Types ──────────────────────────────────────────────────

export type QuizEra =
  | "ALL"
  | "ANCIENT"
  | "MEDIEVAL"
  | "MODERN"
  | "CONTEMPORARY";

// ── QuizQuestion ───────────────────────────────────────────

export interface QuizQuestion {
  questionId: string;
  content: string;
  options: string[];
  correctAnswer: number;
  orderIndex?: number;
  explanation?: string;
}

// ── QuizSet ────────────────────────────────────────────────
// Field đã xóa: thumbnailUrl, tags, createdAt, totalQuestions, difficulty
// Field thêm mới: contextTitle

export interface QuizSet {
  quizId: string;
  title: string;
  era: QuizEra;
  level: "EASY" | "MEDIUM" | "HARD";
  playCount: number;
  contextTitle?: string;
}

// ── QuizResult ─────────────────────────────────────────────
// Field đã xóa: difficulty
// Field thêm mới: percentage

export interface QuizResult {
  sessionId: string;
  quizId: string;
  quizTitle: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  completedAt: string;
  durationSeconds: number;
}

// ── Params & Responses ─────────────────────────────────────

export interface GetQuizSetsParams {
  search?: string;
  // Lưu ý: backend hiện chỉ hỗ trợ search
  // grade, era → filter local phía frontend
}

export interface GetQuizSetsResponse {
  content: QuizSet[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface GetQuizResultsParams {
  page?: number; // default 0
  size?: number; // default 10
}

export interface GetQuizResultsResponse {
  content: QuizResult[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface StartQuizResponse {
  sessionId: string;
  quizId: string;
  title: string;
  questions: QuizQuestion[];
  // Field đã xóa: startedAt, expiresAt (không có từ backend)
}

export interface SubmitQuizPayload {
  sessionId: string;
  answers: { questionId: string; selectedAnswer: number }[];
}

export interface SubmitQuizResponse {
  sessionId: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  correctAnswers: number[];
  wrongAnswers: number[];
  // Field đã xóa: completedAt (không có từ response submit)
}

// ── Map functions ──────────────────────────────────────────

type RawQuizSet = Partial<QuizSet> & Pick<QuizSet, "quizId" | "title">;
type RawQuizResult = Partial<QuizResult> &
  Pick<
    QuizResult,
    "sessionId" | "quizId" | "quizTitle" | "score" | "totalQuestions" | "completedAt"
  >;
type RawQuizQuestion = Partial<QuizQuestion> &
  Pick<QuizQuestion, "questionId" | "content" | "correctAnswer">;

export function mapQuizSet(raw: RawQuizSet): QuizSet {
  return {
    quizId: raw.quizId,
    title: raw.title,
    era: (raw.era as QuizEra) ?? "ALL",
    level: raw.level ?? "MEDIUM",
    playCount: raw.playCount ?? 0,
    contextTitle: raw.contextTitle,
  };
}

export function mapQuizResult(raw: RawQuizResult): QuizResult {
  return {
    sessionId: raw.sessionId,
    quizId: raw.quizId,
    quizTitle: raw.quizTitle,
    score: raw.score,
    totalQuestions: raw.totalQuestions,
    percentage: raw.percentage ?? 0,
    completedAt: raw.completedAt,
    durationSeconds: raw.durationSeconds ?? 0,
  };
}

export function mapQuizQuestion(raw: RawQuizQuestion): QuizQuestion {
  return {
    questionId: raw.questionId,
    content: raw.content,
    options: raw.options ?? [],
    correctAnswer: raw.correctAnswer,
    orderIndex: raw.orderIndex ?? 0,
    explanation: raw.explanation,
  };
}

// ── Mock Data ──────────────────────────────────────────────

export const quizService = {
  // GET /quizzes?search=...
  // Lưu ý: backend trả về array trực tiếp (không pagination)
  // → frontend tự wrap vào GetQuizSetsResponse
  getAll: async (params?: GetQuizSetsParams): Promise<GetQuizSetsResponse> => {
    const res = await axiosClient.get("/quizzes", {
      params: { search: params?.search },
    });
    const raw = res.data.data as RawQuizSet[];
    const content = raw.map(mapQuizSet);
    return {
      content,
      totalElements: content.length,
      totalPages: 1,
      currentPage: 0,
      pageSize: content.length,
      hasNext: false,
      hasPrevious: false,
    };
  },

  // GET /quizzes/:quizId
  getById: async (quizId: string): Promise<QuizSet> => {
    const res = await axiosClient.get(`/quizzes/${quizId}`);
    return mapQuizSet(res.data.data);
  },

  // POST /quizzes/:quizId/start
  startQuiz: async (quizId: string): Promise<StartQuizResponse> => {
    const res = await axiosClient.post(`/quizzes/${quizId}/start`);
    const raw = res.data.data;
    return {
      sessionId: raw.sessionId,
      quizId: raw.quizId,
      title: raw.title,
      questions: (raw.questions ?? [])
        .map(mapQuizQuestion)
        .sort(
          (a: QuizQuestion, b: QuizQuestion) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0),
        ),
    };
  },

  // POST /quizzes/submit
  submitQuiz: async (
    payload: SubmitQuizPayload,
  ): Promise<SubmitQuizResponse> => {
    const res = await axiosClient.post("/quizzes/submit", payload);
    const raw = res.data.data;
    return {
      sessionId: raw.sessionId,
      score: raw.score,
      totalQuestions: raw.totalQuestions,
      percentage: raw.percentage,
      correctAnswers: raw.correctAnswers ?? [],
      wrongAnswers: raw.wrongAnswers ?? [],
    };
  },

  // GET /quizzes/results/me?page=0&size=10
  getMyResults: async (
    params?: GetQuizResultsParams,
  ): Promise<GetQuizResultsResponse> => {
    const res = await axiosClient.get("/quizzes/results/me", {
      params: { page: params?.page ?? 0, size: params?.size ?? 10 },
    });
    const raw = res.data.data;
    return {
      ...raw,
      content: raw.content.map(mapQuizResult),
    };
  },
};
