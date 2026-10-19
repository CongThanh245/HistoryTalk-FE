"use client";

// React Query hooks cho bai tap (US-SP6-04/05) va hoc sinh trong lop (US-SP6-01).
// Chay hoan toan tren API that (src/services/assignment.service.ts), khong co mock.

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  assignmentService,
  classroomStudentService,
  type ClassroomStudentListParams,
  type CreateAssignmentPayload,
  type StudentAssignmentListParams,
  type SubmitAssignmentPayload,
  type TeacherAssignmentListParams,
  type UpdateAssignmentPayload,
} from "@/services/assignment.service";

export const assignmentKeys = {
  all: ["assignments"] as const,
  byClassroom: (classroomId: string, params: TeacherAssignmentListParams) =>
    ["assignments", "teacher", classroomId, params] as const,
  gradebook: (id: string) => ["assignments", "gradebook", id] as const,
  mine: (params: StudentAssignmentListParams) => ["assignments", "student", params] as const,
  mineDetail: (id: string) => ["assignments", "student", "detail", id] as const,
};

export const rosterKeys = {
  all: (classId: string) => ["classroom-students", classId] as const,
  list: (classId: string, params: ClassroomStudentListParams) => ["classroom-students", classId, "list", params] as const,
  available: (classId: string, params: ClassroomStudentListParams) =>
    ["classroom-students", classId, "available", params] as const,
};

// ─── Teacher ───────────────────────────────────────────────────────────────

export function useClassroomAssignments(classroomId: string | undefined, params: TeacherAssignmentListParams = {}, enabled = true) {
  return useQuery({
    queryKey: assignmentKeys.byClassroom(classroomId ?? "", params),
    queryFn: () => assignmentService.listByClassroom(classroomId!, params),
    enabled: enabled && Boolean(classroomId),
    placeholderData: keepPreviousData,
  });
}

export function useAssignmentGradebook(assignmentId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: assignmentKeys.gradebook(assignmentId ?? ""),
    queryFn: () => assignmentService.getGradebook(assignmentId!),
    enabled: enabled && Boolean(assignmentId),
  });
}

export function useCreateAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAssignmentPayload) => assignmentService.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: assignmentKeys.all }),
  });
}

export function useUpdateAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateAssignmentPayload }) => assignmentService.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: assignmentKeys.all }),
  });
}

export function useCancelAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => assignmentService.cancel(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: assignmentKeys.all }),
  });
}

// ─── Student ───────────────────────────────────────────────────────────────

export function useMyAssignments(params: StudentAssignmentListParams = {}, enabled = true) {
  return useQuery({
    queryKey: assignmentKeys.mine(params),
    queryFn: () => assignmentService.listMine(params),
    enabled,
    placeholderData: keepPreviousData,
  });
}

export function useMyAssignment(assignmentId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: assignmentKeys.mineDetail(assignmentId ?? ""),
    queryFn: () => assignmentService.getMine(assignmentId!),
    enabled: enabled && Boolean(assignmentId),
  });
}

export function useStartAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => assignmentService.start(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: assignmentKeys.all }),
  });
}

export function useSubmitAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload?: SubmitAssignmentPayload }) => assignmentService.submit(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: assignmentKeys.all }),
  });
}

// ─── Classroom students ────────────────────────────────────────────────────

export function useClassroomStudents(classId: string | undefined, params: ClassroomStudentListParams = {}, enabled = true) {
  return useQuery({
    queryKey: rosterKeys.list(classId ?? "", params),
    queryFn: () => classroomStudentService.list(classId!, params),
    enabled: enabled && Boolean(classId),
    placeholderData: keepPreviousData,
  });
}

export function useAvailableStudents(classId: string | undefined, params: ClassroomStudentListParams = {}, enabled = true) {
  return useQuery({
    queryKey: rosterKeys.available(classId ?? "", params),
    queryFn: () => classroomStudentService.listAvailable(classId!, params),
    enabled: enabled && Boolean(classId),
    placeholderData: keepPreviousData,
  });
}

/** Them / xoa / chuyen / import hoc sinh: lam moi roster, si so lop va thong ke. */
export function useRosterMutations(classId: string) {
  const qc = useQueryClient();
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["classroom-students"] });
    void qc.invalidateQueries({ queryKey: ["saas", "classroom"] });
    void qc.invalidateQueries({ queryKey: ["saas", "classrooms"] });
    void qc.invalidateQueries({ queryKey: ["dashboard"] });
  };
  return {
    enroll: useMutation({
      mutationFn: (studentIds: string[]) => classroomStudentService.enroll(classId, studentIds),
      onSuccess: refresh,
    }),
    remove: useMutation({
      mutationFn: (studentId: string) => classroomStudentService.remove(classId, studentId),
      onSuccess: refresh,
    }),
    transfer: useMutation({
      mutationFn: ({ targetClassroomId, studentIds }: { targetClassroomId: string; studentIds: string[] }) =>
        classroomStudentService.transfer(classId, targetClassroomId, studentIds),
      onSuccess: refresh,
    }),
    importCsv: useMutation({
      mutationFn: ({ file }: { file: File }) => classroomStudentService.importCsv(classId, file),
      onSuccess: refresh,
    }),
  };
}
