/**
 * Các role người dùng thực tế trong hệ thống HistoryTalk.
 * Phải khớp với giá trị role trả về từ backend (case-sensitive).
 */
export const Role = {
  CUSTOMER: "CUSTOMER",
  CONTENT_ADMIN: "CONTENT_ADMIN",
  SYSTEM_ADMIN: "SYSTEM_ADMIN",
  // SaaS B2B (gói trường học)
  SCHOOL_ADMIN: "SCHOOL_ADMIN",
  TEACHER: "TEACHER",
  SCHOOL_STUDENT: "SCHOOL_STUDENT",
} as const;

export type Role = (typeof Role)[keyof typeof Role];

/** Nhãn hiển thị tiếng Việt theo role */
export const ROLE_LABELS: Record<Role, string> = {
  [Role.CUSTOMER]: "Người dùng",
  [Role.CONTENT_ADMIN]: "Quản trị nội dung",
  [Role.SYSTEM_ADMIN]: "Quản trị hệ thống",
  [Role.SCHOOL_ADMIN]: "Quản trị trường",
  [Role.TEACHER]: "Giáo viên",
  [Role.SCHOOL_STUDENT]: "Học sinh",
};

/** Kiểm tra role có phải staff (admin) không */
export const isAdminRole = (role: string | undefined): role is Role =>
  role === Role.CONTENT_ADMIN || role === Role.SYSTEM_ADMIN;

export const isContentAdmin = (role: string | undefined): boolean =>
  role === Role.CONTENT_ADMIN;

export const isSystemAdmin = (role: string | undefined): boolean =>
  role === Role.SYSTEM_ADMIN;

export const isSchoolAdmin = (role: string | undefined): boolean =>
  role === Role.SCHOOL_ADMIN;

export const isTeacher = (role: string | undefined): boolean =>
  role === Role.TEACHER;

export const isSchoolStudent = (role: string | undefined): boolean =>
  role === Role.SCHOOL_STUDENT;

/** Teachers and school students belong to a class (Role Matrix row 8). */
export const isClassMember = (role: string | undefined): boolean =>
  role === Role.TEACHER || role === Role.SCHOOL_STUDENT;

/** Only B2C customers buy or upgrade plans; school accounts get their token quota from the school. */
export const canPurchasePlans = (role: string | undefined): boolean =>
  !role || role === Role.CUSTOMER;

/**
 * Where each role lands after login and when it opens a page it may not use.
 * Keep in sync with the inline auth script in src/app/layout.tsx.
 */
export const ROLE_HOME: Record<Role, string> = {
  [Role.CUSTOMER]: "/home",
  [Role.SCHOOL_STUDENT]: "/home",
  [Role.TEACHER]: "/teaching",
  [Role.SCHOOL_ADMIN]: "/school",
  [Role.CONTENT_ADMIN]: "/staff",
  [Role.SYSTEM_ADMIN]: "/staff/admin",
};

export const getRoleHome = (role: string | undefined): string =>
  (role && ROLE_HOME[role as Role]) || "/home";
