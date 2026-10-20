// src/services/local-content.service.ts
// Sprint 6 — Lịch sử địa phương: teacher-authored contexts / characters scoped to a school.
// Contract: BE docs/FE-contract/LocalContent_APIContract.md (v3: teachers self-publish, no School Admin approval)
import { axiosClient } from "@/configs/axios.client";
import type { ApiPage } from "@/services/school.service";

// ─── Enums ─────────────────────────────────────────────────────────────────

export type LocalKind = "CONTEXT" | "CHARACTER";
/** CLASS_ONLY = only the author teacher; SCHOOL_WIDE = every teacher of the school (read-only for others). */
export type LocalScope = "CLASS_ONLY" | "SCHOOL_WIDE";
/**
 * Stored by the backend: DRAFT (teacher editing) ⇄ ACTIVE (published by the teacher themself) ⇄ INACTIVE (hidden by
 * the teacher or the School Admin). PENDING_REVIEW only exists on rows submitted before v3.
 */
export type LocalStatus = "DRAFT" | "PENDING_REVIEW" | "ACTIVE" | "INACTIVE";
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
  /** School Admin note from the last status change. */
  reviewNote?: string | null;

  // CONTEXT only
  era?: LocalEra | null;
  category?: LocalCategory | null;
  year?: number | null;
  startYear?: number | null;
  endYear?: number | null;
  isBC?: boolean | null;
  location?: string | null;
  videoUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;

  // CHARACTER only
  title?: string | null;
  personality?: string | null;
  modelUrl?: string | null;
  bornYear?: number | null;
  bornMonth?: number | null;
  bornDay?: number | null;
  isBornBc?: boolean | null;
  deathYear?: number | null;
  deathMonth?: number | null;
  deathDay?: number | null;
  isDeathBc?: boolean | null;
  /** Linked local contexts. */
  contextIds?: string[] | null;

  /** Classrooms the item is assigned to; omitted when none. */
  classIds?: string[] | null;

  createdBy?: LocalAuthor | null;
  approvedBy?: LocalAuthor | null;
  schoolId: string;
  schoolName: string;
  createdAt: string;
  updatedAt: string;
}

/** Hidden after publishing. Old rows without a stored status fall back to `approvedBy`. */
export const isHidden = (item: Pick<LocalItem, "status" | "isPublished" | "approvedBy">) =>
  item.status === "INACTIVE" || (!item.status && !item.isPublished && !!item.approvedBy);

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
  latitude?: number;
  longitude?: number;
  contentScope?: LocalScope;
  /** Replaces the class assignments; an empty list keeps the current ones (backend skips it). */
  classIds?: string[];
  /** Create: defaults to true (published at once), false = draft. Update: true = publish, false = back to draft, omitted = keep. */
  isPublished?: boolean;
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
  /** On update: replaces the links; [] clears them. */
  contextIds?: string[];
  contentScope?: LocalScope;
  /** Replaces the class assignments; an empty list keeps the current ones (backend skips it). */
  classIds?: string[];
  /** Create: defaults to true (published at once), false = draft. Update: true = publish, false = back to draft, omitted = keep. */
  isPublished?: boolean;
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
  status?: LocalStatus;
  /** 1-based. */
  page?: number;
  size?: number;
}

export interface SchoolLocalListParams extends LocalListParams {
  scope?: LocalScope;
}

export interface StudentLocalListParams {
  search?: string;
  /** Only items assigned to this classroom. */
  classId?: string;
  /** 1-based. */
  page?: number;
  size?: number;
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
  /** Partial update; status only changes when `isPublished` is sent. */
  updateContext: async (id: string, payload: Partial<LocalContextPayload>): Promise<LocalItem> => {
    const res = await axiosClient.put(`/teacher/local-contents/contexts/${id}`, payload);
    return res.data.data;
  },
  createCharacter: async (payload: LocalCharacterPayload): Promise<LocalItem> => {
    const res = await axiosClient.post("/teacher/local-contents/characters", payload);
    return res.data.data;
  },
  updateCharacter: async (id: string, payload: Partial<LocalCharacterPayload>): Promise<LocalItem> => {
    const res = await axiosClient.put(`/teacher/local-contents/characters/${id}`, payload);
    return res.data.data;
  },
  /** Publish (→ ACTIVE, `approvedBy` = the teacher), author only. */
  publish: async (kind: LocalKind, id: string): Promise<LocalItem> => {
    const res = await axiosClient.put(`/teacher/local-contents/${segment(kind)}/${id}/submit`);
    return res.data.data;
  },
  /** Author sets their own item to ACTIVE (publish), DRAFT or INACTIVE (hide). */
  setMyStatus: async (kind: LocalKind, id: string, payload: LocalStatusPayload): Promise<LocalItem> => {
    const res = await axiosClient.put(`/teacher/local-contents/${segment(kind)}/${id}/status`, payload);
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
    const res = await axiosClient.post(`/teacher/local-contents/${segment(kind)}/${id}/documents`, payload);
    return res.data.data;
  },
  /** Uploader only. */
  removeDocument: async (kind: LocalKind, id: string, docId: string): Promise<void> => {
    await axiosClient.delete(`/teacher/local-contents/${segment(kind)}/${id}/documents/${docId}`);
  },

