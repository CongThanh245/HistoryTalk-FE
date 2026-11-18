// src/services/admin.dashboard.service.ts
import { axiosClient } from "@/configs/axios.client";

// ─── Scope ───────────────────────────────────────────────────────────────────

/**
 * Phân khúc dữ liệu thống kê (Sprint 10).
 * B2C = khách lẻ (CUSTOMER, nội dung Global); B2B = trường học (SCHOOL_ADMIN/TEACHER/SCHOOL_STUDENT, nội dung Local).
 * GLOBAL/LOCAL là alias của B2C/B2B phía BE.
 */
export type DashboardScope = "ALL" | "B2C" | "B2B" | "GLOBAL" | "LOCAL";

export interface DashboardScopeParams {
  scope?: DashboardScope;
}

// ─── Overview ────────────────────────────────────────────────────────────────

export interface TopCharacterOverview {
  characterId: string;
  name: string;
  title?: string;
  imageUrl?: string;
  totalMessages: number;
  userMessages: number;
  aiMessages: number;
}

export interface DashboardOverviewData {
  users: {
    total: number;
    active: number;
    inactive: number;
    deleted: number;
    newToday: number;
    newThisMonth: number;
  };
  roles: {
    customers: number;
    contentAdmins: number;
    systemAdmins: number;
    schoolAdmins?: number;
    teachers?: number;
    schoolStudents?: number;
  };
  content: {
    historicalContexts: number;
    publishedHistoricalContexts: number;
    characters: number;
    publishedCharacters: number;
    documents: number;
  };
  chat: {
    sessions: number;
    messages: number;
    messagesToday: number;
  };
  /** Global khi scope ALL/B2C, Local khi scope B2B. */
  topCharacters?: TopCharacterOverview[];
  /** Nhân vật Global (school_id IS NULL). */
  topGlobalCharacters?: TopCharacterOverview[];
  /** Nhân vật Local của trường (school_id IS NOT NULL). */
  topLocalCharacters?: TopCharacterOverview[];
  systemHealth: {
    status: string;
    lastCheckedAt: string;
  };
}

// ─── Users ───────────────────────────────────────────────────────────────────

export interface UserTrendPoint {
  date: string;
  newUsers: number;
  activeUsers: number;
}

export interface UserAnalyticsData {
  summary: {
    total: number;
    active: number;
    inactive: number;
    deleted: number;
    recentlyActive: number;
  };
  byRole: { role: string; count: number }[];
  trend: UserTrendPoint[];
}

export interface UserAnalyticsParams extends DashboardScopeParams {
  from?: string;       // YYYY-MM-DD
  to?: string;         // YYYY-MM-DD
  granularity?: "day" | "week" | "month" | "year";
}

// ─── Content ─────────────────────────────────────────────────────────────────

export interface ContentCount {
  total: number;
  published: number;
  active: number;
}

export interface ContentSummaryData {
  /** Global khi scope ALL/B2C, Local khi scope B2B. */
  historicalContexts: ContentCount;
  characters: ContentCount;
  documents: { total: number; active: number };
  localHistoricalContexts?: ContentCount;
  localCharacters?: ContentCount;
}

// ─── Chat ────────────────────────────────────────────────────────────────────

export interface ChatTrendPoint {
  date: string;
  sessions: number;
  messages: number;
}

export interface ChatActivityData {
  summary: {
    sessions: number;
    activeSessions: number;
    messages: number;
    userMessages: number;
    aiMessages: number;
    sessionsToday: number;
    messagesToday: number;
  };
  trend: ChatTrendPoint[];
}

export interface ChatActivityParams extends DashboardScopeParams {
  from?: string;
  to?: string;
  granularity?: "day" | "week" | "month" | "year";
}

export interface PaymentTransactionTrendPoint {
  date: string;
  success: number;
  failed: number;
}

export interface PaymentAnalyticsData {
  summary: {
    totalOrders: number;
    pendingOrders: number;
    paidOrders: number;
    cancelledOrders: number;
    expiredOrders: number;
    failedOrders: number;
    successfulTransactions: number;
    failedTransactions: number;
  };
  transactionTrend: PaymentTransactionTrendPoint[];
}

export interface PaymentAnalyticsParams extends DashboardScopeParams {
  from?: string;
  to?: string;
  granularity?: "day" | "week" | "month" | "year";
}

// ─── System Health ────────────────────────────────────────────────────────────

