import { axiosClient } from "@/configs/axios.client";

// ── Types ─────────────────────────────────────────────────

export type QuestType = "CHAT" | "QUIZ" | "READ_CONTEXT";

export interface DailyQuest {
  id: string;
  type: QuestType;
  title: string;
  target: number;
  rewardTokens: number;
  progress: number;
  completed: boolean;
  claimed: boolean;
}

export interface WeekDay {
  date: string;
  /** 0 = Thứ 2 ... 6 = Chủ nhật */
  weekday: number;
  studied: boolean;
  isToday: boolean;
}

export interface GamificationToday {
  date: string;
  streakCount: number;
  longestStreak: number;
  totalStudyDays: number;
  studiedToday: boolean;
  week: WeekDay[];
  quests: DailyQuest[];
  claimableTokens: number;
}

export interface ClaimResult {
  questId: string;
  rewardTokens: number;
  tokenBalance: number;
}

type ApiEnvelope<T> = {
  success: boolean;
  message?: string;
  data?: T;
};

// ── Service ──────────────────────────────────────────────

export const gamificationService = {
  /** GET /gamification/today — Streak & nhiệm vụ hôm nay của người dùng hiện tại */
  getToday: async (): Promise<GamificationToday> => {
    const res = await axiosClient.get<ApiEnvelope<GamificationToday>>("/gamification/today");
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message ?? "Không thể lấy dữ liệu nhiệm vụ hôm nay");
    }
    return res.data.data;
  },

  /** POST /gamification/claim — Nhận thưởng token cho một nhiệm vụ đã hoàn thành */
  claim: async (questId: string): Promise<ClaimResult> => {
    const res = await axiosClient.post<ApiEnvelope<ClaimResult>>("/gamification/claim", { questId });
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message ?? "Không thể nhận thưởng nhiệm vụ này");
    }
    return res.data.data;
  },
};
