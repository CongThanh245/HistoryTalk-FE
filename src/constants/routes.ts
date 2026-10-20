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
  /** Bản đồ lớp: only the class & school content of the viewer's school (Teacher + School Student). */
  CLASS_MAP: "/map/class",

  PROFILE: "/profile",
  PAYMENT: "/payment",

  // ── Lớp học (Teacher + School Student) ────────────────
  CLASSES: "/classes",
  CLASS_DETAIL: (classId: string) => `/classes/${classId}`,
  /** Kho tư liệu: class + school content for the class workspace. */
  CLASS_MATERIALS: "/classes/materials",
  CLASS_MATERIAL_DETAIL: (kind: "CONTEXT" | "CHARACTER", id: string) => `/classes/materials/${kind.toLowerCase()}/${id}`,

  // ── Giáo viên: dashboard, bài tập, kho tư liệu ──
  TEACHING: {
    HOME: "/teaching",
    ASSIGNMENTS: "/teaching/assignments",
    ASSIGNMENT_NEW: "/teaching/assignments/new",
    ASSIGNMENT_DETAIL: (id: string) => `/teaching/assignments/${id}`,
    LOCAL: "/teaching/local",
    LOCAL_NEW: (kind: "CONTEXT" | "CHARACTER") => `/teaching/local/new?kind=${kind}`,
    /** `kind` is required for API-backed contexts / characters (separate endpoints); mock quizzes omit it. */
    LOCAL_EDIT: (id: string, kind?: "CONTEXT" | "CHARACTER") => `/teaching/local/${id}${kind ? `?kind=${kind}` : ""}`,
    /** Teacher's trash of local contexts / characters. */
    LOCAL_TRASH: "/teaching/local/trash",
    /** Question editor of a teacher-authored quiz of a local context. */
    LOCAL_QUIZ: (quizId: string) => `/teaching/local/quizzes/${quizId}`,
    /** Daily token boost requests of the teacher's students (Sprint 7). */
    TOKEN_REQUESTS: "/teaching/token-requests",
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
      ACCOUNTS: {
        CUSTOMER: "/staff/admin/accounts/customer",
        CONTENT_ADMIN: "/staff/admin/accounts/content-admin",
        SYSTEM_ADMIN: "/staff/admin/accounts/system-admin",
      },
      SCHOOLS: "/staff/admin/schools",
      SCHOOL_NEW: "/staff/admin/schools/new",
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
