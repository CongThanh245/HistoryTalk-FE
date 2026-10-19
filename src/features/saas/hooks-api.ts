"use client";

// React Query hooks for the Sprint 5 SaaS endpoints (src/services/school.service.ts).
// The screens they back run on the real API only (no mock fallback).

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { stripErrorCode } from "@/lib/utils/api-error";
import {
  schoolService,
  type ClassroomListParams,
  type CreateClassroomPayload,
  type CreateSchoolAdminPayload,
  type CreateSchoolPayload,
  type CreateTeacherPayload,
  type AccountListParams,
  type ListParams,
  type UpdateClassroomPayload,
  type UpdateStaffAccountPayload,
  type UpdateStudentPayload,
} from "@/services/school.service";

/** Backend message (`response.data.message`) or a Vietnamese fallback. */
export function apiErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === "object" && error !== null && "response" in error) {
    const data = (error as { response?: { data?: { message?: string; errors?: Record<string, string> } } }).response?.data;
    const fieldError = data?.errors ? Object.values(data.errors)[0] : undefined;
    const message = fieldError ?? data?.message;
    return message ? stripErrorCode(message) : fallback;
  }
  return fallback;
}

/** HTTP status of an axios error, if any (409 = duplicate email / school code / class name). */
export function apiErrorStatus(error: unknown): number | undefined {
  if (typeof error === "object" && error !== null && "response" in error) {
    return (error as { response?: { status?: number } }).response?.status;
  }
  return undefined;
}

export const saasKeys = {
  schools: (params: ListParams) => ["saas", "schools", params] as const,
  school: (id: string) => ["saas", "school", id] as const,
  schoolAdmins: (schoolId: string, params: AccountListParams) => ["saas", "school-admins", schoolId, params] as const,
  teachers: (params: AccountListParams) => ["saas", "teachers", params] as const,
  students: (params: AccountListParams) => ["saas", "students", params] as const,
  student: (id: string) => ["saas", "student", id] as const,
  quota: ["saas", "token-quota"] as const,
  schoolClassrooms: (params: ClassroomListParams) => ["saas", "classrooms", "school", params] as const,
  teacherClassrooms: (params: ClassroomListParams) => ["saas", "classrooms", "teacher", params] as const,
  studentClassrooms: ["saas", "classrooms", "student"] as const,
  classroom: (id: string) => ["saas", "classroom", id] as const,
};

// ─── System Admin ──────────────────────────────────────────────────────────

export function useApiSchools(params: ListParams, enabled = true) {
  return useQuery({
    queryKey: saasKeys.schools(params),
    queryFn: () => schoolService.listSchools(params),
    enabled,
    placeholderData: keepPreviousData,
  });
}

export function useApiSchool(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: saasKeys.school(id ?? ""),
    queryFn: () => schoolService.getSchool(id!),
    enabled: enabled && Boolean(id),
  });
}

export function useCreateApiSchool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSchoolPayload) => schoolService.createSchool(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["saas", "schools"] }),
  });
}

export function useCreateApiSchoolAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSchoolAdminPayload) => schoolService.createSchoolAdmin(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["saas", "school-admins"] }),
  });
}

// ─── School Admin ──────────────────────────────────────────────────────────

export function useApiTokenQuota(enabled = true) {
  return useQuery({
    queryKey: saasKeys.quota,
    queryFn: schoolService.getTokenQuota,
    enabled,
  });
}

export function useApiTeachers(params: AccountListParams, enabled = true) {
  return useQuery({
    queryKey: saasKeys.teachers(params),
    queryFn: () => schoolService.listTeachers(params),
    enabled,
    placeholderData: keepPreviousData,
  });
}

export function useCreateApiTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTeacherPayload) => schoolService.createTeacher(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["saas", "teachers"] }),
  });
}

export function useSetApiTeacherActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => schoolService.setTeacherActive(id, active),
    onSuccess: (teacher) => {
      qc.invalidateQueries({ queryKey: ["saas", "teachers"] });
      toast.success(teacher.active ? "Đã mở khóa tài khoản giáo viên" : "Đã khóa tài khoản giáo viên");
    },
    onError: (error) => toast.error(apiErrorMessage(error, "Không cập nhật được trạng thái. Vui lòng thử lại.")),
  });
}

export function useImportApiStudents() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ file }: { file: File }) => schoolService.importStudents(file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: saasKeys.quota });
      qc.invalidateQueries({ queryKey: ["saas", "students"] });
    },
  });
}

// ─── Classrooms ────────────────────────────────────────────────────────────

export function useApiSchoolClassrooms(params: ClassroomListParams, enabled = true) {
  return useQuery({
    queryKey: saasKeys.schoolClassrooms(params),
    queryFn: () => schoolService.listSchoolClassrooms(params),
    enabled,
    placeholderData: keepPreviousData,
  });
}

export function useApiTeacherClassrooms(params: ClassroomListParams = {}, enabled = true) {
  return useQuery({
    queryKey: saasKeys.teacherClassrooms(params),
    queryFn: () => schoolService.listTeacherClassrooms(params),
    enabled,
  });
}

