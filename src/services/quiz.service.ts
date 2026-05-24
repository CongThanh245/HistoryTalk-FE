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
  explanation?: string;
}

// ── QuizSet ────────────────────────────────────────────────

export interface QuizSet {
  quizId: string;
  title: string;
  level: "EASY" | "MEDIUM" | "HARD";
  era: QuizEra;
  playCount: number;
  contextTitle?: string;
}

// ── QuizResult ─────────────────────────────────────────────

export interface QuizResult {
  sessionId: string;
  quizId: string;
  quizTitle: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  completedAt: string;
  durationSeconds?: number; // fallback compatibility
}

// ── Params & Responses ─────────────────────────────────────

export interface GetQuizSetsParams {
  search?: string;
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
}

// ── Map functions ──────────────────────────────────────────

type RawQuizSet = Partial<QuizSet> & Pick<QuizSet, "quizId" | "title">;
type RawQuizResult = Partial<QuizResult> &
  Pick<
    QuizResult,
    "sessionId" | "quizId" | "quizTitle" | "score" | "totalQuestions" | "completedAt"
  >;
type RawQuizQuestion = Partial<QuizQuestion> &
  Pick<QuizQuestion, "questionId" | "content" | "options" | "correctAnswer">;

export function mapQuizSet(raw: any): QuizSet {
  return {
    quizId: raw.quizId,
    title: raw.title,
    level: (raw.level as QuizSet["level"]) ?? "MEDIUM",
    era: (raw.era as QuizEra) ?? "ALL",
    playCount: raw.playCount ?? 0,
    contextTitle: raw.contextTitle,
  };
}

export function mapQuizResult(raw: any): QuizResult {
  return {
    sessionId: raw.sessionId,
    quizId: raw.quizId,
    quizTitle: raw.quizTitle,
    score: raw.score,
    totalQuestions: raw.totalQuestions,
    percentage: raw.percentage ?? 0,
    completedAt: raw.completedAt ?? "",
    durationSeconds: 0, // default since BE removed this field
  };
}

export function mapQuizQuestion(raw: any): QuizQuestion {
  return {
    questionId: raw.questionId,
    content: raw.content,
    options: raw.options ?? [],
    correctAnswer: raw.correctAnswer,
    explanation: raw.explanation,
  };
}

// ── Service Methods ────────────────────────────────────────

export const quizService = {
  // GET /quizzes?search=...
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
  startQuiz: async (quizId: string, limitedTime?: number): Promise<StartQuizResponse> => {
    const res = await axiosClient.post(`/quizzes/${quizId}/start`, null, {
      params: limitedTime ? { limitedTime } : undefined,
    });
    const raw = res.data.data;
    return {
      sessionId: raw.sessionId,
      quizId: raw.quizId,
      title: raw.title,
      questions: (raw.questions ?? []).map(mapQuizQuestion),
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

  // PATCH /quizzes/sessions/:sessionId/soft-delete
  softDeleteSession: async (sessionId: string): Promise<void> => {
    await axiosClient.patch(`/quizzes/sessions/${sessionId}/soft-delete`);
  },
};
