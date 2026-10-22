import { axiosClient } from "@/configs/axios.client";
import { fromPagination, type ApiPage, type EnterprisePackage, type SchoolStatus } from "@/services/school.service";

/**
 * 5 dashboard theo role (BE: AnalyticsDashboardController, US-SP6-06 → 10).
 * Type bam theo DTO Java thuc te (dto/dashboard/*) — file contract markdown cua
 * sprint 6 mo ta shape khac va KHONG khop voi code.
 */

// ── School admin — GET /school-admin/dashboard ─────────────

export interface SchoolAdminDashboard {
  schoolId: string;
  schoolName: string;
  schoolCode: string;
  // School year subscription (01/09 – 31/05) — Sprint 7
  packageType?: EnterprisePackage | null;
  recommendedStudents?: number | null;
  status?: SchoolStatus | null;
  subscriptionStartDate?: string | null;
  subscriptionEndDate?: string | null;
  renewedForNextYear?: boolean | null;
  nextPackageType?: EnterprisePackage | null;
  totalClassrooms: number;
  totalTeachers: number;
  totalStudents: number;
  totalSchoolTokenQuota: number;
  /** Remaining shared pool. */
  unallocatedTokenQuota: number;
  /** total − remaining = tokens spent out of the pool. */
  allocatedTokens: number;
  tokensUsedByStudents: number;
  /** Sprint 7: tach token giao vien / hoc sinh + top lop dung nhieu nhat. */
  tokensUsedByTeachers?: number;
  tokensUsedTotal?: number;
  studentTokenUsagePercentage?: number;
  teacherTokenUsagePercentage?: number;
  topClassroomsByTokenUsage?: ClassroomTokenUsage[];
  defaultDailyStudentQuota?: number;
  pendingTokenBoostRequests?: number;
  assignmentStats: {
    totalSubmissions: number;
    /** Ti le phan tram 0–100. */
    completedRate: number;
    lateSubmittedRate: number;
    notStartedRate: number;
  } | null;
}

// ── Teacher — GET /teacher/dashboard/classrooms/{classId} ──

export interface TeacherClassroomStudent {
  studentId: string;
  studentCode: string;
  fullName: string;
  /** Daily limit of the class (or the school default), without today's bonus. */
  dailyTokenLimit?: number;
  /** Extra limit approved today through boost requests. */
  dailyBonusTokens?: number;
  dailyTokensUsed?: number;
  /** What the student may still spend today (capped by the school pool). */
  currentTokens: number;
  quizzesAttempted: number;
  averageScorePercentage: number;
  aiMessagesCount: number;
}

export interface TeacherClassroomDashboard {
  classId: string;
  className: string;
  classCode: string;
  gradeLevel: number;
  academicYear: number;
  status?: "ACTIVE" | "INACTIVE" | "ARCHIVED" | string;
  dailyTokenLimit?: number;
  pendingTokenBoostRequests?: number;
  studentCount: number;
  totalAiMessages: number;
  avgAiMessagesPerStudent: number;
  assignmentRates: {
    onTimeRate: number;
    lateRate: number;
    pendingRate: number;
  } | null;
  students: TeacherClassroomStudent[];
}

// ── Student — GET /student/dashboard ───────────────────────

export interface DashboardRecentQuizItem {
  sessionId: string;
  quizTitle: string;
  percentage: number;
  completedAt: string;
}

export interface StudentPersonalDashboard {
  studentId: string;
  studentName: string;
  studentCode: string;
  schoolName: string;
  /** Daily spending limit (class override or school default), without today's bonus. */
  dailyTokenLimit?: number;
  /** Extra limit approved today. */
  dailyBonusTokens?: number;
  /** What the student may still spend today (capped by the school pool). */
  currentTokens: number;
  tokensUsedToday: number;
  totalQuizzesAttempted: number;
  averageScorePercentage: number;
  recentQuizzes: DashboardRecentQuizItem[];
  /** Current class (ACTIVE) and earlier years (ARCHIVED). */
  enrolledClassrooms: {
    classId: string;
    className: string;
    classCode: string;
    academicYear?: number | null;
    status?: string | null;
    teacherName: string | null;
  }[];
  upcomingAssignments: { assignmentId: string; title: string; assignmentType: string; deadline: string }[];
}

// ── Customer — GET /customer/dashboard ─────────────────────

export interface CustomerPersonalDashboard {
  uid: string;
  userName: string;
  email: string;
  currentTier: string;
  currentTokens: number;
  tierExpiresAt: string | null;
  totalQuizzesAttempted: number;
  averageScorePercentage: number;
  eraDistribution: Record<string, number>;
  recentQuizzes: DashboardRecentQuizItem[];
  totalAiMessages: number;
  topCharacters: { characterId: string; characterName: string; messageCount: number }[];
  paymentHistory: { orderCode: number; amount: number; tierName: string; status: string; createdAt: string }[];
}

// ── System admin — GET /admin/dashboard ────────────────────

