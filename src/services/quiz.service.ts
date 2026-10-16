import { axiosClient } from "@/configs/axios.client";
import {
  parseAnswerData,
  parseQuestionData,
  parseQuestionType,
  type AnswerData,
  type QuestionData,
  type QuestionType,
} from "@/features/quiz/question-data";

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
  questionType: QuestionType;
  /** Khi bat dau lam bai BE luoc dap an; o man chi tiet ket qua co day du. */
  questionData: QuestionData;
  explanation?: string;
}

export interface QuizSessionQuestion extends QuizQuestion {
  submittedAnswer: AnswerData | null;
  correct: boolean;
}

// ── QuizSet ────────────────────────────────────────────────

export interface QuizSet {
  quizId: string;
  title: string;
  level: "EASY" | "MEDIUM" | "HARD";
  era: QuizEra;
  playCount: number;
  contextTitle?: string;
  contextId?: string;
  rating?: number;
  grade?: number;
  chapterNumber?: number;
  chapterTitle?: string;
  durationSeconds?: number;
  /** So lan chinh nguoi dung hien tai da hoan thanh quiz nay (chi co o GET /quizzes/:id). */
  userPlayCount?: number;
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

export interface PreviousAttempt {
  score: number;
  percentage: number;
  completedAt: string;
}

export interface QuizSessionDetail {
  sessionId: string;
  quizId: string;
  quizTitle: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  limitedTime?: number;
  startedAt: string;
  completedAt: string;
  previousAttempt?: PreviousAttempt | null;
  questions: QuizSessionQuestion[];
}

// ── Params & Responses ─────────────────────────────────────

export interface GetQuizSetsParams {
  search?: string;
  contextId?: string;
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
  /** Loc lich su theo 1 quiz cu the (BE: GET /quizzes/results/me?quizId=...). */
  quizId?: string;
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
  answers: { questionId: string; answerData: AnswerData }[];
}

export interface SubmitQuizResponse {
  sessionId?: string;
  resultId?: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  durationSeconds?: number;
  correctAnswers: number[];
  wrongAnswers: number[];
}

// ── Map functions ──────────────────────────────────────────

type RawRecord = Record<string, unknown>;

function asRecord(value: unknown): RawRecord {
  return typeof value === "object" && value !== null ? value as RawRecord : {};
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asOptionalString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function asNumber(value: unknown, fallback = 0) {
  return typeof value === "number" ? value : fallback;
}

function asOptionalNumber(value: unknown) {
  return typeof value === "number" ? value : undefined;
}

export function mapQuizSet(rawValue: unknown): QuizSet {
  const raw = asRecord(rawValue);
  return {
    quizId: asString(raw.quizId),
    title: asString(raw.title),
    level: (raw.level as QuizSet["level"]) ?? "MEDIUM",
    era: (raw.era as QuizEra) ?? "ALL",
    playCount: asNumber(raw.playCount),
    contextTitle: asOptionalString(raw.contextTitle),
    contextId: asOptionalString(raw.contextId),
    rating: asOptionalNumber(raw.rating),
    grade: asOptionalNumber(raw.grade),
    chapterNumber: asOptionalNumber(raw.chapterNumber),
    chapterTitle: asOptionalString(raw.chapterTitle),
    durationSeconds: asOptionalNumber(raw.durationSeconds),
    userPlayCount: asOptionalNumber(raw.userPlayCount),
  };
}

export function mapQuizResult(rawValue: unknown): QuizResult {
  const raw = asRecord(rawValue);
  return {
    sessionId: asString(raw.sessionId),
    quizId: asString(raw.quizId),
    quizTitle: asString(raw.quizTitle),
    score: asNumber(raw.score),
    totalQuestions: asNumber(raw.totalQuestions),
    percentage: asNumber(raw.percentage),
    completedAt: asString(raw.completedAt),
    durationSeconds: 0, // default since BE removed this field
  };
}

export function mapQuizQuestion(rawValue: unknown): QuizQuestion {
  const raw = asRecord(rawValue);
  return {
    questionId: asString(raw.questionId),
    content: asString(raw.content),
    questionType: parseQuestionType(raw.questionType),
    questionData: parseQuestionData(raw),
    explanation: asOptionalString(raw.explanation),
  };
}

export function mapQuizSessionDetail(rawValue: unknown): QuizSessionDetail {
  const raw = asRecord(rawValue);
  return {
    sessionId: asString(raw.sessionId),
    quizId: asString(raw.quizId),
    quizTitle: asString(raw.quizTitle),
    score: asNumber(raw.score),
    totalQuestions: asNumber(raw.totalQuestions),
    percentage: asNumber(raw.percentage),
    limitedTime: typeof raw.limitedTime === "number" ? raw.limitedTime : undefined,
    startedAt: asString(raw.startedAt),
    completedAt: asString(raw.completedAt),
    previousAttempt: (() => {
      const prev = raw.previousAttempt;
      if (!prev || typeof prev !== "object") return null;
      const prevRecord = asRecord(prev);
      return {
        score: asNumber(prevRecord.score),
        percentage: asNumber(prevRecord.percentage),
        completedAt: asString(prevRecord.completedAt),
      };
    })(),
    questions: Array.isArray(raw.questions)
      ? raw.questions.map((questionValue) => {
          const question = asRecord(questionValue);
          return {
            ...mapQuizQuestion(question),
            submittedAnswer:
              question.submittedAnswer && typeof question.submittedAnswer === "object"
                ? parseAnswerData(question.submittedAnswer)
                : null,
            // BE (Jackson) co the serialize `isCorrect` thanh `correct`.
            correct: Boolean(question.isCorrect ?? question.correct),
          };
        })
      : [],
  };
}

// ── Service Methods ────────────────────────────────────────

export const quizService = {
  // GET /quizzes?search=...&contextId=...
  getAll: async (params?: GetQuizSetsParams): Promise<GetQuizSetsResponse> => {
    const res = await axiosClient.get("/quizzes", {
      params: { search: params?.search, contextId: params?.contextId },
    });
    const raw = res.data.data as unknown[];
    let content = raw.map(mapQuizSet);
    // Defensive client-side filter in case the BE doesn't filter by contextId yet.
    if (params?.contextId) {
      content = content.filter((quiz) => quiz.contextId === params.contextId);
    }
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

  // POST /quizzes/:quizId/start?limitedTime=N
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
      resultId: raw.resultId,
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
      params: {
        page: params?.page ?? 0,
        size: params?.size ?? 10,
        quizId: params?.quizId,
      },
    });
    const raw = res.data.data;
    return {
      ...raw,
      content: raw.content.map(mapQuizResult),
    };
  },

