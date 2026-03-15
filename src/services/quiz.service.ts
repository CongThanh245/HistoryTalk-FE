import { axiosClient } from "@/configs/axios.client";

// ── Types ──────────────────────────────────────────────────


export type QuizEra =
  | "ALL"
  | "ANCIENT"
  | "MEDIEVAL"
  | "MODERN"
  | "CONTEMPORARY";

export interface QuizQuestion {
  questionId: string;
  content: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export interface QuizSet {
  quizId: string;
  title: string;
  description: string;
  thumbnailUrl?: string;
  era: QuizEra;
  totalQuestions: number;
  durationSeconds: number;
  playCount: number;
  rating: number;
  tags?: string[];
  createdAt: string;
}

// ── QuizSetV2 — thêm grade cho chương trình học ────────────

export type QuizGrade = 10 | 11 | 12;

export interface QuizSetV2 extends QuizSet {
  grade: QuizGrade;
  chapterNumber: number;
  chapterTitle: string;
}

// ── Các types khác ─────────────────────────────────────────

export interface QuizResult {
  resultId: string;
  quizId: string;
  quizTitle: string;
  score: number;
  totalQuestions: number;
  durationSeconds: number;
  completedAt: string;
}

export interface GetQuizSetsParams {
  search?: string;
  page?: number;
  limit?: number;
  era?: QuizEra;
}

export interface GetQuizSetsResponse {
  content: QuizSetV2[];
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

export function mapQuizSet(raw: any): QuizSetV2 {
  return {
    quizId: raw.quizId,
    title: raw.title,
    description: raw.description,
    thumbnailUrl: raw.thumbnailUrl,
    era: raw.era as QuizEra,
    totalQuestions: raw.totalQuestions ?? 0,
    durationSeconds: raw.durationSeconds ?? 300,
    playCount: raw.playCount ?? 0,
    rating: raw.rating ?? 0,
    tags: raw.tags ?? [],
    createdAt: raw.createdAt,
    grade: raw.grade ?? 12,
    chapterNumber: raw.chapterNumber ?? 1,
    chapterTitle: raw.chapterTitle ?? raw.title,
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
  };
}

// ── Mock Data ──────────────────────────────────────────────

export const MOCK_QUIZ_SETS: QuizSetV2[] = [
  // ── Lịch sử 12 ──────────────────────────────────────────
  {
    quizId: "ls12-b1",
    title: "Lịch sử 12 — Bài 1: Liên Hợp Quốc",
    description:
      "Quá trình thành lập, mục tiêu và nguyên tắc hoạt động của Liên Hợp Quốc",
    grade: 12,
    chapterNumber: 1,
    chapterTitle: "Liên Hợp Quốc",
    era: "CONTEMPORARY",

    totalQuestions: 10,
    durationSeconds: 900,
    playCount: 3241,
    rating: 4.8,
    tags: ["liên hợp quốc", "chiến tranh lạnh"],
    createdAt: "2024-01-10",
  },
  {
    quizId: "ls12-b2",
    title: "Lịch sử 12 — Bài 2: Trật tự thế giới hai cực",
    description:
      "Sự hình thành trật tự thế giới hai cực Ianta và chiến tranh lạnh",
    grade: 12,
    chapterNumber: 2,
    chapterTitle: "Trật tự thế giới hai cực",
    era: "CONTEMPORARY",

    totalQuestions: 20,
    durationSeconds: 900,
    playCount: 2187,
    rating: 4.6,
    tags: ["chiến tranh lạnh", "hai cực"],
    createdAt: "2024-01-12",
  },
  {
    quizId: "ls12-b3",
    title: "Lịch sử 12 — Bài 3: Các nước Đông Bắc Á",
    description:
      "Tình hình các nước Đông Bắc Á sau chiến tranh thế giới thứ hai",
    grade: 12,
    chapterNumber: 3,
    chapterTitle: "Các nước Đông Bắc Á",
    era: "CONTEMPORARY",

    totalQuestions: 20,
    durationSeconds: 900,
    playCount: 1842,
    rating: 4.5,
    tags: ["đông bắc á", "trung quốc", "nhật bản"],
    createdAt: "2024-01-15",
  },
  {
    quizId: "ls12-b4",
    title: "Lịch sử 12 — Bài 4: Các nước Đông Nam Á",
    description: "Phong trào giải phóng dân tộc và sự ra đời của ASEAN",
    grade: 12,
    chapterNumber: 4,
    chapterTitle: "Các nước Đông Nam Á & ASEAN",
    era: "CONTEMPORARY",

    totalQuestions: 20,
    durationSeconds: 900,
    playCount: 2563,
    rating: 4.7,
    tags: ["asean", "đông nam á"],
    createdAt: "2024-01-18",
  },
  {
    quizId: "ls12-b5",
    title: "Lịch sử 12 — Bài 5: Các nước châu Phi & Mĩ La-tinh",
    description: "Phong trào giải phóng dân tộc ở châu Phi và cách mạng Cuba",
    grade: 12,
    chapterNumber: 5,
    chapterTitle: "Châu Phi & Mĩ La-tinh",
    era: "CONTEMPORARY",

    totalQuestions: 20,
    durationSeconds: 900,
    playCount: 1203,
    rating: 4.4,
    tags: ["châu phi", "cuba", "mĩ la-tinh"],
    createdAt: "2024-01-20",
  },

  // ── Lịch sử 11 ──────────────────────────────────────────
  {
    quizId: "ls11-b1",
    title: "Lịch sử 11 — Bài 1: Nhật Bản",
    description:
      "Nhật Bản từ cuối thế kỷ XIX đến đầu thế kỷ XX — Minh Trị Duy Tân",
    grade: 11,
    chapterNumber: 1,
    chapterTitle: "Nhật Bản cuối XIX — đầu XX",
    era: "MODERN",

    totalQuestions: 20,
    durationSeconds: 900,
    playCount: 1876,
    rating: 4.6,
    tags: ["nhật bản", "minh trị"],
    createdAt: "2024-02-01",
  },
  {
    quizId: "ls11-b2",
    title: "Lịch sử 11 — Bài 2: Ấn Độ",
    description:
      "Phong trào giải phóng dân tộc ở Ấn Độ dưới thời thuộc địa Anh",
    grade: 11,
    chapterNumber: 2,
    chapterTitle: "Ấn Độ thời thuộc địa",
    era: "MODERN",

    totalQuestions: 20,
    durationSeconds: 900,
    playCount: 1234,
    rating: 4.3,
    tags: ["ấn độ", "giải phóng dân tộc"],
    createdAt: "2024-02-05",
  },
  {
    quizId: "ls11-b3",
    title: "Lịch sử 11 — Bài 3: Trung Quốc",
    description:
      "Trung Quốc cuối thế kỷ XIX — phong trào Ngũ Tứ và cách mạng Tân Hợi",
    grade: 11,
    chapterNumber: 3,
    chapterTitle: "Trung Quốc cuối XIX — đầu XX",
    era: "MODERN",

    totalQuestions: 20,
    durationSeconds: 900,
    playCount: 1654,
    rating: 4.5,
    tags: ["trung quốc", "tân hợi"],
    createdAt: "2024-02-08",
  },
  {
    quizId: "ls11-b4",
    title: "Lịch sử 11 — Bài 4: Chiến tranh thế giới thứ nhất",
    description:
      "Nguyên nhân, diễn biến và hậu quả của chiến tranh thế giới lần thứ nhất",
    grade: 11,
    chapterNumber: 4,
    chapterTitle: "Chiến tranh thế giới I (1914–1918)",
    era: "MODERN",

    totalQuestions: 20,
    durationSeconds: 900,
    playCount: 2890,
    rating: 4.9,
    tags: ["thế chiến 1", "1914"],
    createdAt: "2024-02-10",
  },
  {
    quizId: "ls11-b5",
    title: "Lịch sử 11 — Bài 5: Cách mạng tháng Mười Nga",
    description:
      "Cuộc cách mạng Bolshevik năm 1917 và sự ra đời của Nhà nước Xô Viết",
    grade: 11,
    chapterNumber: 5,
    chapterTitle: "Cách mạng tháng Mười Nga 1917",
    era: "MODERN",

    totalQuestions: 20,
    durationSeconds: 900,
    playCount: 2103,
    rating: 4.7,
    tags: ["cách mạng nga", "liên xô"],
    createdAt: "2024-02-12",
  },

  // ── Lịch sử 10 ──────────────────────────────────────────
  {
    quizId: "ls10-b1",
    title: "Lịch sử 10 — Bài 1: Xã hội nguyên thủy",
    description: "Nguồn gốc loài người và sự hình thành xã hội nguyên thủy",
    grade: 10,
    chapterNumber: 1,
    chapterTitle: "Xã hội nguyên thủy",
    era: "ANCIENT",

    totalQuestions: 20,
    durationSeconds: 900,
    playCount: 3102,
    rating: 4.5,
    tags: ["nguyên thủy", "loài người"],
    createdAt: "2024-03-01",
  },
  {
    quizId: "ls10-b2",
    title: "Lịch sử 10 — Bài 2: Xã hội cổ đại",
    description: "Các nền văn minh cổ đại phương Đông và phương Tây",
    grade: 10,
    chapterNumber: 2,
    chapterTitle: "Xã hội cổ đại",
    era: "ANCIENT",

    totalQuestions: 20,
    durationSeconds: 900,
    playCount: 2456,
    rating: 4.6,
    tags: ["cổ đại", "văn minh"],
    createdAt: "2024-03-05",
  },
  {
    quizId: "ls10-b3",
    title: "Lịch sử 10 — Bài 3: Trung Quốc phong kiến",
    description: "Các triều đại phong kiến Trung Quốc và ảnh hưởng đến khu vực",
    grade: 10,
    chapterNumber: 3,
    chapterTitle: "Trung Quốc thời phong kiến",
    era: "MEDIEVAL",

    totalQuestions: 20,
    durationSeconds: 900,
    playCount: 1789,
    rating: 4.4,
    tags: ["trung quốc", "phong kiến"],
    createdAt: "2024-03-08",
  },
  {
    quizId: "ls10-b4",
    title: "Lịch sử 10 — Bài 4: Ấn Độ & Đông Nam Á phong kiến",
    description:
      "Các vương quốc phong kiến Ấn Độ và Đông Nam Á thời cổ trung đại",
    grade: 10,
    chapterNumber: 4,
    chapterTitle: "Ấn Độ & ĐNA phong kiến",
    era: "MEDIEVAL",

    totalQuestions: 20,
    durationSeconds: 900,
    playCount: 1342,
    rating: 4.3,
    tags: ["ấn độ", "đông nam á"],
    createdAt: "2024-03-10",
  },
  {
    quizId: "ls10-b5",
    title: "Lịch sử 10 — Bài 5: Tây Âu thời phong kiến",
    description:
      "Chế độ phong kiến Tây Âu, thành thị trung đại và văn hóa Phục Hưng",
    grade: 10,
    chapterNumber: 5,
    chapterTitle: "Tây Âu thời phong kiến",
    era: "MEDIEVAL",

    totalQuestions: 20,
    durationSeconds: 900,
    playCount: 1567,
    rating: 4.5,
    tags: ["tây âu", "phong kiến"],
    createdAt: "2024-03-12",
  },
];

export const MOCK_QUESTIONS: Record<string, QuizQuestion[]> = {
  "ls12-b1": [
    {
      questionId: "ls12b1-q1",
      content: "Tổ chức quốc tế được xem như tiền thân của Liên hợp quốc là",
      options: [
        "Hội Quốc liên",
        "Khối Hiệp ước",
        "Khối Đồng minh",
        "Liên minh châu Âu",
      ],
      correctAnswer: 0,
      explanation:
        "Hội Quốc liên (League of Nations) thành lập năm 1920 sau Chiến tranh thế giới I được coi là tiền thân của Liên hợp quốc.",
    },
    {
      questionId: "ls12b1-q2",
      content:
        "Quá trình hình thành Liên hợp quốc gắn liền với vai trò quan trọng của các quốc gia nào?",
      options: [
        "Liên Xô, Mỹ, Anh",
        "Mỹ, Anh, Pháp",
        "Liên Xô, Trung Quốc, Đức",
        "Liên Xô, Mỹ, Đức",
      ],
      correctAnswer: 0,
      explanation:
        "Ba cường quốc Liên Xô, Mỹ, Anh đóng vai trò chủ chốt qua các hội nghị Têhêran, Ianta và Xan Phranxixcô.",
    },
    {
      questionId: "ls12b1-q3",
      content:
        "Tại Hội nghị I-an-ta (2-1945), quyết định quan trọng nào liên quan đến Liên hợp quốc?",
      options: [
        "Duy trì và mở rộng Hội Quốc liên",
        "Thành lập tổ chức Liên hợp quốc",
        "Thành lập tổ chức Hội Quốc liên",
        "Thành lập Ban Thư kí Liên hợp quốc",
      ],
      correctAnswer: 1,
      explanation:
        "Hội nghị Ianta (2/1945) quyết định thành lập Liên hợp quốc để duy trì hòa bình và an ninh thế giới.",
    },
    {
      questionId: "ls12b1-q4",
      content:
        "Từ cuối tháng 4 đến cuối tháng 6-1945, 50 nước họp tại Xan Phran-xi-xcô thông qua nội dung nào?",
      options: [
        "Xét xử tội phạm chiến tranh",
        "Hiến chương Liên hợp quốc",
        "Tiêu diệt phát xít Nhật",
        "Kết thúc chiến tranh Triều Tiên",
      ],
      correctAnswer: 1,
      explanation:
        "Hội nghị Xan Phranxixcô (4-6/1945) với 50 quốc gia đã thông qua bản Hiến chương Liên hợp quốc.",
    },
    {
      questionId: "ls12b1-q5",
      content:
        "Ngày 24-10-1945, sau khi Quốc hội các nước thành viên phê chuẩn, bản Hiến chương Liên hợp quốc",
      options: [
        "Chính thức được công bố",
        "Được bổ sung, hoàn chỉnh",
        "Chính thức có hiệu lực",
        "Được chính thức thông qua",
      ],
      correctAnswer: 2,
      explanation:
        "Ngày 24/10/1945 là ngày Hiến chương LHQ chính thức có hiệu lực, được gọi là Ngày Liên hợp quốc.",
    },
    {
      questionId: "ls12b1-q6",
      content:
        "Ngày 1/1/1942, tại Oa-sinh-tơn, đại diện của 26 nước ký văn kiện nào?",
      options: [
        "Hiệp ước Maxtrich",
        "Tuyên bố Liên hợp quốc",
        "Hiệp định Muynich",
        "Hiệp ước Rôma",
      ],
      correctAnswer: 1,
      explanation:
        "Ngày 1/1/1942, đại diện 26 quốc gia ký 'Tuyên bố Liên hợp quốc' tại Washington.",
    },
    {
      questionId: "ls12b1-q7",
      content:
        "Tại Hội nghị Tê-hê-ran, nguyên thủ 3 nước Liên Xô, Mĩ, Anh khẳng định điều gì?",
      options: [
        "Nguyên tắc phân chia nước Đức",
        "Thành lập quân đội giữ gìn hòa bình",
        "Nhanh chóng đánh bại phát xít Đức",
        "Quyết tâm thành lập Liên hợp quốc",
      ],
      correctAnswer: 3,
      explanation:
        "Tại Hội nghị Têhêran (11-12/1943), ba cường quốc khẳng định quyết tâm thành lập tổ chức quốc tế mới.",
    },
    {
      questionId: "ls12b1-q8",
      content:
        "Tổ chức Liên hợp quốc được thành lập trong bối cảnh nhân dân thế giới ý thức sâu sắc về hậu quả tàn khốc của",
      options: [
        "Chiến tranh lạnh",
        "Chiến tranh thế giới",
        "Phân hóa giàu nghèo",
        "Khủng hoảng kinh tế",
      ],
      correctAnswer: 1,
      explanation:
        "LHQ ra đời khi nhân loại vừa trải qua hai cuộc chiến tranh thế giới với hàng chục triệu người thiệt mạng.",
    },
    {
      questionId: "ls12b1-q9",
      content:
        "Tổ chức Liên hợp quốc được thành lập năm 1945 nhằm đáp ứng nhu cầu nào của nhân loại?",
      options: [
        "Chống biến đổi khí hậu toàn cầu",
        "Bảo vệ hòa bình, an ninh toàn thế giới",
        "Nâng cao đời sống tinh thần con người",
        "Thúc đẩy khoa học công nghệ phát triển",
      ],
      correctAnswer: 1,
      explanation:
        "Mục tiêu hàng đầu của LHQ là duy trì hòa bình và an ninh quốc tế, ngăn ngừa chiến tranh.",
    },
    {
      questionId: "ls12b1-q10",
      content:
        "Yêu cầu bức thiết nào được đặt ra cho các nước Đồng minh khi chiến tranh thế giới thứ hai bước vào giai đoạn cuối?",
      options: [
        "Đẩy mạnh xu thế toàn cầu hóa kinh tế",
        "Thành lập Hội Quốc liên để ngăn chặn chiến tranh",
        "Tiêu diệt chủ nghĩa phát xít và tổ chức lại thế giới",
        "Thủ tiêu chế độ phân biệt chủng tộc",
      ],
      correctAnswer: 2,
      explanation:
        "Giai đoạn cuối Thế chiến II: tiêu diệt chủ nghĩa phát xít và xây dựng trật tự thế giới mới.",
    },
  ],
};

export const MOCK_RECENT_RESULTS: QuizResult[] = [
  {
    resultId: "res-001",
    quizId: "ls12-b1",
    quizTitle: "Liên Hợp Quốc",
    score: 8,
    totalQuestions: 10,
    durationSeconds: 480,
    completedAt: "2024-03-20T10:30:00",

  },
  {
    resultId: "res-002",
    quizId: "ls11-b4",
    quizTitle: "Chiến tranh thế giới I (1914–1918)",
    score: 15,
    totalQuestions: 20,
    durationSeconds: 620,
    completedAt: "2024-03-19T14:15:00",

  },
  {
    resultId: "res-003",
    quizId: "ls10-b1",
    quizTitle: "Xã hội nguyên thủy",
    score: 18,
    totalQuestions: 20,
    durationSeconds: 540,
    completedAt: "2024-03-18T09:00:00",

  },
];

// ── Service ────────────────────────────────────────────────

export const quizService = {
  // GET /quizzes
  getAll: async (params?: GetQuizSetsParams): Promise<GetQuizSetsResponse> => {
    // TODO: const res = await axiosClient.get("/quizzes", { params });
    // const raw = res.data.data;
    // return { ...raw, content: raw.content.map(mapQuizSet) };
    await new Promise((r) => setTimeout(r, 400));
    return {
      content: MOCK_QUIZ_SETS,
      totalElements: MOCK_QUIZ_SETS.length,
      totalPages: 1,
      currentPage: 1,
      pageSize: 20,
      hasNext: false,
      hasPrevious: false,
    };
  },

  // GET /quizzes/:id
  getById: async (quizId: string): Promise<QuizSetV2> => {
    // TODO: const res = await axiosClient.get(`/quizzes/${quizId}`);
    // return mapQuizSet(res.data.data);
    await new Promise((r) => setTimeout(r, 300));
    return MOCK_QUIZ_SETS.find((q) => q.quizId === quizId) ?? MOCK_QUIZ_SETS[0];
  },

  // GET /quizzes/:id/questions
  getQuestions: async (quizId: string): Promise<QuizQuestion[]> => {
    // TODO: const res = await axiosClient.get(`/quizzes/${quizId}/questions`);
    // return res.data.data;
    await new Promise((r) => setTimeout(r, 400));
    return MOCK_QUESTIONS[quizId] ?? MOCK_QUESTIONS["ls12-b1"] ?? [];
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
      durationSeconds: 900,
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
      score: 0,
      totalQuestions: 0,
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
