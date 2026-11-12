import { axiosClient } from "@/configs/axios.client";

// Sprint 9: school pricing, live quote calculator, quote requests and System Admin approval
// (b2b_custom_plan_and_quote_flow_api_contract.md). The /b2b/* endpoints are public.

export type B2bPackage = "ENTERPRISE_SMALL" | "ENTERPRISE_MEDIUM" | "ENTERPRISE_LARGE" | "ENTERPRISE_CUSTOM";
export type B2bQuoteStatus = "PENDING" | "CONTACTED" | "APPROVED" | "REJECTED";

export const B2B_LIMITS = { minStudents: 1, maxStudents: 50_000, minTeachers: 1, maxTeachers: 5_000 } as const;

/** Bounds of the optional plan settings; the stricter of the API contract and the backend DTO validation. */
export const B2B_CUSTOM_LIMITS = {
  minWeeks: 1,
  maxWeeks: 52,
  minDailyTokens: 500,
  maxDailyTokens: 100_000,
  minDaysPerWeek: 1,
  maxDaysPerWeek: 7,
} as const;

export const B2B_PACKAGE_LABELS: Record<B2bPackage, string> = {
  ENTERPRISE_SMALL: "Gói Small",
  ENTERPRISE_MEDIUM: "Gói Medium",
  ENTERPRISE_LARGE: "Gói Large",
  ENTERPRISE_CUSTOM: "Gói tuỳ chỉnh",
};

export const B2B_QUOTE_STATUS_LABELS: Record<B2bQuoteStatus, string> = {
  PENDING: "Chờ liên hệ",
  CONTACTED: "Đã liên hệ",
  APPROVED: "Đã duyệt",
  REJECTED: "Từ chối",
};

export interface B2bDiscountTier {
  minStudents: number;
  /** null: no upper bound. */
  maxStudents: number | null;
  discountPercent: number;
  description: string;
}

/** Price breakdown shared by plans, calculations and quote requests. */
export interface B2bPrice {
  totalTokenPool: number;
  aiTokenCostVnd: number;
  dbAndLmsCostVnd: number;
  subtotalVnd: number;
  discountPercent: number;
  discountAmountVnd: number;
  finalPriceVnd: number;
}

export interface B2bPlan extends B2bPrice {
  packageType: Exclude<B2bPackage, "ENTERPRISE_CUSTOM">;
  displayName: string;
  maxStudents: number;
  maxTeachers: number;
  studentDailyTokenLimit: number;
  teacherDailyTokenLimit: number;
  averageMonthlyCostPerStudentVnd: number;
  popular: boolean;
  highlights: string[];
}

export interface B2bPlanCatalog {
  tokenUnitPriceVnd: number;
  academicWeeksPerYear: number;
  studentDailyTokenLimit: number;
  studentActiveDaysPerWeek: number;
  studentTotalAnnualCostVnd: number;
  teacherDailyTokenLimit: number;
  teacherActiveDaysPerWeek: number;
  teacherTotalAnnualCostVnd: number;
  discountTiers: B2bDiscountTier[];
  plans: B2bPlan[];
}

/** Optional plan settings; the backend falls back to the catalog defaults (35 weeks, 5,000 tokens/day, 4 and 6 days/week). */
export interface B2bPlanSettings {
  academicWeeks?: number;
  studentDailyTokenLimit?: number;
  teacherDailyTokenLimit?: number;
  studentDaysPerWeek?: number;
  teacherDaysPerWeek?: number;
  /** yyyy-MM-dd; send both or neither. Defaults to 01/09 – 31/05 of the current school year. */
  subscriptionStartDate?: string;
  subscriptionEndDate?: string;
}

export interface B2bQuoteInput extends B2bPlanSettings {
  selectedPackage?: B2bPackage;
  numberOfStudents: number;
  numberOfTeachers: number;
  promoCode?: string;
}

export interface B2bQuoteCalculation extends B2bPrice {
  selectedPackage: B2bPackage;
  numberOfStudents: number;
  numberOfTeachers: number;
  academicWeeks: number;
  studentDaysPerWeek: number;
  teacherDaysPerWeek: number;
  studentDailyTokenLimit: number;
  teacherDailyTokenLimit: number;
  studentTokensPerYear: number;
  teacherTokensPerYear: number;
  totalStudentTokens: number;
  totalTeacherTokens: number;
  averageMonthlyCostPerStudentVnd: number;
  /** The promo code that was accepted, or null. */
  promoCodeApplied: string | null;
  subscriptionStartDate: string;
  subscriptionEndDate: string;
}