  // GET /quizzes/results/me/:sessionId
  getMyResultDetail: async (sessionId: string): Promise<QuizSessionDetail> => {
    const res = await axiosClient.get(`/quizzes/results/me/${sessionId}`);
    return mapQuizSessionDetail(res.data.data);
  },

  // PATCH /quizzes/sessions/:sessionId/soft-delete
  softDeleteSession: async (sessionId: string): Promise<void> => {
    await axiosClient.patch(`/quizzes/sessions/${sessionId}/soft-delete`);
  },

  // POST /quizzes/:quizId/rating
  rateQuiz: async (
    quizId: string,
    value: number,
  ): Promise<{ rating: number; ratingCount: number; myRating: number }> => {
    const res = await axiosClient.post(`/quizzes/${quizId}/rating`, { value });
    return res.data.data;
  },

  // GET /quizzes/:quizId/rating/me
  getMyRating: async (quizId: string): Promise<{ myRating: number | null }> => {
    const res = await axiosClient.get(`/quizzes/${quizId}/rating/me`);
    return res.data.data;
  },

  // POST /quizzes/questions/:questionId/report
  reportQuestion: async (questionId: string, reason?: string): Promise<void> => {
    await axiosClient.post(`/quizzes/questions/${questionId}/report`, { reason });
  },
};
