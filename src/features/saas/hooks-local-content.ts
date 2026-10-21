"use client";

// React Query hooks for Sprint 6 local content (src/services/local-content.service.ts).
// Lists load the first 100 rows per kind and filter on the client, like useMyApiClassrooms.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  localContentService,
  type LocalCharacterPayload,
  type LocalContextPayload,
  type LocalDocumentPayload,
  type LocalItem,
  type LocalKind,
  type LocalScope,
  type LocalStatusPayload,
  type UpdateLocalDocumentPayload,
} from "@/services/local-content.service";
import { localQuizService, type CreateLocalQuizPayload } from "@/services/local-quiz.service";
import type { CreateQuestionPayload, UpdateQuestionPayload, UpdateQuizPayload } from "@/services/staff.quiz.service";

const LIST_SIZE = 100;

export const localKeys = {
  all: ["local-content"] as const,
  teacher: (kind: LocalKind) => ["local-content", "teacher", kind] as const,
  item: (kind: LocalKind, id: string) => ["local-content", "item", kind, id] as const,
  school: (kind: LocalKind, scope?: LocalScope) => ["local-content", "school", kind, scope ?? "ALL"] as const,
  student: (kind: LocalKind) => ["local-content", "student", kind] as const,
  studentItem: (kind: LocalKind, id: string) => ["local-content", "student", "item", kind, id] as const,
  documents: (kind: LocalKind, id: string) => ["local-content", "documents", kind, id] as const,
  characterContexts: (id: string) => ["local-content", "character-contexts", id] as const,
  trash: (kind: LocalKind) => ["local-content", "trash", kind] as const,
  contextQuizzes: (contextId: string) => ["local-content", "quizzes", "context", contextId] as const,
  quiz: (quizId: string) => ["local-content", "quizzes", "item", quizId] as const,
  schoolDocuments: (kind: LocalKind, id: string) => ["local-content", "school", "documents", kind, id] as const,
};

export const LOCAL_KINDS: LocalKind[] = ["CONTEXT", "CHARACTER"];

export const LOCAL_SCOPE_LABEL: Record<LocalScope, string> = {
  CLASS_ONLY: "Riêng tôi",
  SCHOOL_WIDE: "Toàn trường",
};

/** Maps the API scope onto the existing source tag colours. */
export const scopeSource = (scope: LocalScope) => (scope === "SCHOOL_WIDE" ? "SCHOOL" : "CLASS") as "SCHOOL" | "CLASS";

/** Context year label, e.g. "40 – 43" or "208 TCN". */
export function localYears(item: Pick<LocalItem, "year" | "startYear" | "endYear" | "isBC">) {
  const fmt = (y: number) => (item.isBC ? `${y} TCN` : String(y));
  if (item.startYear != null && item.endYear != null && item.startYear !== item.endYear) return `${fmt(item.startYear)} – ${fmt(item.endYear)}`;
  const y = item.year ?? item.startYear ?? item.endYear;
  return y == null ? null : fmt(y);
}

// ─── Teacher ───────────────────────────────────────────────────────────────

/** Contexts and characters the teacher can see: their own plus colleagues' school-wide items. */
export function useTeacherLocalContent(enabled = true) {
  const contexts = useQuery({
    queryKey: localKeys.teacher("CONTEXT"),
    queryFn: () => localContentService.list("CONTEXT", { page: 1, size: LIST_SIZE }),
    enabled,
  });
  const characters = useQuery({
    queryKey: localKeys.teacher("CHARACTER"),
    queryFn: () => localContentService.list("CHARACTER", { page: 1, size: LIST_SIZE }),
    enabled,
  });
  return {
    contexts: contexts.data?.items ?? [],
    characters: characters.data?.items ?? [],
    truncated: (contexts.data?.totalElements ?? 0) > LIST_SIZE || (characters.data?.totalElements ?? 0) > LIST_SIZE,
    isLoading: contexts.isLoading || characters.isLoading,
    isError: contexts.isError || characters.isError,
    error: contexts.error ?? characters.error,
    refetch: () => Promise.all([contexts.refetch(), characters.refetch()]),
  };
}

