/**
 * Các role người dùng thực tế trong hệ thống HistoryTalk.
 * Phải khớp với giá trị role trả về từ backend (case-sensitive).
 */
export const Role = {
  CUSTOMER: "CUSTOMER",
  CONTENT_ADMIN: "CONTENT_ADMIN",
  SYSTEM_ADMIN: "SYSTEM_ADMIN",
} as const;

export type Role = (typeof Role)[keyof typeof Role];

/** Nhãn hiển thị tiếng Việt theo role */
export const ROLE_LABELS: Record<Role, string> = {
  [Role.CUSTOMER]: "Người dùng",
  [Role.CONTENT_ADMIN]: "Quản trị nội dung",
  [Role.SYSTEM_ADMIN]: "Quản trị hệ thống",
};

/** Kiểm tra role có phải staff (admin) không */
export const isAdminRole = (role: string | undefined): role is Role =>
  role === Role.CONTENT_ADMIN || role === Role.SYSTEM_ADMIN;

export const isContentAdmin = (role: string | undefined): boolean =>
  role === Role.CONTENT_ADMIN;

export const isSystemAdmin = (role: string | undefined): boolean =>
  role === Role.SYSTEM_ADMIN;