export function useApiStudentClassrooms(enabled = true) {
  return useQuery({
    queryKey: saasKeys.studentClassrooms,
    queryFn: schoolService.listStudentClassrooms,
    enabled,
  });
}

export function useApiClassroom(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: saasKeys.classroom(id ?? ""),
    queryFn: () => schoolService.getClassroom(id!),
    enabled: enabled && Boolean(id),
  });
}

export function useCreateApiClassroom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateClassroomPayload) => schoolService.createClassroom(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["saas", "classrooms"] }),
  });
}

export function useUpdateApiClassroom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateClassroomPayload }) =>
      schoolService.updateClassroom(id, payload),
    onSuccess: (room) => {
      qc.invalidateQueries({ queryKey: ["saas", "classrooms"] });
      qc.setQueryData(saasKeys.classroom(room.id), room);
    },
  });
}

export function useDeleteApiClassroom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => schoolService.deleteClassroom(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["saas", "classrooms"] }),
  });
}

/**
 * Classes of the signed-in teacher (`GET /teacher/classrooms`, first 100) or school student
 * (`GET /student/classrooms`). Other roles get an empty, idle result.
 */
export function useMyApiClassrooms(role: string | null | undefined) {
  const isTeacher = role === "TEACHER";
  const isStudent = role === "SCHOOL_STUDENT";
  const teacher = useApiTeacherClassrooms({ page: 0, size: 100 }, isTeacher);
  const student = useApiStudentClassrooms(isStudent);
  const query = isTeacher ? teacher : student;
  const classes = (isTeacher ? teacher.data?.items : isStudent ? student.data : undefined) ?? [];
  return {
    classes,
    /** More classes exist than the first page (teachers only). */
    truncated: isTeacher && (teacher.data?.totalElements ?? 0) > classes.length,
    isLoading: (isTeacher || isStudent) && query.isLoading,
    isError: (isTeacher || isStudent) && query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

// ─── Account lifecycle (Sprint 5: update / lock / delete / reset password) ──
// Mutations only refresh the lists; screens show their own toasts and the one-time password dialog.

export function useApiSchoolAdmins(schoolId: string | undefined, params: AccountListParams, enabled = true) {
  return useQuery({
    queryKey: saasKeys.schoolAdmins(schoolId ?? "", params),
    queryFn: () => schoolService.listSchoolAdmins(schoolId!, params),
    enabled: enabled && Boolean(schoolId),
    placeholderData: keepPreviousData,
  });
}

export function useSchoolAdminMutations() {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: ["saas", "school-admins"] });
  return {
    update: useMutation({
      mutationFn: ({ id, payload }: { id: string; payload: UpdateStaffAccountPayload }) => schoolService.updateSchoolAdmin(id, payload),
      onSuccess: refresh,
    }),
    setActive: useMutation({
      mutationFn: ({ id, active }: { id: string; active: boolean }) => schoolService.setSchoolAdminActive(id, active),
      onSuccess: refresh,
    }),
    remove: useMutation({ mutationFn: (id: string) => schoolService.deleteSchoolAdmin(id), onSuccess: refresh }),
    resetPassword: useMutation({ mutationFn: (id: string) => schoolService.resetSchoolAdminPassword(id) }),
  };
}

export function useTeacherMutations() {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: ["saas", "teachers"] });
  return {
    update: useMutation({
      mutationFn: ({ id, payload }: { id: string; payload: UpdateStaffAccountPayload }) => schoolService.updateTeacher(id, payload),
      onSuccess: refresh,
    }),
    remove: useMutation({
      mutationFn: (id: string) => schoolService.deleteTeacher(id),
      // A deleted teacher may have been assigned to classes.
      onSuccess: () => {
        refresh();
        qc.invalidateQueries({ queryKey: ["saas", "classrooms"] });
      },
    }),
    resetPassword: useMutation({ mutationFn: (id: string) => schoolService.resetTeacherPassword(id) }),
  };
}

export function useApiStudents(params: AccountListParams, enabled = true) {
  return useQuery({
    queryKey: saasKeys.students(params),
    queryFn: () => schoolService.listStudents(params),
    enabled,
    placeholderData: keepPreviousData,
  });
}

export function useApiStudent(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: saasKeys.student(id ?? ""),
    queryFn: () => schoolService.getStudent(id!),
    enabled: enabled && Boolean(id),
  });
}

export function useStudentMutations() {
  const qc = useQueryClient();
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["saas", "students"] });
    qc.invalidateQueries({ queryKey: ["saas", "student"] });
  };
  return {
    update: useMutation({
      mutationFn: ({ id, payload }: { id: string; payload: UpdateStudentPayload }) => schoolService.updateStudent(id, payload),
      onSuccess: refresh,
    }),
    setActive: useMutation({
      mutationFn: ({ id, active }: { id: string; active: boolean }) => schoolService.setStudentActive(id, active),
      onSuccess: refresh,
    }),
    remove: useMutation({ mutationFn: (id: string) => schoolService.deleteStudent(id), onSuccess: refresh }),
    resetPassword: useMutation({ mutationFn: (id: string) => schoolService.resetStudentPassword(id) }),
  };
}
