// src/services/school-token.service.ts
// Sprint 7 (US-SP7-14 → 18): school subscription year (01/09 – 31/05), shared token pool with a daily
// per-student spending limit, daily token boost requests and the academic-year lifecycle.
// Contract: BE docs/sprints/sprint_7/fe_contracts/school_subscription_daily_token_and_lifecycle_api_contract.md
// Shapes follow the Java DTOs (dto/school/*), which are more complete than the markdown.
import { axiosClient } from "@/configs/axios.client";
import type { ApiPage, ApiSchool, ApiStudent, EnterprisePackage } from "@/services/school.service";

// ─── Token boost requests ──────────────────────────────────────────────────

export type TokenBoostStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface TokenBoostRequest {
  id: string;
  schoolId: string;
  classroomId: string;
  className: string;
  studentUid: string;
  studentName: string;
  studentCode: string | null;
  requestedTokens: number;
  /** Set on approval (0 when rejected). */
  approvedTokens: number | null;
  reason: string;
  status: TokenBoostStatus;
  reviewedByUid: string | null;
  reviewedByName: string | null;
  reviewNote: string | null;
  /** yyyy-MM-dd; a boost only counts on this day. */
  requestDate: string;
  createdAt: string;
  updatedAt: string | null;
}

/** 100 – 10 000 tokens; reason ≤ 500 characters. */
export interface CreateTokenBoostPayload {
  requestedTokens: number;
  reason: string;
}

export interface ReviewTokenBoostPayload {
  action: "APPROVE" | "REJECT";
  /** ≥ 100; defaults to the requested amount. */
  approvedTokens?: number;
  reviewNote?: string;
}

export const BOOST_MIN_TOKENS = 100;
export const BOOST_MAX_TOKENS = 10_000;

// ─── Policy & lifecycle ────────────────────────────────────────────────────

/**
 * PUT /school-admin/token-policy. `defaultDailyStudentQuota` applies to the whole school; `classroomDailyQuota`
 * overrides one class (`classroomId`) or every class of a grade (`gradeLevel`). Each value ≥ 100.
 */
export interface UpdateTokenPolicyPayload {
  defaultDailyStudentQuota?: number;
  classroomId?: string;
  gradeLevel?: number;
  classroomDailyQuota?: number;
}

export const DAILY_QUOTA_MIN = 100;
export const DEFAULT_DAILY_QUOTA = 1_000;

export interface AcademicYearRolloverPayload {
  /** Start year of the finished school year (2025 = 2025–2026). */
  completedAcademicYear: number;
  deactivateGraduatedGrade12: boolean;
}

export interface AcademicYearRolloverResult {
  schoolId: string;
  completedAcademicYear: number;
  archivedClassroomsCount: number;
  reclaimedTokensToPool: number;
  deactivatedGraduatedStudentsCount: number;
  remainingSchoolTokenPool: number;
}

export type DeactivationReason = "GRADUATED" | "TRANSFERRED_OUT";

export interface RenewSubscriptionPayload {
  packageType: EnterprisePackage;
}

export interface TopUpPayload {
  /** ≥ 1 000. */
  additionalTokens: number;
  note?: string;
}

export const TOP_UP_MIN = 1_000;

// ─── Paging ────────────────────────────────────────────────────────────────

/** `PaginatedResponse` of the boost list; `currentPage` is 0-based there. */
interface BoostPage {
  content: TokenBoostRequest[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

function toPage(page: BoostPage | undefined): ApiPage<TokenBoostRequest> {
  const items = page?.content ?? [];
  return {
    items,
    page: page?.currentPage ?? 0,
    size: page?.pageSize ?? items.length,
    totalElements: page?.totalElements ?? items.length,
    totalPages: page?.totalPages ?? 1,
    hasNext: page?.hasNext ?? false,
    hasPrevious: page?.hasPrevious ?? false,
  };
}

export interface BoostListParams {
  status?: TokenBoostStatus;
  /** 1-based. */
  page?: number;
  limit?: number;
}

// ─── Service ───────────────────────────────────────────────────────────────

export const schoolTokenService = {
  // School student
  requestBoost: async (payload: CreateTokenBoostPayload): Promise<TokenBoostRequest> => {
    const res = await axiosClient.post("/student/token-requests", payload);
    return res.data.data;
  },
  listMyBoosts: async (): Promise<TokenBoostRequest[]> => {
    const res = await axiosClient.get("/student/token-requests");
    return res.data.data ?? [];
  },

  // Teacher (requests of the classes they teach) / School Admin (whole school)
  listBoosts: async (params: BoostListParams = {}): Promise<ApiPage<TokenBoostRequest>> => {
    const res = await axiosClient.get("/teacher/token-requests", { params });
    return toPage(res.data.data);
  },
  reviewBoost: async (id: string, payload: ReviewTokenBoostPayload): Promise<TokenBoostRequest> => {
    const res = await axiosClient.put(`/teacher/token-requests/${id}/review`, payload);
    return res.data.data;
  },

  // School Admin
  updatePolicy: async (payload: UpdateTokenPolicyPayload): Promise<ApiSchool> => {
    const res = await axiosClient.put("/school-admin/token-policy", payload);
    return res.data.data;
  },
  rolloverYear: async (payload: AcademicYearRolloverPayload): Promise<AcademicYearRolloverResult> => {
    const res = await axiosClient.post("/school-admin/academic-year/rollover", payload);
    return res.data.data;
  },
  /** Permanent: the student can no longer sign in. */
  deactivateStudent: async (uid: string, reason: DeactivationReason): Promise<ApiStudent> => {
    const res = await axiosClient.put(`/school-admin/students/${uid}/deactivate`, { reason });
    return res.data.data;
  },

  // System Admin
  /** Only accepted in May; the new package starts on 01/09. */
  renew: async (schoolId: string, payload: RenewSubscriptionPayload): Promise<ApiSchool> => {
    const res = await axiosClient.post(`/admin/schools/${schoolId}/renew`, payload);
    return res.data.data;
  },
  /** From 01/09: switches to the renewed package and carries over 20 % of the remaining pool. */
  activateYear: async (schoolId: string): Promise<ApiSchool> => {
    const res = await axiosClient.post(`/admin/schools/${schoolId}/activate-academic-year`);
    return res.data.data;
  },
  topUp: async (schoolId: string, payload: TopUpPayload): Promise<ApiSchool> => {
    const res = await axiosClient.post(`/admin/schools/${schoolId}/top-up`, payload);
    return res.data.data;
  },
};