  // Teacher: uploads (Sprint 7, US-SP7-19)
  /** Image (PNG/JPG/WebP ≤ 2 MB) to the school storage; returns a public URL for imageUrl. Works before the item exists. */
  uploadImage: async (file: File, onProgress?: (percent: number) => void): Promise<string> => {
    const form = new FormData();
    form.append("file", file);
    const res = await axiosClient.post("/teacher/local-contents/media/upload", form, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (e) => onProgress && e.total && onProgress(Math.round((e.loaded / e.total) * 100)),
    });
    const url = res.data.data?.url;
    if (!url) throw new Error(res.data.message ?? "Tải ảnh thất bại");
    return url;
  },
  /** 3D model (.glb / .gltf, ≤ 100 MB) for a saved character; returns its URL. */
  uploadCharacterModel: async (characterId: string, file: File, onProgress?: (percent: number) => void): Promise<string> => {
    const form = new FormData();
    form.append("file", file);
    const res = await axiosClient.post(`/teacher/local-contents/characters/${characterId}/media/upload-direct`, form, {
      params: { mediaType: "MODEL_3D" },
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 300_000,
      onUploadProgress: (e) => onProgress && e.total && onProgress(Math.round((e.loaded / e.total) * 100)),
    });
    const url = res.data.data?.url ?? res.data.data?.viewUrl;
    if (!url) throw new Error(res.data.message ?? "Tải mô hình 3D thất bại");
    return url;
  },
  /** PDF document for the AI (RAG); the backend extracts the text. `title` defaults to the file name. */
  uploadDocumentPdf: async (kind: LocalKind, id: string, file: File, title?: string): Promise<LocalDocument> => {
    const form = new FormData();
    form.append("file", file);
    if (title?.trim()) form.append("title", title.trim());
    const res = await axiosClient.post(`/teacher/local-contents/${segment(kind)}/${id}/documents/upload-pdf`, form, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 180_000,
    });
    return res.data.data;
  },

  // School Admin: every item of the school, any status.
  listForSchool: async (kind: LocalKind, params: SchoolLocalListParams = {}): Promise<ApiPage<LocalItem>> => {
    const res = await axiosClient.get(`/school-admin/local-contents/${segment(kind)}`, { params: clean(params) });
    return toPage<LocalItem>(res.data.data);
  },
  /** Oversight: ACTIVE = re-activate, DRAFT = send back to the teacher, INACTIVE = hide. `note` is shown to the teacher. */
  setStatus: async (kind: LocalKind, id: string, payload: LocalStatusPayload): Promise<LocalItem> => {
    const res = await axiosClient.put(`/school-admin/local-contents/${segment(kind)}/${id}/status`, payload);
    return res.data.data;
  },
  listDocumentsForSchool: async (kind: LocalKind, id: string): Promise<LocalDocument[]> => {
    const res = await axiosClient.get(`/school-admin/local-contents/${segment(kind)}/${id}/documents`);
    return res.data.data ?? [];
  },

  // School student: ACTIVE items of the school.
  listPublished: async (kind: LocalKind, params: StudentLocalListParams = {}): Promise<ApiPage<LocalItem>> => {
    const res = await axiosClient.get(`/student/local-contents/${segment(kind)}`, { params: clean(params) });
    return toPage<LocalItem>(res.data.data);
  },
  getPublished: async (kind: LocalKind, id: string): Promise<LocalItem> => {
    const res = await axiosClient.get(`/student/local-contents/${segment(kind)}/${id}`);
    return res.data.data;
  },
};
