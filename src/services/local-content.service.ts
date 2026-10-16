// src/services/local-content.service.ts
// Sprint 6 — Lịch sử địa phương: teacher-authored contexts / characters scoped to a school.
// Contract: BE docs/FE-contract/LocalContent_APIContract.md (v2, with document APIs)
import { axiosClient } from "@/configs/axios.client";
import type { ApiPage } from "@/services/school.service";

// ─── Enums ─────────────────────────────────────────────────────────────────

export type LocalKind = "CONTEXT" | "CHARACTER";
/** CLASS_ONLY = only the author teacher; SCHOOL_WIDE = every teacher of the school (read-only for others). */
export type LocalScope = "CLASS_ONLY" | "SCHOOL_WIDE";
/**
 * Derived by the backend: ACTIVE when published, DRAFT otherwise. Setting INACTIVE only unpublishes,
 * so a hidden item reads back as DRAFT with `approvedBy` kept — see `isHidden`.
 */
export type LocalStatus = "DRAFT" | "ACTIVE" | "INACTIVE";
export type LocalEra = "ANCIENT" | "MEDIEVAL" | "MODERN" | "CONTEMPORARY";
export type LocalCategory = "WAR" | "POLITICS" | "CULTURE" | "REVOLUTION";
export type LocalDocumentType = "TEXT" | "PDF" | "URL";

// ─── Shapes ────────────────────────────────────────────────────────────────

export interface LocalAuthor {
  uid: string;
  userName: string;
  fullName: string;
}

export interface LocalItem {
  /** contextId or characterId */
  id: string;
  type: LocalKind;
  name: string;
  /** Context description, or character background. */
  description: string;
  imageUrl?: string | null;
  status: LocalStatus;
  isPublished: boolean;
  contentScope: LocalScope;

  // CONTEXT only
  era?: LocalEra | null;
  category?: LocalCategory | null;
  year?: number | null;
  startYear?: number | null;
  endYear?: number | null;
  isBC?: boolean | null;
  location?: string | null;
  videoUrl?: string | null;

  // CHARACTER only (birth / death years are accepted on write but not returned)
  title?: string | null;
  personality?: string | null;
  modelUrl?: string | null;

  createdBy?: LocalAuthor | null;
  approvedBy?: LocalAuthor | null;
  schoolId: string;
  schoolName: string;
  createdAt: string;
  updatedAt: string;
}

/** Unpublished after an approval (School Admin "ẩn"): the backend keeps `approvedBy` for the audit trail. */
export const isHidden = (item: Pick<LocalItem, "isPublished" | "approvedBy">) => !item.isPublished && !!item.approvedBy;

export interface LocalContextPayload {
  name: string;
  description: string;
  era?: LocalEra;
  category?: LocalCategory;
  year?: number;
  startYear?: number;
  endYear?: number;
  isBC?: boolean;
  location?: string;
  imageUrl?: string;
  videoUrl?: string;
  contentScope?: LocalScope;
}

export interface LocalCharacterPayload {
  name: string;
  title?: string;
  background: string;
  personality?: string;
  imageUrl?: string;
  modelUrl?: string;
  bornYear?: number;
  isBornBc?: boolean;
  deathYear?: number;
  isDeathBc?: boolean;
  /** Create only. */
  contextIds?: string[];
  contentScope?: LocalScope;
}

export interface LocalStatusPayload {
  status: LocalStatus;
  note?: string;
}

export interface LocalDocument {
  docId: string;
  /** Id of the owning context or character. */
  contextId: string;
  uid: string | null;
  userName: string | null;
  title: string;
  content: string;
  fileUrl: string | null;
  type: LocalDocumentType;
  uploadDate: string;
  updatedDate: string | null;
}

export interface LocalDocumentPayload {
  title: string;
  /** At least 10 characters. */
  content: string;
  fileUrl?: string;
  type?: LocalDocumentType;
}

export interface LocalListParams {
  search?: string;
  /** 1-based. */
  page?: number;
  size?: number;
}

export interface SchoolLocalListParams extends LocalListParams {
  scope?: LocalScope;
}

interface SpringPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