export interface SystemHealthData {
  status: string;
  uptime: string;
  jvmMemoryUsed: number;
  jvmMemoryMax: number;
  httpRequestCount: number;
  httpErrorCount: number;
  lastCheckedAt: string;
}

// ─── Tiers ────────────────────────────────────────────────────────────────────

export interface TierAnalyticsData {
  summary: {
    activeTiers: number;
    currentPaidUsers: number;
    currentFreeUsers: number;
    activeSubscriptions: number;
    expiringSoonSubscriptions: number;
    freeToPaidConversionRate: number;
  };
  usersByTier: {
    tierId: string;
    tierTitle: string;
    users: number;
  }[];
  purchasesByTier: {
    tierId: string;
    tierTitle: string;
    paidOrders: number;
    revenue: number;
  }[];
}

// ─── Revenue ──────────────────────────────────────────────────────────────────

export interface RevenueAnalyticsData {
  summary: {
    totalRevenue: number;
    revenueToday: number;
    revenueThisMonth: number;
    revenueThisYear?: number;
    paidOrders: number;
    averageOrderValue: number;
  };
  ordersByStatus: {
    status: string;
    count: number;
  }[];
  revenueByTier: {
    tierId: string;
    tierTitle: string;
    revenue: number;
    paidOrders: number;
  }[];
  trend: {
    date: string;
    revenue: number;
    paidOrders: number;
  }[];
}

// ─── Quiz ─────────────────────────────────────────────────────────────────────

export interface QuizAnalyticsData {
  summary: {
    totalQuizzes: number;
    publishedQuizzes: number;
    draftQuizzes: number;
    deletedQuizzes: number;
    startedSessions: number;
    completedSessions: number;
    completionRate: number;
    averageScorePercentage: number;
  };
  sessionsTrend: {
    date: string;
    started: number;
    completed: number;
  }[];
  topQuizzes: {
    quizId: string;
    title: string;
    level?: string;
    startedSessions: number;
    completedSessions: number;
    averageScorePercentage: number;
  }[];
  topWrongQuestions: {
    questionId: string;
    questionContent?: string;
    quizId: string;
    quizTitle: string;
    wrongAnswers: number;
    totalAnswers: number;
    wrongRate: number;
  }[];
}

// ─── Service ─────────────────────────────────────────────────────────────────

const BASE = "/system-admin/dashboard";

export const adminDashboardService = {
  getOverview: async (params?: DashboardScopeParams): Promise<DashboardOverviewData> => {
    const res = await axiosClient.get(`${BASE}/overview`, { params });
    return res.data.data as DashboardOverviewData;
  },

  getUserAnalytics: async (params?: UserAnalyticsParams): Promise<UserAnalyticsData> => {
    const res = await axiosClient.get(`${BASE}/users`, { params });
    return res.data.data as UserAnalyticsData;
  },

  getContentSummary: async (params?: DashboardScopeParams): Promise<ContentSummaryData> => {
    const res = await axiosClient.get(`${BASE}/content`, { params });
    return res.data.data as ContentSummaryData;
  },

  getChatActivity: async (params?: ChatActivityParams): Promise<ChatActivityData> => {
    const res = await axiosClient.get(`${BASE}/chat-activity`, { params });
    return res.data.data as ChatActivityData;
  },

  getPaymentAnalytics: async (params?: PaymentAnalyticsParams): Promise<PaymentAnalyticsData> => {
    const res = await axiosClient.get(`${BASE}/payments`, { params });
    return res.data.data as PaymentAnalyticsData;
  },

  getSystemHealth: async (): Promise<SystemHealthData> => {
    const res = await axiosClient.get(`${BASE}/system-health`);
    return res.data.data as SystemHealthData;
  },

  getTierAnalytics: async (params?: PaymentAnalyticsParams): Promise<TierAnalyticsData> => {
    const res = await axiosClient.get(`${BASE}/tiers`, { params });
    return res.data.data as TierAnalyticsData;
  },

  getRevenueAnalytics: async (params?: PaymentAnalyticsParams): Promise<RevenueAnalyticsData> => {
    const res = await axiosClient.get(`${BASE}/revenue`, { params });
    return res.data.data as RevenueAnalyticsData;
  },

  getQuizAnalytics: async (params?: PaymentAnalyticsParams): Promise<QuizAnalyticsData> => {
    const res = await axiosClient.get(`${BASE}/quiz`, { params });
    return res.data.data as QuizAnalyticsData;
  },
};
