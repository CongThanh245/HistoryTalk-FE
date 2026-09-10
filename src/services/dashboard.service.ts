import { axiosClient } from "@/configs/axios.client";

// ── Types ─────────────────────────────────────────────────

export interface DashboardRecentQuiz {
  sessionId: string;
  quizTitle: string;
  percentage: number;
  completedAt: string;
}

export interface DashboardTopCharacter {
  characterId: string;
  name: string;
  messageCount: number;
  tokenUsed: number;
}

export interface DashboardLearning {
  totalQuizzesAttempted: number;
  averageScorePercentage: number;
  eraDistribution: Record<string, number>;
  recentQuizzes: DashboardRecentQuiz[];
}

export interface DashboardAiUsage {
  currentBalance: number;
  tier: string;
  totalTokensUsed: number;
  promptTokens: number;
  completionTokens: number;
  topCharacters: DashboardTopCharacter[];
}

export interface UserDashboard {
  learning: DashboardLearning;
  aiUsage: DashboardAiUsage;
}

type ApiEnvelope<T> = {
  success: boolean;
  message?: string;
  data?: T;
};

// ── Service ──────────────────────────────────────────────

export const dashboardService = {
  /** GET /users/me/dashboard — Thống kê học tập & sử dụng AI của người dùng hiện tại */
  getMyDashboard: async (): Promise<UserDashboard> => {
    const res = await axiosClient.get<ApiEnvelope<UserDashboard>>("/users/me/dashboard");
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message ?? "Không thể lấy dữ liệu thống kê");
    }
    return res.data.data;
  },
};