export interface SystemAdminComprehensiveDashboard {
  jvmHealth: {
    cpuUsagePercentage: number;
    usedMemoryMb: number;
    totalMemoryMb: number;
    freeMemoryMb: number;
    maxMemoryMb: number;
    memoryUsagePercentage: number;
    activeThreadCount: number;
    uptimeSeconds: number;
  } | null;
  tokenSummary: {
    totalTokensB2bAllocated: number;
    totalTokensB2bRemainingInPools?: number;
    totalTokensB2bConsumed?: number;
    totalTokensB2cConsumed: number;
    totalTokensSystemConsumed: number;
  } | null;
  topWrongQuestions: {
    questionId: string;
    quizTitle: string;
    wrongAnswers: number;
    totalAnswers: number;
    wrongRate: number;
  }[];
  platformOverview: {
    totalSchools: number;
    activeSchools?: number;
    expiredSchools?: number;
    totalUsers: number;
    totalQuizzes: number;
    totalRevenue: number;
  } | null;
}

// ── Token analytics (school admin / teacher) ───────────────

export interface ClassroomTokenUsage {
  classroomId: string;
  className: string;
  classCode: string;
  gradeLevel: number;
  academicYear: number;
  status: "ACTIVE" | "ARCHIVED" | "DELETED";
  teacherName: string | null;
  teacherUid: string | null;
  studentCount: number;
  tokensUsedTotal: number;
  tokensUsedToday: number;
  percentageOfSchoolUsage: number;
}

export interface StudentTokenUsage {
  studentId: string;
  studentCode: string | null;
  fullName: string;
  userName: string | null;
  email: string | null;
  tokensUsedTotal: number;
  tokensUsedToday: number;
  dailyTokenLimit: number;
  dailyBonusTokens: number;
  effectiveRemainingToday: number;
  messageCount: number;
  lastActiveAt: string | null;
}

export interface TeacherClassesOverview {
  teacherUid: string;
  teacherName: string;
  totalClassroomsManaged: number;
  totalStudentsManaged: number;
  totalTokensUsedByAllClasses: number;
  classrooms: ClassroomTokenUsage[];
}

export interface ClassroomTokenParams {
  academicYear?: number;
  gradeLevel?: number;
  status?: "ACTIVE" | "ARCHIVED";
  search?: string;
  page?: number;
  size?: number;
  sort?: string;
}

// ── Service ────────────────────────────────────────────────

export const analyticsDashboardService = {
  getSchoolAdminDashboard: async (): Promise<SchoolAdminDashboard> => {
    const res = await axiosClient.get("/school-admin/dashboard");
    return res.data.data;
  },

  getTeacherClassroomDashboard: async (classId: string): Promise<TeacherClassroomDashboard> => {
    const res = await axiosClient.get(`/teacher/dashboard/classrooms/${classId}`);
    const data = res.data.data as TeacherClassroomDashboard;
    return { ...data, students: data.students ?? [] };
  },

  // GET /school-admin/analytics/classrooms — token theo lop (mac dinh nhieu nhat truoc).
  getClassroomTokenUsage: async (params: ClassroomTokenParams = {}): Promise<ApiPage<ClassroomTokenUsage>> => {
    const res = await axiosClient.get("/school-admin/analytics/classrooms", { params });
    return fromPagination<ClassroomTokenUsage>(res.data);
  },

  // GET /school-admin/analytics/classrooms/{id}/students — school admin hoac GV phu trach.
  getStudentTokenUsage: async (
    classroomId: string,
    params: { search?: string; page?: number; size?: number; sort?: string } = {},
  ): Promise<ApiPage<StudentTokenUsage>> => {
    const res = await axiosClient.get(`/school-admin/analytics/classrooms/${classroomId}/students`, { params });
    return fromPagination<StudentTokenUsage>(res.data);
  },

  getTeacherClassesOverview: async (): Promise<TeacherClassesOverview> => {
    const res = await axiosClient.get("/teacher/dashboard/classes-overview");
    const data = res.data.data as TeacherClassesOverview;
    return { ...data, classrooms: data.classrooms ?? [] };
  },

  getStudentDashboard: async (): Promise<StudentPersonalDashboard> => {
    const res = await axiosClient.get("/student/dashboard");
    const data = res.data.data as StudentPersonalDashboard;
    return {
      ...data,
      recentQuizzes: data.recentQuizzes ?? [],
      enrolledClassrooms: data.enrolledClassrooms ?? [],
      upcomingAssignments: data.upcomingAssignments ?? [],
    };
  },

  getCustomerDashboard: async (): Promise<CustomerPersonalDashboard> => {
    const res = await axiosClient.get("/customer/dashboard");
    const data = res.data.data as CustomerPersonalDashboard;
    return {
      ...data,
      eraDistribution: data.eraDistribution ?? {},
      recentQuizzes: data.recentQuizzes ?? [],
      topCharacters: data.topCharacters ?? [],
      paymentHistory: data.paymentHistory ?? [],
    };
  },

  getSystemAdminDashboard: async (): Promise<SystemAdminComprehensiveDashboard> => {
    const res = await axiosClient.get("/admin/dashboard");
    const data = res.data.data as SystemAdminComprehensiveDashboard;
    return { ...data, topWrongQuestions: data.topWrongQuestions ?? [] };
  },
};
