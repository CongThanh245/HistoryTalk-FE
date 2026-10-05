/**
 * Tập trung tất cả các route path của ứng dụng.
 * Dùng ROUTES thay vì hardcode string "/home", "/login", v.v.
 *
 * @example
 * import { ROUTES } from "@/constants/routes";
 * router.push(ROUTES.HOME);
 * router.push(ROUTES.CHAT(characterId));
 */
export const ROUTES = {
  // ── Public / Marketing ─────────────────────────────
  LANDING: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  FORGOT_PASSWORD: "/forgot-password",

  // ── App (authenticated user) ────────────────────────
  HOME: "/home",
  CHARACTERS: "/characters",
  CHARACTER_DETAIL: (id: string) => `/characters/${id}`,

  CHAT: (characterId: string) => `/chat/${characterId}`,
  CHAT_HISTORY: "/chat-history",

  EVENTS: "/events",
  EVENT_DETAIL: (id: string) => `/events/${id}`,

  QUIZ: "/quiz",
  QUIZ_DETAIL: (id: string) => `/quiz/${id}`,

  HISTORICAL_MAP: "/map",

  PROFILE: "/profile",
  PAYMENT: "/payment",

  // ── Lớp học (Teacher + School Student) ────────────────
  CLASSES: "/classes",
  CLASS_DETAIL: (classId: string) => `/classes/${classId}`,

  // ── Giáo viên: dashboard, bài tập, lịch sử địa phương ──
  TEACHING: {
    HOME: "/teaching",
    ASSIGNMENTS: "/teaching/assignments",
    ASSIGNMENT_NEW: "/teaching/assignments/new",
    ASSIGNMENT_DETAIL: (id: string) => `/teaching/assignments/${id}`,
    LOCAL: "/teaching/local",
    LOCAL_NEW: (kind: "CONTEXT" | "CHARACTER" | "QUIZ") => `/teaching/local/new?kind=${kind}`,
    LOCAL_EDIT: (id: string) => `/teaching/local/${id}`,
  },

  // ── Học sinh: bài được giao, bảng điểm (bảng điểm cũng mở cho Customer) ──
  MY_ASSIGNMENTS: "/assignments",
  MY_ASSIGNMENT_DETAIL: (id: string) => `/assignments/${id}`,
  GRADES: "/grades",

  // ── School Admin ────────────────────────────────────
  SCHOOL: {
    HOME: "/school",
    CONTENT: "/school/content",
    CLASSES: "/school/classes",
    CLASS_DETAIL: (classId: string) => `/school/classes/${classId}`,
    TEACHERS: "/school/teachers",
    STUDENTS: "/school/students",
    TOKENS: "/school/tokens",
    MAP: "/school/map",
  },

  // ── Staff / Admin ───────────────────────────────────
  STAFF: {
    HOME: "/staff",
    MAP: "/staff/map",
    CHARACTERS: "/staff/characters",
    CONTEXTS: "/staff/contexts",
    QUIZZES: "/staff/quizzes",
    QUESTS: "/staff/quests",
    DOCUMENTS: "/staff/documents",
    TRASH: "/staff/trash",
    ADMIN: {
      HOME: "/staff/admin",
      MAP: "/staff/admin/map",
      ACCOUNTS: {
        CUSTOMER: "/staff/admin/accounts/customer",
        CONTENT_ADMIN: "/staff/admin/accounts/content-admin",
        SYSTEM_ADMIN: "/staff/admin/accounts/system-admin",
      },
      SCHOOLS: "/staff/admin/schools",
      SCHOOL_DETAIL: (schoolId: string) => `/staff/admin/schools/${schoolId}`,
      SUBSCRIPTIONS: "/staff/admin/subscriptions",
      PAYMENT_HISTORY: "/staff/admin/payment/history",
    },
  },
} as const;

/** Cookie keys dùng cho auth middleware */
export const AUTH_COOKIE_KEYS = {
  TOKEN: "auth-token",
  ROLE: "auth-role",
} as const;