function toPage<T>(page: SpringPage<T> | undefined): ApiPage<T> {
  const items = page?.content ?? [];
  return {
    items,
    page: page?.currentPage ?? 1,
    size: page?.pageSize ?? items.length,
    totalElements: page?.totalElements ?? items.length,
    totalPages: page?.totalPages ?? 1,
    hasNext: page?.hasNext ?? false,
    hasPrevious: page?.hasPrevious ?? false,
  };
}

const segment = (kind: LocalKind) => (kind === "CONTEXT" ? "contexts" : "characters");
const clean = <T extends object>(params: T) =>
  Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== "")) as Partial<T>;

// ─── Service ───────────────────────────────────────────────────────────────

export const localContentService = {
  // Teacher: mine (any scope) + SCHOOL_WIDE items of colleagues.
  list: async (kind: LocalKind, params: LocalListParams = {}): Promise<ApiPage<LocalItem>> => {
    const res = await axiosClient.get(`/teacher/local-contents/${segment(kind)}`, { params: clean(params) });
    return toPage<LocalItem>(res.data.data);
  },
  get: async (kind: LocalKind, id: string): Promise<LocalItem> => {
    const res = await axiosClient.get(`/teacher/local-contents/${segment(kind)}/${id}`);
    return res.data.data;
  },
  createContext: async (payload: LocalContextPayload): Promise<LocalItem> => {
    const res = await axiosClient.post("/teacher/local-contents/contexts", payload);
    return res.data.data;
  },
  /** Partial update; changing `contentScope` sends the item back to DRAFT. */
  updateContext: async (id: string, payload: Partial<LocalContextPayload>): Promise<LocalItem> => {
    const res = await axiosClient.put(`/teacher/local-contents/contexts/${id}`, payload);
    return res.data.data;
  },
  createCharacter: async (payload: LocalCharacterPayload): Promise<LocalItem> => {
    const res = await axiosClient.post("/teacher/local-contents/characters", payload);
    return res.data.data;
  },
  updateCharacter: async (id: string, payload: Partial<Omit<LocalCharacterPayload, "contextIds">>): Promise<LocalItem> => {
    const res = await axiosClient.put(`/teacher/local-contents/characters/${id}`, payload);
    return res.data.data;
  },
  /** Soft delete, author only. */
  remove: async (kind: LocalKind, id: string): Promise<void> => {
    await axiosClient.delete(`/teacher/local-contents/${segment(kind)}/${id}`);
  },

  // Teacher: RAG documents attached to a context / character.
  listDocuments: async (kind: LocalKind, id: string): Promise<LocalDocument[]> => {
    const res = await axiosClient.get(`/teacher/local-contents/${segment(kind)}/${id}/documents`);
    return res.data.data ?? [];
  },
  addDocument: async (kind: LocalKind, id: string, payload: LocalDocumentPayload): Promise<LocalDocument> => {
    // The request DTO still validates `contextId` as required, even for characters; the path id is what is used.
    const res = await axiosClient.post(`/teacher/local-contents/${segment(kind)}/${id}/documents`, { ...payload, contextId: id });
    return res.data.data;
  },
  /** Uploader only. */
  removeDocument: async (kind: LocalKind, id: string, docId: string): Promise<void> => {
    await axiosClient.delete(`/teacher/local-contents/${segment(kind)}/${id}/documents/${docId}`);
  },

  // School Admin: every item of the school, any status.
  listForSchool: async (kind: LocalKind, params: SchoolLocalListParams = {}): Promise<ApiPage<LocalItem>> => {
    const res = await axiosClient.get(`/school-admin/local-contents/${segment(kind)}`, { params: clean(params) });
    return toPage<LocalItem>(res.data.data);
  },
  /** ACTIVE = publish (school takes responsibility), DRAFT = send back, INACTIVE = hide. */
  setStatus: async (kind: LocalKind, id: string, payload: LocalStatusPayload): Promise<LocalItem> => {
    const res = await axiosClient.put(`/school-admin/local-contents/${segment(kind)}/${id}/status`, payload);
    return res.data.data;
  },

  // School student: published items of the school (no paging).
  listPublished: async (kind: LocalKind): Promise<LocalItem[]> => {
    const res = await axiosClient.get(`/student/local-contents/${segment(kind)}`);
    return res.data.data ?? [];
  },
};
