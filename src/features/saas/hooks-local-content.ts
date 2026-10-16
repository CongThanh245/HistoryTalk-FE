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
} from "@/services/local-content.service";

const LIST_SIZE = 100;

export const localKeys = {
  all: ["local-content"] as const,
  teacher: (kind: LocalKind) => ["local-content", "teacher", kind] as const,
  item: (kind: LocalKind, id: string) => ["local-content", "item", kind, id] as const,
  school: (kind: LocalKind, scope?: LocalScope) => ["local-content", "school", kind, scope ?? "ALL"] as const,
  student: (kind: LocalKind) => ["local-content", "student", kind] as const,
  documents: (kind: LocalKind, id: string) => ["local-content", "documents", kind, id] as const,
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
    remove: useMutation({
      mutationFn: ({ kind, id }: { kind: LocalKind; id: string }) => localContentService.remove(kind, id),
      onSuccess: (_, { kind, id }) => {
        refresh();
        qc.removeQueries({ queryKey: localKeys.item(kind, id) });
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

/** Published contexts and characters of the student's school. */
export function useStudentLocalContent(enabled = true) {
  const contexts = useQuery({
    queryKey: localKeys.student("CONTEXT"),
    queryFn: () => localContentService.listPublished("CONTEXT"),
    enabled,
  });
  const characters = useQuery({
    queryKey: localKeys.student("CHARACTER"),
    queryFn: () => localContentService.listPublished("CHARACTER"),
    enabled,
  });
  return {
    items: [...(contexts.data ?? []), ...(characters.data ?? [])],
    isLoading: contexts.isLoading || characters.isLoading,
    isError: contexts.isError || characters.isError,
    error: contexts.error ?? characters.error,
    refetch: () => Promise.all([contexts.refetch(), characters.refetch()]),
  };
}