export interface B2bQuoteRequestInput extends B2bQuoteInput {
  firstName: string;
  lastName: string;
  contactEmail: string;
  contactPhone: string;
  jobTitle: string;
  schoolName: string;
  schoolCode?: string;
  schoolAddress?: string;
  message?: string;
}

export interface B2bQuote extends B2bPrice {
  id: string;
  quoteCode: string;
  firstName: string;
  lastName: string;
  fullName: string;
  contactEmail: string;
  contactPhone: string;
  jobTitle: string;
  schoolName: string;
  schoolCode: string | null;
  schoolAddress: string | null;
  selectedPackage: B2bPackage;
  numberOfStudents: number;
  numberOfTeachers: number;
  /** Null on quotes sent before plan settings existed. */
  academicWeeks: number | null;
  studentDaysPerWeek: number | null;
  teacherDaysPerWeek: number | null;
  studentDailyTokenLimit: number;
  teacherDailyTokenLimit: number;
  subscriptionStartDate: string | null;
  subscriptionEndDate: string | null;
  promoCode: string | null;
  message: string | null;
  status: B2bQuoteStatus;
  adminNote: string | null;
  reviewedByUid: string | null;
  reviewedAt: string | null;
  createdSchoolId: string | null;
  createdSchoolAdminUid: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface B2bQuotePage {
  content: B2bQuote[];
  totalElements: number;
  totalPages: number;
  /** 1-based, as sent by the backend. */
  currentPage: number;
}

export interface B2bQuoteApproval {
  quote: Pick<B2bQuote, "id" | "quoteCode" | "schoolName" | "status" | "createdSchoolId" | "createdSchoolAdminUid">;
  school: {
    id: string;
    name: string;
    schoolCode: string;
    packageType: B2bPackage;
    totalSchoolTokenQuota: number;
    subscriptionStartDate: string;
    subscriptionEndDate: string;
    status: string;
  };
  schoolAdmin: {
    uid: string;
    userName: string;
    email: string;
    fullName: string;
    /** Shown once so the System Admin can hand it over. */
    initialPassword: string;
  };
}

export interface B2bQuoteStatusUpdate {
  status: Extract<B2bQuoteStatus, "CONTACTED" | "REJECTED">;
  /** 0–100; recalculates the discount and final price. */
  customDiscountPercent?: number;
  adminNote?: string;
}

/** Spring pages, or a bare list from older builds. */
function toQuotePage(raw: unknown): B2bQuotePage {
  if (Array.isArray(raw)) return { content: raw, totalElements: raw.length, totalPages: 1, currentPage: 1 };
  const page = (raw ?? {}) as Partial<B2bQuotePage> & { number?: number; page?: number };
  const content = page.content ?? [];
  return {
    content,
    totalElements: page.totalElements ?? content.length,
    totalPages: Math.max(1, page.totalPages ?? 1),
    currentPage: page.currentPage ?? page.page ?? (page.number != null ? page.number + 1 : 1),
  };
}

export const b2bQuoteService = {
  plans: async (): Promise<B2bPlanCatalog> => {
    const res = await axiosClient.get("/b2b/plans");
    return res.data.data;
  },

  calculate: async (input: B2bQuoteInput): Promise<B2bQuoteCalculation> => {
    const res = await axiosClient.post("/b2b/quotes/calculate", input);
    return res.data.data;
  },

  request: async (input: B2bQuoteRequestInput): Promise<B2bQuote> => {
    const res = await axiosClient.post("/b2b/quotes/request", input);
    return res.data.data;
  },

  // ── System Admin ──

  list: async (params: { status?: B2bQuoteStatus; search?: string; page: number; size: number }): Promise<B2bQuotePage> => {
    const res = await axiosClient.get("/admin/b2b-quotes", {
      params: { status: params.status, search: params.search || undefined, page: params.page, size: params.size },
    });
    return toQuotePage(res.data.data);
  },

  get: async (id: string): Promise<B2bQuote> => {
    const res = await axiosClient.get(`/admin/b2b-quotes/${id}`);
    return res.data.data;
  },

  updateStatus: async (id: string, body: B2bQuoteStatusUpdate): Promise<B2bQuote> => {
    const res = await axiosClient.patch(`/admin/b2b-quotes/${id}/status`, body);
    return res.data.data;
  },

  /** Creates the school and its School Admin account. */
  approve: async (id: string): Promise<B2bQuoteApproval> => {
    const res = await axiosClient.post(`/admin/b2b-quotes/${id}/approve`);
    return res.data.data;
  },
};
