// src/services/assignment.service.ts
// Sprint 6 — bai tap (US-SP6-04, US-SP6-05) va hoc sinh trong lop (US-SP6-01).
// Type bam theo DTO Java: dto/assignment/*, dto/classroom/ClassroomStudentResponse...
import { axiosClient } from "@/configs/axios.client";
import { fromPagination, type ApiPage, type Gender, type StudentImportResult } from "@/services/school.service";

// ─── Enums ─────────────────────────────────────────────────────────────────

export type AssignmentType = "CONTEXT_READING" | "AI_CHAT_ROLEPLAY" | "QUIZ_TEST";
export type AssignmentStatus = "ACTIVE" | "CANCELLED" | "ARCHIVED";
export type SubmissionStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "LATE_SUBMITTED"
  | "MISSED"
  | "EXEMPTED";

// ─── Teacher ───────────────────────────────────────────────────────────────

export interface TeacherAssignment {
  assignmentId: string;
  classroomId: string;
  className: string;
  title: string;
  description: string | null;
  assignmentType: AssignmentType;
  targetId: string;
  targetTitle: string | null;
  /** LocalDateTime, khong co mui gio. */
  deadline: string;
  minRequirement: number | null;
  status: AssignmentStatus;
  totalStudents: number;
  submittedCount: number;
  lateSubmittedCount: number;
  inProgressCount: number;
  notStartedCount: number;
  createdAt: string;
}

export interface SubmissionItem {
  submissionId: string;
  studentId: string;
  studentCode: string | null;
  fullName: string;
  email: string | null;
  status: SubmissionStatus;
  /** Diem thang 10 do BE tu cham. */
  score: number | null;
  messageCount: number | null;
  readingDurationSeconds: number | null;
  startedAt: string | null;
  submittedAt: string | null;
}

export interface AssignmentGradebook {
  assignmentId: string;
  classroomId: string;
  className: string;
  title: string;
  description: string | null;
  assignmentType: AssignmentType;
  targetId: string;
  targetTitle: string | null;
  deadline: string;
  minRequirement: number | null;
  status: AssignmentStatus;
  totalAssignedStudents: number;
  totalSubmittedStudents: number;
  submissions: SubmissionItem[];
}

export interface CreateAssignmentPayload {
  classId: string;
  title: string;
  description?: string;
  assignmentType: AssignmentType;
  targetId: string;
  /** "YYYY-MM-DDTHH:mm:ss" (LocalDateTime, phai o tuong lai). */
  deadline: string;
  /** CHAT: so tin nhan toi thieu (mac dinh 5). READING: so giay toi thieu (mac dinh 60). */
  minRequirement?: number;
}

export interface UpdateAssignmentPayload {
  title?: string;
  description?: string;
  deadline?: string;
  minRequirement?: number;
  status?: AssignmentStatus;
}

export interface TeacherAssignmentListParams {
  status?: AssignmentStatus;
  page?: number;
  size?: number;
}

// ─── Student ───────────────────────────────────────────────────────────────

export interface StudentAssignment {
  assignmentId: string;
  classroomId: string;
  className: string;
  title: string;
  description: string | null;
  assignmentType: AssignmentType;
  targetId: string;
  targetTitle: string | null;
  deadline: string;
  minRequirement: number | null;
  submissionStatus: SubmissionStatus;
  score: number | null;
  messageCount: number | null;
  readingDurationSeconds: number | null;
  startedAt: string | null;
  submittedAt: string | null;
  /** Jackson serialize `boolean isExpired` thanh `expired`. */
  expired: boolean;
}

export interface StudentSubmission {
  submissionId: string;
  assignmentId: string;
  status: SubmissionStatus;
  score: number | null;
  messageCount: number | null;
  readingDurationSeconds: number | null;
  startedAt: string | null;
  submittedAt: string | null;
}

export interface StudentAssignmentListParams {
  classroomId?: string;
  status?: SubmissionStatus;
  page?: number;
  size?: number;
}

export interface SubmitAssignmentPayload {
  quizSessionId?: string;
  chatSessionId?: string;
}

// ─── Classroom students ────────────────────────────────────────────────────

export interface ClassroomStudent {
  studentId: string;
  studentCode: string | null;
  userName: string | null;
  fullName: string;
  email: string | null;
  dob: string | null;
  gender: Gender | null;
  phoneNumber: string | null;
  token: number | null;
  joinedAt: string | null;
  status: string | null;
}

/** /available-students tra StudentResponse (hoc sinh cua truong chua thuoc lop). */
export interface AvailableStudent {
  uid: string;
  studentCode: string | null;
  userName: string | null;
  fullName: string;
  email: string | null;
  token: number | null;
  active: boolean | null;
}

