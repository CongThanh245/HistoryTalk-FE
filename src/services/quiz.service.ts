import { axiosClient } from "@/configs/axios.client";

// ── Types ──────────────────────────────────────────────────

export type QuizDifficulty = "EASY" | "MEDIUM" | "HARD";
export type QuizDifficultyLower = "easy" | "medium" | "hard";
export type QuizEra =
  | "ALL"
  | "ANCIENT"
  | "MEDIEVAL"
  | "MODERN"
  | "CONTEMPORARY";

export interface QuizQuestion {
  questionId: string;
  content: string;
  options: string[]; // A, B, C, D
  correctAnswer: number; // index 0-3
  explanation?: string;
  imageUrl?: string;
}

export interface QuizSet {
  quizId: string;
  title: string;
  description: string;
  thumbnailUrl?: string;
  era: QuizEra;
  difficulty: QuizDifficultyLower;
  totalQuestions: number;
  durationSeconds: number;
  playCount: number;
  rating: number;
  tags?: string[];
  createdAt: string;
}

export interface QuizResult {
  resultId: string;
  quizId: string;
  quizTitle: string;
  score: number;
  totalQuestions: number;
  durationSeconds: number;
  completedAt: string;
  difficulty: QuizDifficultyLower;
}

export interface GetQuizSetsParams {
  search?: string;
  page?: number;
  limit?: number;
  era?: QuizEra;
  difficulty?: QuizDifficulty;
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

export interface StartQuizResponse {
  sessionId: string;
  quizId: string;
  questions: QuizQuestion[];
  durationSeconds: number;
  startedAt: string;
}

export interface SubmitQuizPayload {
  sessionId: string;
  answers: { questionId: string; selectedAnswer: number }[];
  durationSeconds: number;
}

export interface SubmitQuizResponse {
  resultId: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number[];
  wrongAnswers: number[];
  durationSeconds: number;
  completedAt: string;
}

// ── Map functions ──────────────────────────────────────────

export function mapQuizSet(raw: any): QuizSet {
  return {
    quizId: raw.quizId,
    title: raw.title,
    description: raw.description,
    thumbnailUrl: raw.thumbnailUrl,
    era: raw.era as QuizEra,
    difficulty:
      (raw.difficulty?.toLowerCase() as QuizDifficultyLower) ?? "easy",
    totalQuestions: raw.totalQuestions ?? 0,
    durationSeconds: raw.durationSeconds ?? 300,
    playCount: raw.playCount ?? 0,
    rating: raw.rating ?? 0,
    tags: raw.tags ?? [],
    createdAt: raw.createdAt,
  };
}

export function mapQuizResult(raw: any): QuizResult {
  return {
    resultId: raw.resultId,
    quizId: raw.quizId,
    quizTitle: raw.quizTitle,
    score: raw.score,
    totalQuestions: raw.totalQuestions,
    durationSeconds: raw.durationSeconds,
    completedAt: raw.completedAt,
    difficulty:
      (raw.difficulty?.toLowerCase() as QuizDifficultyLower) ?? "easy",
  };
}

// ── Mock Data ──────────────────────────────────────────────

export const MOCK_QUIZ_SETS: QuizSet[] = [
  {
    quizId: "quiz-001",
    title: "Các triều đại phong kiến Việt Nam",
    description:
      "Kiểm tra kiến thức về các triều đại từ thời Ngô đến thời Nguyễn",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=400",
    era: "MEDIEVAL",
    difficulty: "medium",
    totalQuestions: 15,
    durationSeconds: 600,
    playCount: 1284,
    rating: 4.7,
    tags: ["triều đại", "phong kiến"],
    createdAt: "2024-01-15",
  },
  {
    quizId: "quiz-002",
    title: "Chiến tranh chống Pháp",
    description:
      "Những sự kiện quan trọng trong cuộc kháng chiến chống thực dân Pháp",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1569974507005-6dc61f97fb5c?w=400",
    era: "MODERN",
    difficulty: "hard",
    totalQuestions: 20,
    durationSeconds: 900,
    playCount: 892,
    rating: 4.5,
    tags: ["kháng chiến", "Pháp"],
    createdAt: "2024-02-10",
  },
  {
    quizId: "quiz-003",
    title: "Thời kỳ Bắc thuộc",
    description: "1000 năm Bắc thuộc và các cuộc khởi nghĩa tiêu biểu",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400",
    era: "ANCIENT",
    difficulty: "easy",
    totalQuestions: 10,
    durationSeconds: 400,
    playCount: 2341,
    rating: 4.8,
    tags: ["Bắc thuộc", "khởi nghĩa"],
    createdAt: "2024-01-05",
  },
  {
    quizId: "quiz-004",
    title: "Nhân vật lịch sử nổi bật",
    description:
      "Những anh hùng dân tộc đã làm nên lịch sử Việt Nam qua các thời kỳ",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400",
    era: "ALL",
    difficulty: "medium",
    totalQuestions: 25,
    durationSeconds: 1200,
    playCount: 3105,
    rating: 4.9,
    tags: ["nhân vật", "anh hùng"],
    createdAt: "2024-03-01",
  },
  {
    quizId: "quiz-005",
    title: "Văn hóa và phong tục",
    description: "Phong tục, tập quán và văn hóa dân gian người Việt",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1555400082-595b6e60ce6b?w=400",
    era: "CONTEMPORARY",
    difficulty: "easy",
    totalQuestions: 12,
    durationSeconds: 480,
    playCount: 567,
    rating: 4.3,
    tags: ["văn hóa", "phong tục"],
    createdAt: "2024-03-15",
  },
  {
    quizId: "quiz-006",
    title: "Chiến thắng Điện Biên Phủ",
    description: "Chi tiết về chiến dịch Điện Biên Phủ lịch sử năm 1954",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1569974507005-6dc61f97fb5c?w=400",
    era: "MODERN",
    difficulty: "hard",
    totalQuestions: 18,
    durationSeconds: 720,
    playCount: 1456,
    rating: 4.6,
    tags: ["Điện Biên Phủ", "1954"],
    createdAt: "2024-02-20",
  },
];

export const MOCK_RECENT_RESULTS: QuizResult[] = [
  {
    resultId: "res-001",
    quizId: "quiz-001",
    quizTitle: "Các triều đại phong kiến Việt Nam",
    score: 12,
    totalQuestions: 15,
    durationSeconds: 480,
    completedAt: "2024-03-20T10:30:00",
    difficulty: "medium",
  },
  {
    resultId: "res-002",
    quizId: "quiz-003",
    quizTitle: "Thời kỳ Bắc thuộc",
    score: 9,
    totalQuestions: 10,
    durationSeconds: 320,
    completedAt: "2024-03-19T14:15:00",
    difficulty: "easy",
  },
  {
    resultId: "res-003",
    quizId: "quiz-004",
    quizTitle: "Nhân vật lịch sử nổi bật",
    score: 18,
    totalQuestions: 25,
    durationSeconds: 950,
    completedAt: "2024-03-18T09:00:00",
    difficulty: "medium",
  },
];

// ── Service ────────────────────────────────────────────────

export const quizService = {
  // GET /quizzes
  getAll: async (params?: GetQuizSetsParams): Promise<GetQuizSetsResponse> => {
    // TODO: uncomment when API ready
    // const res = await axiosClient.get("/quizzes", { params });
    // const raw = res.data.data;
    // return { ...raw, content: raw.content.map(mapQuizSet) };
    await new Promise((r) => setTimeout(r, 400));
    return {
      content: MOCK_QUIZ_SETS,
      totalElements: MOCK_QUIZ_SETS.length,
      totalPages: 1,
      currentPage: 1,
      pageSize: 10,
      hasNext: false,
      hasPrevious: false,
    };
  },

  // GET /quizzes/:id
  getById: async (quizId: string): Promise<QuizSet> => {
    // TODO: const res = await axiosClient.get(`/quizzes/${quizId}`);
    // return mapQuizSet(res.data.data);
    await new Promise((r) => setTimeout(r, 300));
    return MOCK_QUIZ_SETS.find((q) => q.quizId === quizId) ?? MOCK_QUIZ_SETS[0];
  },

  // POST /quizzes/:id/start
  startQuiz: async (quizId: string): Promise<StartQuizResponse> => {
    // TODO: const res = await axiosClient.post(`/quizzes/${quizId}/start`);
    // return res.data.data;
    await new Promise((r) => setTimeout(r, 300));
    return {
      sessionId: `session-${Date.now()}`,
      quizId,
      questions: [],
      durationSeconds: 600,
      startedAt: new Date().toISOString(),
    };
  },

  // POST /quizzes/submit
  submitQuiz: async (
    payload: SubmitQuizPayload,
  ): Promise<SubmitQuizResponse> => {
    // TODO: const res = await axiosClient.post("/quizzes/submit", payload);
    // return res.data.data;
    await new Promise((r) => setTimeout(r, 500));
    return {
      resultId: `res-${Date.now()}`,
      score: 14,
      totalQuestions: 15,
      correctAnswers: [],
      wrongAnswers: [],
      durationSeconds: payload.durationSeconds,
      completedAt: new Date().toISOString(),
    };
  },

  // GET /quizzes/results/me
  getMyResults: async (): Promise<QuizResult[]> => {
    // TODO: const res = await axiosClient.get("/quizzes/results/me");
    // return res.data.data.map(mapQuizResult);
    await new Promise((r) => setTimeout(r, 300));
    return MOCK_RECENT_RESULTS;
  },
};
