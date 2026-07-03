// src/services/admin.user.service.ts
import { axiosClient } from "@/configs/axios.client";

// ─── Types ─────────────────────────────────────────────────────────────────

export type UserRole = "CUSTOMER" | "CONTENT_ADMIN" | "SYSTEM_ADMIN";
export type Gender = "MALE" | "FEMALE" | "OTHER";

export interface AdminUser {
  uid: string;
  userName: string;
  email: string;
  role: UserRole;
  fullName: string;
  dob: string | null;
  gender: Gender | null;
  phoneNumber: string | null;
  address: string | null;
  avatarUrl: string | null;
  tierId: string | null;
  tierTitle: string | null;
  token: number;
  lastActiveDate: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface PaginatedUsers {
  content: AdminUser[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface UpdateUserPayload {
  userName?: string;
  fullName?: string;
  dob?: string;
  gender?: Gender;
  phoneNumber?: string;
  address?: string;
  avatarUrl?: string;
}

export interface UpdateRolePayload {
  role: UserRole;
}

export interface ListUsersParams {
  page?: number;
  size?: number;
}

// ─── Token Analytics Types ──────────────────────────────────────────────────

export interface TokenSummary {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  remainingTokens: number;
  averageRemainingTokens: number;
  usersOutOfTokens: number;
  estimatedCost: number;
}

export interface TokenTrendPoint {
  date: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface TokenBalanceByTier {
  tierId: string;
  tierTitle: string;
  users: number;
  remainingTokens: number;
  averageRemainingTokens: number;
  usersOutOfTokens: number;
}

export interface TopUserByTokenUsage {
  uid: string;
  userName: string;
  email: string;
  tierId: string;
  tierTitle: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  remainingTokens: number;
}

export interface TokenAnalyticsData {
  summary: TokenSummary;
  trend: TokenTrendPoint[];
  tokenBalanceByTier: TokenBalanceByTier[];
  topUsersByTokenUsage: TopUserByTokenUsage[];
}

export interface TokenAnalyticsParams {
  from?: string; // YYYY-MM-DD
  to?: string;   // YYYY-MM-DD
  granularity?: "day" | "week" | "month";
}

// ─── Service ────────────────────────────────────────────────────────────────

const BASE = "/admin/users";
const DASHBOARD_BASE = "/system-admin/dashboard";

export const adminUserService = {
  // ─── User CRUD ────────────────────────────────────────────────────────────

  /** Get paginated list of all users */
  listUsers: async (params?: ListUsersParams): Promise<PaginatedUsers> => {
    const res = await axiosClient.get(BASE, { params });
    return res.data.data as PaginatedUsers;
  },

  /** Get single user by ID */
  getUserById: async (userId: string): Promise<AdminUser> => {
    const res = await axiosClient.get(`${BASE}/${userId}`);
    return res.data.data as AdminUser;
  },

  /** Update user profile (as admin) */
  updateUser: async (userId: string, payload: UpdateUserPayload): Promise<AdminUser> => {
    const res = await axiosClient.patch(`${BASE}/${userId}`, payload);
    return res.data.data as AdminUser;
  },

  /** Update user role */
  updateUserRole: async (userId: string, payload: UpdateRolePayload): Promise<AdminUser> => {
    const res = await axiosClient.patch(`${BASE}/${userId}/role`, payload);
    return res.data.data as AdminUser;
  },

  /** Deactivate/suspend user account */
  deactivateUser: async (userId: string): Promise<void> => {
    await axiosClient.patch(`${BASE}/${userId}/deactivate`);
  },

  /** Restore a deactivated user account */
  restoreUser: async (userId: string): Promise<AdminUser> => {
    const res = await axiosClient.patch(`${BASE}/${userId}/restore`);
    return res.data.data as AdminUser;
  },

  // ─── Token Analytics ────────────────────────────────────────────────────

  /** Get token usage analytics for admin dashboard */
  getTokenAnalytics: async (params?: TokenAnalyticsParams): Promise<TokenAnalyticsData> => {
    const res = await axiosClient.get(`${DASHBOARD_BASE}/tokens`, { params });
    return res.data.data as TokenAnalyticsData;
  },
};
