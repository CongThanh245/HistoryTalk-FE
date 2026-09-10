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

  HISTORICAL_MAP: "/historical-map",

  PROFILE: "/profile",
  PAYMENT: "/payment",

  // ── Staff / Admin ───────────────────────────────────
  STAFF: {
    HOME: "/staff",
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