export function useLocalItem(kind: LocalKind, id: string | undefined) {
  return useQuery({
    queryKey: localKeys.item(kind, id ?? ""),
    queryFn: () => localContentService.get(kind, id!),
    enabled: Boolean(id),
    retry: false,
  });
}

export function useLocalContentMutations() {
  const qc = useQueryClient();
  const refresh = (item?: LocalItem) => {
    qc.invalidateQueries({ queryKey: ["local-content", "teacher"] });
    qc.invalidateQueries({ queryKey: ["local-content", "school"] });
    qc.invalidateQueries({ queryKey: ["local-content", "student"] });
    if (item) qc.setQueryData(localKeys.item(item.type, item.id), item);
  };
  return {
    createContext: useMutation({
      mutationFn: (payload: LocalContextPayload) => localContentService.createContext(payload),
      onSuccess: refresh,
    }),
    updateContext: useMutation({
      mutationFn: ({ id, payload }: { id: string; payload: Partial<LocalContextPayload> }) => localContentService.updateContext(id, payload),
      onSuccess: refresh,
    }),
    createCharacter: useMutation({
      mutationFn: (payload: LocalCharacterPayload) => localContentService.createCharacter(payload),
      onSuccess: refresh,
    }),
    updateCharacter: useMutation({
      mutationFn: ({ id, payload }: { id: string; payload: Partial<LocalCharacterPayload> }) => localContentService.updateCharacter(id, payload),
      onSuccess: refresh,
    }),
    publish: useMutation({
      mutationFn: ({ kind, id }: { kind: LocalKind; id: string }) => localContentService.publish(kind, id),
      onSuccess: refresh,
    }),
    setStatus: useMutation({
      mutationFn: ({ kind, id, payload }: { kind: LocalKind; id: string; payload: LocalStatusPayload }) =>
        localContentService.setMyStatus(kind, id, payload),
      onSuccess: refresh,
    }),
    remove: useMutation({
      mutationFn: ({ kind, id }: { kind: LocalKind; id: string }) => localContentService.remove(kind, id),
      onSuccess: (_, { kind, id }) => {
        refresh();
        qc.removeQueries({ queryKey: localKeys.item(kind, id) });
        qc.invalidateQueries({ queryKey: localKeys.trash(kind) });
      },
    }),
  };
}

export function useLocalDocuments(kind: LocalKind, id: string | undefined) {
  return useQuery({
    queryKey: localKeys.documents(kind, id ?? ""),
    queryFn: () => localContentService.listDocuments(kind, id!),
    enabled: Boolean(id),
  });
}

export function useLocalDocumentMutations(kind: LocalKind, id: string) {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: localKeys.documents(kind, id) });
  return {
    add: useMutation({
      mutationFn: (payload: LocalDocumentPayload) => localContentService.addDocument(kind, id, payload),
      onSuccess: refresh,
    }),
    remove: useMutation({
      mutationFn: (docId: string) => localContentService.removeDocument(kind, id, docId),
      onSuccess: refresh,
    }),
    update: useMutation({
      mutationFn: ({ docId, payload }: { docId: string; payload: UpdateLocalDocumentPayload }) =>
        localContentService.updateDocument(kind, id, docId, payload),
      onSuccess: refresh,
    }),
    uploadPdf: useMutation({
      mutationFn: ({ file, title }: { file: File; title?: string }) => localContentService.uploadDocumentPdf(kind, id, file, title),
      onSuccess: refresh,
    }),
  };
}

// ─── Teacher: character ↔ context links ────────────────────────────────────

export function useCharacterContexts(characterId: string | undefined) {
  return useQuery({
    queryKey: localKeys.characterContexts(characterId ?? ""),
    queryFn: () => localContentService.listCharacterContexts(characterId!),
    enabled: Boolean(characterId),
  });
}

