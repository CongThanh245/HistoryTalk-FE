import { axiosClient } from "@/configs/axios.client";

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
  totalClassrooms: number;
  totalTeachers: number;
  totalStudents: number;
  totalSchoolTokenQuota: number;
  unallocatedTokenQuota: number;
  allocatedTokens: number;
  tokensUsedByStudents: number;
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
  currentTokens: number;
  tokensUsedToday: number;
  totalQuizzesAttempted: number;
  averageScorePercentage: number;
  recentQuizzes: DashboardRecentQuizItem[];
  enrolledClassrooms: { classId: string; className: string; classCode: string; teacherName: string | null }[];
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
    totalUsers: number;
    totalQuizzes: number;
    totalRevenue: number;
  } | null;
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
