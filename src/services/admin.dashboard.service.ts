// src/services/admin.dashboard.service.ts
import { axiosClient } from "@/configs/axios.client";

// ─── Overview ────────────────────────────────────────────────────────────────

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

export interface UserAnalyticsParams {
  from?: string;       // YYYY-MM-DD
  to?: string;         // YYYY-MM-DD
  granularity?: "day" | "week" | "month";
}

// ─── Content ─────────────────────────────────────────────────────────────────

export interface ContentSummaryData {
  historicalContexts: { total: number; published: number; active: number };
  characters: { total: number; published: number; active: number };
  documents: { total: number; active: number };
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

export interface ChatActivityParams {
  from?: string;
  to?: string;
  granularity?: "day" | "week" | "month";
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

// ─── Service ─────────────────────────────────────────────────────────────────

const BASE = "/system-admin/dashboard";

export const adminDashboardService = {
  getOverview: async (): Promise<DashboardOverviewData> => {
    const res = await axiosClient.get(`${BASE}/overview`);
    return res.data.data as DashboardOverviewData;
  },

  getUserAnalytics: async (params?: UserAnalyticsParams): Promise<UserAnalyticsData> => {
    const res = await axiosClient.get(`${BASE}/users`, { params });
    return res.data.data as UserAnalyticsData;
  },

  getContentSummary: async (): Promise<ContentSummaryData> => {
    const res = await axiosClient.get(`${BASE}/content`);
    return res.data.data as ContentSummaryData;
  },

  getChatActivity: async (params?: ChatActivityParams): Promise<ChatActivityData> => {
    const res = await axiosClient.get(`${BASE}/chat-activity`, { params });
    return res.data.data as ChatActivityData;
  },

  getSystemHealth: async (): Promise<SystemHealthData> => {
    const res = await axiosClient.get(`${BASE}/system-health`);
    return res.data.data as SystemHealthData;
  },
};