export function useCharacterContextLinks(characterId: string) {
  const qc = useQueryClient();
  const refresh = () => {
    qc.invalidateQueries({ queryKey: localKeys.characterContexts(characterId) });
    qc.invalidateQueries({ queryKey: localKeys.item("CHARACTER", characterId) });
  };
  return {
    link: useMutation({ mutationFn: (contextId: string) => localContentService.linkCharacterContext(characterId, contextId), onSuccess: refresh }),
    unlink: useMutation({ mutationFn: (contextId: string) => localContentService.unlinkCharacterContext(characterId, contextId), onSuccess: refresh }),
  };
}

// ─── Teacher: trash ────────────────────────────────────────────────────────

export function useLocalTrash(kind: LocalKind) {
  return useQuery({
    queryKey: localKeys.trash(kind),
    queryFn: () => localContentService.listTrash(kind, { page: 1, size: LIST_SIZE }),
  });
}

export function useLocalTrashMutations() {
  const qc = useQueryClient();
  const refresh = (kind: LocalKind) => {
    qc.invalidateQueries({ queryKey: localKeys.trash(kind) });
    qc.invalidateQueries({ queryKey: ["local-content", "teacher"] });
  };
  return {
    restore: useMutation({
      mutationFn: ({ kind, id }: { kind: LocalKind; id: string }) => localContentService.restore(kind, id),
      onSuccess: (_, { kind }) => refresh(kind),
    }),
    purge: useMutation({
      mutationFn: ({ kind, id }: { kind: LocalKind; id: string }) => localContentService.purge(kind, id),
      onSuccess: (_, { kind }) => refresh(kind),
    }),
  };
}

// ─── Teacher: quizzes of a local context ──────────────────────────────────

export function useContextQuizzes(contextId: string | undefined) {
  return useQuery({
    queryKey: localKeys.contextQuizzes(contextId ?? ""),
    queryFn: () => localQuizService.listForContext(contextId!),
    enabled: Boolean(contextId),
  });
}

export function useLocalQuiz(quizId: string | undefined) {
  return useQuery({
    queryKey: localKeys.quiz(quizId ?? ""),
    queryFn: () => localQuizService.get(quizId!),
    enabled: Boolean(quizId),
    retry: false,
  });
}

export function useLocalQuizMutations() {
  const qc = useQueryClient();
  const refresh = (quizId?: string) => {
    qc.invalidateQueries({ queryKey: ["local-content", "quizzes"] });
    if (quizId) qc.invalidateQueries({ queryKey: localKeys.quiz(quizId) });
  };
  return {
    create: useMutation({
      mutationFn: ({ contextId, payload }: { contextId: string; payload: CreateLocalQuizPayload }) => localQuizService.create(contextId, payload),
      onSuccess: () => refresh(),
    }),
    update: useMutation({
      mutationFn: ({ quizId, payload }: { quizId: string; payload: UpdateQuizPayload }) => localQuizService.update(quizId, payload),
      onSuccess: (q) => refresh(q.quizId),
    }),
    remove: useMutation({ mutationFn: (quizId: string) => localQuizService.remove(quizId), onSuccess: () => refresh() }),
    togglePublish: useMutation({ mutationFn: (quizId: string) => localQuizService.togglePublish(quizId), onSuccess: (q) => refresh(q.quizId) }),
    addQuestion: useMutation({
      mutationFn: ({ quizId, payload }: { quizId: string; payload: CreateQuestionPayload }) => localQuizService.addQuestion(quizId, payload),
      onSuccess: (_, { quizId }) => refresh(quizId),
    }),
    updateQuestion: useMutation({
      mutationFn: ({ quizId, questionId, payload }: { quizId: string; questionId: string; payload: UpdateQuestionPayload }) =>
        localQuizService.updateQuestion(quizId, questionId, payload),
      onSuccess: (_, { quizId }) => refresh(quizId),
    }),
    deleteQuestion: useMutation({
      mutationFn: ({ quizId, questionId }: { quizId: string; questionId: string }) => localQuizService.deleteQuestion(quizId, questionId),
      onSuccess: (_, { quizId }) => refresh(quizId),
    }),
  };
}