export interface BatchEnrollResult {
  classroomId: string;
  className: string;
  totalRequested: number;
  successCount: number;
  alreadyEnrolledCount: number;
  currentStudentCount: number;
  notes: string[];
}

export interface ClassroomStudentListParams {
  search?: string;
  page?: number;
  size?: number;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function mapStudentAssignment(raw: StudentAssignment & { isExpired?: boolean }): StudentAssignment {
  return { ...raw, score: toNumber(raw.score), expired: Boolean(raw.expired ?? raw.isExpired) };
}

function mapSubmission<T extends { score: number | null }>(raw: T): T {
  return { ...raw, score: toNumber(raw.score) };
}

// ─── Service ───────────────────────────────────────────────────────────────

export const assignmentService = {
  // Teacher
  create: async (payload: CreateAssignmentPayload): Promise<TeacherAssignment> => {
    const res = await axiosClient.post("/teacher/assignments", payload);
    return res.data.data;
  },
  listByClassroom: async (
    classroomId: string,
    params: TeacherAssignmentListParams = {},
  ): Promise<ApiPage<TeacherAssignment>> => {
    const res = await axiosClient.get(`/teacher/assignments/classroom/${classroomId}`, { params });
    return fromPagination<TeacherAssignment>(res.data);
  },
  getGradebook: async (assignmentId: string): Promise<AssignmentGradebook> => {
    const res = await axiosClient.get(`/teacher/assignments/${assignmentId}`);
    const data = res.data.data as AssignmentGradebook;
    return { ...data, submissions: (data.submissions ?? []).map(mapSubmission) };
  },
  update: async (assignmentId: string, payload: UpdateAssignmentPayload): Promise<TeacherAssignment> => {
    const res = await axiosClient.put(`/teacher/assignments/${assignmentId}`, payload);
    return res.data.data;
  },
  cancel: async (assignmentId: string): Promise<void> => {
    await axiosClient.delete(`/teacher/assignments/${assignmentId}`);
  },

  // Student
  listMine: async (params: StudentAssignmentListParams = {}): Promise<ApiPage<StudentAssignment>> => {
    const res = await axiosClient.get("/student/assignments", { params });
    const page = fromPagination<StudentAssignment>(res.data);
    return { ...page, items: page.items.map(mapStudentAssignment) };
  },
  getMine: async (assignmentId: string): Promise<StudentAssignment> => {
    const res = await axiosClient.get(`/student/assignments/${assignmentId}`);
    return mapStudentAssignment(res.data.data);
  },
  start: async (assignmentId: string): Promise<StudentSubmission> => {
    const res = await axiosClient.post(`/student/assignments/${assignmentId}/start`);
    return mapSubmission(res.data.data);
  },
  submit: async (assignmentId: string, payload: SubmitAssignmentPayload = {}): Promise<StudentSubmission> => {
    const res = await axiosClient.post(`/student/assignments/${assignmentId}/submit`, payload);
    return mapSubmission(res.data.data);
  },
};

export const classroomStudentService = {
  list: async (classId: string, params: ClassroomStudentListParams = {}): Promise<ApiPage<ClassroomStudent>> => {
    const res = await axiosClient.get(`/classrooms/${classId}/students`, { params });
    return fromPagination<ClassroomStudent>(res.data);
  },
  listAvailable: async (classId: string, params: ClassroomStudentListParams = {}): Promise<ApiPage<AvailableStudent>> => {
    const res = await axiosClient.get(`/classrooms/${classId}/available-students`, { params });
    return fromPagination<AvailableStudent>(res.data);
  },
  enroll: async (classId: string, studentIds: string[]): Promise<BatchEnrollResult> => {
    const res = await axiosClient.post(`/classrooms/${classId}/students/batch`, { studentIds });
    return res.data.data;
  },
  importCsv: async (classId: string, file: File, defaultInitialToken?: number): Promise<StudentImportResult> => {
    const form = new FormData();
    form.append("file", file);
    const res = await axiosClient.post(`/classrooms/${classId}/students/import-csv`, form, {
      params: defaultInitialToken !== undefined ? { defaultInitialToken } : undefined,
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 180_000,
    });
    return res.data.data;
  },
  remove: async (classId: string, studentId: string): Promise<void> => {
    await axiosClient.delete(`/classrooms/${classId}/students/${studentId}`);
  },
  transfer: async (fromClassId: string, targetClassroomId: string, studentIds: string[]): Promise<unknown> => {
    const res = await axiosClient.post(`/classrooms/${fromClassId}/students/transfer`, { targetClassroomId, studentIds });
    return res.data.data;
  },
};
