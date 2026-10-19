// src/services/school.service.ts
// SaaS B2B (Sprint 5): schools, school accounts, student import, token quota and classrooms.
// Contract: BE docs/sprints/sprint_5/implemented_plan/saas_api_contract_for_fe.md
//           BE docs/sprints/sprint_5/fe_contracts/saas_classroom_and_token_allocation_api_contract.md
import { axiosClient } from "@/configs/axios.client";

// ─── Shared shapes ─────────────────────────────────────────────────────────

/** `/admin/schools` and `/school-admin/teachers` put the rows in `data` and paging in `pagination`. */
export interface ApiPage<T> {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

interface PaginationMeta {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/** Classroom lists use the older `data.content` + `currentPage` shape. */
interface SpringPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export function fromPagination<T>(body: { data?: T[]; pagination?: PaginationMeta }): ApiPage<T> {
  const items = body.data ?? [];
  const p = body.pagination;
  return {
    items,
    page: p?.page ?? 0,
    size: p?.size ?? items.length,
    totalElements: p?.totalElements ?? items.length,
    totalPages: p?.totalPages ?? 1,
    hasNext: p?.hasNext ?? false,
    hasPrevious: p?.hasPrevious ?? false,
  };
}

/** Classroom lists now return `data: T[]` + `pagination`; older builds return a Spring page in `data`. */
function fromAnyPage<T>(body: { data?: T[] | SpringPage<T>; pagination?: PaginationMeta }): ApiPage<T> {
  return Array.isArray(body.data) ? fromPagination({ data: body.data, pagination: body.pagination }) : fromSpringPage(body.data);
}

function fromSpringPage<T>(page: SpringPage<T> | undefined): ApiPage<T> {
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

export interface ListParams {
  search?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
}

// ─── Schools (SYSTEM_ADMIN) ────────────────────────────────────────────────

/** Token pool of one school year (01/09 – 31/05): SMALL 5M, MEDIUM 20M, LARGE 50M. */
export type EnterprisePackage = "ENTERPRISE_SMALL" | "ENTERPRISE_MEDIUM" | "ENTERPRISE_LARGE";
/** EXPIRED = the school year ended (after 31/05) without renewal; the whole school is locked. */
export type SchoolStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "EXPIRED";

export const ENTERPRISE_PACKAGE_TOKENS: Record<EnterprisePackage, number> = {
  ENTERPRISE_SMALL: 5_000_000,
  ENTERPRISE_MEDIUM: 20_000_000,
  ENTERPRISE_LARGE: 50_000_000,
};

/** Recommended number of students per package (BE `EnterprisePackage.recommendedStudents`). */
export const ENTERPRISE_PACKAGE_STUDENTS: Record<EnterprisePackage, number> = {
  ENTERPRISE_SMALL: 350,
  ENTERPRISE_MEDIUM: 1_500,
  ENTERPRISE_LARGE: 3_500,
};

export interface ApiSchool {
  id: string;
  name: string;
  schoolCode: string;
  address: string | null;
  contactEmail: string;
  contactPhone: string | null;
  packageType: EnterprisePackage;
  recommendedStudents?: number | null;
  /** Token pool of the current school year (package + top-ups + 20 % carried over). */
  totalSchoolTokenQuota: number;
  /** What is left in the shared pool; student chats are deducted from here directly. */
  unallocatedTokenQuota: number;
  /** Tokens a student may spend per day unless their class overrides it. */
  defaultDailyStudentQuota?: number | null;
  /** yyyy-MM-dd, 01/09 of the school year. */
  subscriptionStartDate?: string | null;
  /** yyyy-MM-dd, 31/05 of the school year. */
  subscriptionEndDate?: string | null;
  /** Renewed in May; `nextPackageType` starts on 01/09. */
  renewedForNextYear?: boolean | null;
  nextPackageType?: EnterprisePackage | null;
  localHistoryPolicyAccepted: boolean;
  status: SchoolStatus;
  createdAt: string;
}

export interface CreateSchoolPayload {
  name: string;
  /** Leave empty to let the backend derive it from the name + province (e.g. "LHP-HCM"). */
  schoolCode?: string;
  address?: string;
  contactEmail: string;
  contactPhone?: string;
  packageType: EnterprisePackage;
  /** Must be true. */
  localHistoryPolicyAccepted: boolean;
}

export interface CreateSchoolAdminPayload {
  schoolId: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
}

export interface ApiSchoolAdmin {
  uid: string;
  userName: string;
  email: string;
  fullName: string;
  phoneNumber: string | null;
  role: "SCHOOL_ADMIN";
  schoolId: string;
  schoolName: string;
  active: boolean;
  /** Returned once, on creation only. */
  initialPassword: string | null;
  createdAt: string;
}

/** PUT /admin/school-admins/{id} and PUT /school-admin/teachers/{id}: all fields are sent (full replace). */
export interface UpdateStaffAccountPayload {
  fullName: string;
  email: string;
  phoneNumber?: string;
}

/** Returned by every reset-password endpoint; `initialPassword` is shown once. */
export interface ResetPasswordResult {
  uid: string;
  userName: string;
  fullName: string;
  email: string;
  initialPassword: string;
  message: string;
}

/** `active` filters locked (false) / active (true) accounts; omit for all. */
export interface AccountListParams extends ListParams {
  active?: boolean;
}

// ─── Teachers (SCHOOL_ADMIN) ───────────────────────────────────────────────

export interface ApiTeacher {
  uid: string;
  userName: string;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  active: boolean;
  /** Returned once, on creation only. */
  initialPassword: string | null;
  createdAt: string;
}

export interface CreateTeacherPayload {
  fullName: string;
  email: string;
  phoneNumber?: string;
}

// ─── Students import & token quota (SCHOOL_ADMIN) ──────────────────────────

export interface ImportedStudentAccount {
  uid: string;
  studentCode: string;
  userName: string;
  fullName: string;
  email: string;
  /** Always 0 now that students spend from the shared pool. */
  allocatedToken: number;
  /** Plain text, returned once so the School Admin can print the credential sheet. */
  initialPassword: string;
}

export interface StudentImportError {
  rowNumber: number;
  studentCode: string | null;
  field: string | null;
  message: string;
}

export interface StudentImportResult {
  totalRows: number;
  successCount: number;
  failureCount: number;
  totalTokensAllocated: number;
  remainingSchoolTokens: number;
  successfulAccounts: ImportedStudentAccount[];
  errors: StudentImportError[];
}

export type Gender = "MALE" | "FEMALE" | "OTHER";

export interface ApiStudent {
  uid: string;
  studentCode: string;
  userName: string;
  fullName: string;
  email: string;
  /** yyyy-MM-dd */
  dob: string | null;
  gender: Gender | null;
  phoneNumber: string | null;
  /** Legacy wallet field; students now spend from the school pool within a daily limit. */
  token: number;
  active: boolean;
  schoolId: string;
  schoolName: string;
  createdAt: string;
  updatedAt: string | null;
}

/** PUT /school-admin/students/{id} (full replace; fullName required). */
export interface UpdateStudentPayload {
  fullName: string;
  dob?: string | null;
  gender?: Gender | null;
  phoneNumber?: string | null;
  email?: string | null;
}

/** @deprecated Sprint 7 uses a shared pool; per-student allocation tokens are lost at the next daily reset. */
export interface AllocateTokensPayload {
  studentIds: string[];
  /** Tokens given to EACH student. */
  tokenAmount: number;
}

export interface AllocateTokensResult {
  schoolId: string;
  totalTokensAllocated: number;
  affectedStudentCount: number;
  tokenAmountPerStudent: number;
  remainingSchoolTokens: number;
  message: string;
}

/** Header expected by `POST /school-admin/students/import-excel`. */
export const STUDENT_IMPORT_CSV_HEADER =
  "student_code,full_name,email,dob,gender,phone_number,password,additional_token";

export interface SchoolTokenQuota {
  schoolId: string;
  schoolName: string;
  schoolCode: string;
  packageType: EnterprisePackage;
  totalSchoolTokenQuota: number;
  /** Remaining shared pool. */
  unallocatedTokenQuota: number;
  /** total − remaining: tokens already spent (or handed out under the old allocation flow). */
  allocatedTokenQuota: number;
  usagePercentage: number;
}

// ─── Classrooms (SCHOOL_ADMIN / TEACHER / SCHOOL_STUDENT) ──────────────────

export type ClassroomStatus = "ACTIVE" | "INACTIVE" | "ARCHIVED";

export interface ApiClassroomTeacher {
  uid: string;
  userName?: string;
  fullName: string;
  email?: string | null;
  phoneNumber?: string | null;
}

export interface ApiClassroom {
  id: string;
  schoolId?: string;
  schoolName?: string;
  schoolCode?: string;
  className: string;
  /** e.g. "CVA-10A1-2026", generated by the backend. */
  classCode: string;
  gradeLevel: number;
  academicYear: number;
  status: ClassroomStatus;
  description?: string | null;
  /**
   * Tokens one student of the class may spend per day. The backend falls back to the school default when the class
   * has no limit of its own; 0 = reset to the school default.
   */
  dailyTokenQuota?: number | null;
  teacher?: ApiClassroomTeacher | null;
  studentCount: number;
  createdAt: string;
  updatedAt?: string | null;
}

export interface CreateClassroomPayload {
  className: string;
  gradeLevel: number;
  academicYear: number;
  teacherId?: string;
  description?: string;
  /** Own daily limit per student (≥ 0); omitted = keep / school default, 0 = back to the school default. */
  dailyTokenQuota?: number;
}

/** Only the School Admin may change `teacherId`. */
export type UpdateClassroomPayload = Partial<CreateClassroomPayload> & { status?: ClassroomStatus };

export interface ClassroomListParams {
  search?: string;
  gradeLevel?: number;
  academicYear?: number;
  page?: number;
  size?: number;
  /** Spring sort, e.g. "className,asc". */
  sort?: string;
}

// ─── Service ───────────────────────────────────────────────────────────────

export const schoolService = {
  // System Admin
  listSchools: async (params: ListParams = {}): Promise<ApiPage<ApiSchool>> => {
    const res = await axiosClient.get("/admin/schools", { params });
    return fromPagination<ApiSchool>(res.data);
  },
  getSchool: async (id: string): Promise<ApiSchool> => {
    const res = await axiosClient.get(`/admin/schools/${id}`);
    return res.data.data;
  },
  createSchool: async (payload: CreateSchoolPayload): Promise<ApiSchool> => {
    const res = await axiosClient.post("/admin/schools", {
      ...payload,
      schoolCode: payload.schoolCode?.trim() || null,
    });
    return res.data.data;
  },
  createSchoolAdmin: async (payload: CreateSchoolAdminPayload): Promise<ApiSchoolAdmin> => {
    const res = await axiosClient.post("/admin/school-admins", payload);
    return res.data.data;
  },
  /** sortBy: fullName | userName | email | createdAt */
  listSchoolAdmins: async (schoolId: string, params: AccountListParams = {}): Promise<ApiPage<ApiSchoolAdmin>> => {
    const res = await axiosClient.get(`/admin/schools/${schoolId}/school-admins`, { params });
    return fromPagination<ApiSchoolAdmin>(res.data);
  },
  updateSchoolAdmin: async (id: string, payload: UpdateStaffAccountPayload): Promise<ApiSchoolAdmin> => {
    const res = await axiosClient.put(`/admin/school-admins/${id}`, payload);
    return res.data.data;
  },
  setSchoolAdminActive: async (id: string, active: boolean): Promise<ApiSchoolAdmin> => {
    const res = await axiosClient.put(`/admin/school-admins/${id}/status`, { active });
    return res.data.data;
  },
  deleteSchoolAdmin: async (id: string): Promise<void> => {
    await axiosClient.delete(`/admin/school-admins/${id}`);
  },
  resetSchoolAdminPassword: async (id: string): Promise<ResetPasswordResult> => {
    const res = await axiosClient.post(`/admin/school-admins/${id}/reset-password`);
    return res.data.data;
  },

  // School Admin
  getTokenQuota: async (): Promise<SchoolTokenQuota> => {
    const res = await axiosClient.get("/school-admin/token-quota");
    return res.data.data;
  },
  /** sortBy: fullName | userName | email | createdAt */
  listTeachers: async (params: AccountListParams = {}): Promise<ApiPage<ApiTeacher>> => {
    const res = await axiosClient.get("/school-admin/teachers", { params });
    return fromPagination<ApiTeacher>(res.data);
  },
  createTeacher: async (payload: CreateTeacherPayload): Promise<ApiTeacher> => {
    const res = await axiosClient.post("/school-admin/teachers", payload);
    return res.data.data;
  },
  setTeacherActive: async (id: string, active: boolean): Promise<ApiTeacher> => {
    const res = await axiosClient.put(`/school-admin/teachers/${id}/status`, { active });
    return res.data.data;
  },
  updateTeacher: async (id: string, payload: UpdateStaffAccountPayload): Promise<ApiTeacher> => {
    const res = await axiosClient.put(`/school-admin/teachers/${id}`, payload);
    return res.data.data;
  },
  deleteTeacher: async (id: string): Promise<void> => {
    await axiosClient.delete(`/school-admin/teachers/${id}`);
  },
  resetTeacherPassword: async (id: string): Promise<ResetPasswordResult> => {
    const res = await axiosClient.post(`/school-admin/teachers/${id}/reset-password`);
    return res.data.data;
  },

  // Students
  /** sortBy: studentCode | fullName | userName | email | token | createdAt */
  listStudents: async (params: AccountListParams = {}): Promise<ApiPage<ApiStudent>> => {
    const res = await axiosClient.get("/school-admin/students", { params });
    return fromPagination<ApiStudent>(res.data);
  },
  getStudent: async (id: string): Promise<ApiStudent> => {
    const res = await axiosClient.get(`/school-admin/students/${id}`);
    return res.data.data;
  },
  updateStudent: async (id: string, payload: UpdateStudentPayload): Promise<ApiStudent> => {
    const res = await axiosClient.put(`/school-admin/students/${id}`, payload);
    return res.data.data;
  },
  setStudentActive: async (id: string, active: boolean): Promise<ApiStudent> => {
    const res = await axiosClient.put(`/school-admin/students/${id}/status`, { active });
    return res.data.data;
  },
  deleteStudent: async (id: string): Promise<void> => {
    await axiosClient.delete(`/school-admin/students/${id}`);
  },
  /** Resets to the default `{studentCode}@2026`. */
  resetStudentPassword: async (id: string): Promise<ResetPasswordResult> => {
    const res = await axiosClient.post(`/school-admin/students/${id}/reset-password`);
    return res.data.data;
  },
  /**
   * @deprecated Sprint 7: students spend from the shared pool within a daily limit. The backend still moves
   * tokens out of the pool here, but the wallet is overwritten at the next daily reset, so the tokens are lost.
   */
  allocateTokens: async (payload: AllocateTokensPayload): Promise<AllocateTokensResult> => {
    const res = await axiosClient.put("/school-admin/students/token-allocation", payload);
    return res.data.data;
  },
  /** CSV template served by the backend (UTF-8 with BOM for Excel). */
  downloadStudentTemplate: async (): Promise<Blob> => {
    const res = await axiosClient.get("/school-admin/students/template", { responseType: "blob" });
    return res.data;
  },
  /**
   * Always sends `defaultInitialToken=0`: without it the backend gives every new student 10 000 tokens taken
   * out of the shared pool, which the daily-limit model then throws away.
   */
  importStudents: async (file: File): Promise<StudentImportResult> => {
    const form = new FormData();
    form.append("file", file);
    const res = await axiosClient.post("/school-admin/students/import-excel", form, {
      headers: { "Content-Type": "multipart/form-data" },
      params: { defaultInitialToken: 0 },
      timeout: 180_000,
    });
    return res.data.data;
  },

  // Classrooms
  listSchoolClassrooms: async (params: ClassroomListParams = {}): Promise<ApiPage<ApiClassroom>> => {
    const res = await axiosClient.get("/school-admin/classrooms", { params });
    return fromAnyPage<ApiClassroom>(res.data);
  },
  listTeacherClassrooms: async (
    params: Pick<ClassroomListParams, "academicYear" | "page" | "size"> = {},
  ): Promise<ApiPage<ApiClassroom>> => {
    const res = await axiosClient.get("/teacher/classrooms", { params });
    return fromAnyPage<ApiClassroom>(res.data);
  },
  listStudentClassrooms: async (): Promise<ApiClassroom[]> => {
    const res = await axiosClient.get("/student/classrooms");
    return res.data.data ?? [];
  },
  getClassroom: async (id: string): Promise<ApiClassroom> => {
    const res = await axiosClient.get(`/classrooms/${id}`);
    return res.data.data;
  },
  createClassroom: async (payload: CreateClassroomPayload): Promise<ApiClassroom> => {
    const res = await axiosClient.post("/classrooms", payload);
    return res.data.data;
  },
  updateClassroom: async (id: string, payload: UpdateClassroomPayload): Promise<ApiClassroom> => {
    const res = await axiosClient.put(`/classrooms/${id}`, payload);
    return res.data.data;
  },
  deleteClassroom: async (id: string): Promise<void> => {
    await axiosClient.delete(`/classrooms/${id}`);
  },
};