// ─── School Admin ──────────────────────────────────────────────────────────

/** Every context and character of the school, any status. */
export function useSchoolLocalContent(enabled = true) {
  const contexts = useQuery({
    queryKey: localKeys.school("CONTEXT"),
    queryFn: () => localContentService.listForSchool("CONTEXT", { page: 1, size: LIST_SIZE }),
    enabled,
  });
  const characters = useQuery({
    queryKey: localKeys.school("CHARACTER"),
    queryFn: () => localContentService.listForSchool("CHARACTER", { page: 1, size: LIST_SIZE }),
    enabled,
  });
  return {
    items: [...(contexts.data?.items ?? []), ...(characters.data?.items ?? [])],
    truncated: (contexts.data?.totalElements ?? 0) > LIST_SIZE || (characters.data?.totalElements ?? 0) > LIST_SIZE,
    isLoading: contexts.isLoading || characters.isLoading,
    isError: contexts.isError || characters.isError,
    error: contexts.error ?? characters.error,
    refetch: () => Promise.all([contexts.refetch(), characters.refetch()]),
  };
}

/** Documents of a teacher's item (School Admin endpoint). */
export function useSchoolLocalDocuments(kind: LocalKind | undefined, id: string | undefined) {
  return useQuery({
    queryKey: localKeys.schoolDocuments(kind ?? "CONTEXT", id ?? ""),
    queryFn: () => localContentService.listDocumentsForSchool(kind!, id!),
    enabled: Boolean(kind && id),
  });
}

export function useSetLocalStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ kind, id, payload }: { kind: LocalKind; id: string; payload: LocalStatusPayload }) =>
      localContentService.setStatus(kind, id, payload),
    onSuccess: (item) => {
      qc.invalidateQueries({ queryKey: localKeys.all });
      qc.setQueryData(localKeys.item(item.type, item.id), item);
    },
  });
}

// ─── Student ───────────────────────────────────────────────────────────────

/** Published contexts and characters of the student's school (first 100 per kind). */
export function useStudentLocalContent(enabled = true) {
  const contexts = useQuery({
    queryKey: localKeys.student("CONTEXT"),
    queryFn: () => localContentService.listPublished("CONTEXT", { page: 1, size: LIST_SIZE }),
    enabled,
  });
  const characters = useQuery({
    queryKey: localKeys.student("CHARACTER"),
    queryFn: () => localContentService.listPublished("CHARACTER", { page: 1, size: LIST_SIZE }),
    enabled,
  });
  return {
    items: [...(contexts.data?.items ?? []), ...(characters.data?.items ?? [])],
    isLoading: contexts.isLoading || characters.isLoading,
    isError: contexts.isError || characters.isError,
    error: contexts.error ?? characters.error,
    refetch: () => Promise.all([contexts.refetch(), characters.refetch()]),
  };
}

/** One published item; 404 when it is not ACTIVE or not of the student's school. */
export function useStudentLocalItem(kind: LocalKind | null, id: string | undefined) {
  return useQuery({
    queryKey: localKeys.studentItem(kind ?? "CONTEXT", id ?? ""),
    queryFn: () => localContentService.getPublished(kind!, id!),
    enabled: Boolean(kind && id),
    retry: false,
  });
}

/** Whether an item belongs on a class page: assigned to that class, or not assigned to any class (older items). */
// BE: SCHOOL_WIDE hien o moi lop; CLASS_ONLY chi hien o lop duoc gan (khong gan lop nao = khong lop nao thay).
export const showsInClass = (item: Pick<LocalItem, "classIds" | "contentScope">, classId: string) =>
  item.contentScope === "SCHOOL_WIDE" || !!item.classIds?.includes(classId);
