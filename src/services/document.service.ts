import { axiosClient, refreshAccessToken } from "@/configs/axios.client";
import { useAuthStore } from "@/store/auth.store";

export type DocumentType = "TEXT" | "PDF";

export type DocumentEntityType = "context" | "character";

export interface ExtractedPdf {
  /** Supabase storage path (not a signed/public URL) — pass straight through to the create-document call. */
  fileUrl: string;
  rawText: string;
  pageCount: number;
}

export interface DocumentPayload {
  title: string;
  content: string;
  fileUrl?: string;
  type?: DocumentType;
}

export interface CreateHistoricalDocumentRequest extends DocumentPayload {
  contextId: string;
}

export interface CreateCharacterDocumentRequest extends DocumentPayload {
  characterId: string;
}

export interface RagDocument {
  id?: string;
  documentId?: string;
  title: string;
  content: string;
  type: DocumentType;
  fileUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  /** Chủ sở hữu tài liệu (từ API /characters/{id}/documents, /historical-contexts/{id}/documents). */
  uploadedByUid?: string;
  uploadedByName?: string;
  /** Chỉ 1 trong 2 field này có giá trị, tuỳ tài liệu gắn với nhân vật hay bối cảnh. */
  characterId?: string;
  contextId?: string;
  deletedAt?: string | null;
}

type RawDocument = Partial<RagDocument> & {
  _id?: string;
  docId?: string;
  id?: string;
  documentId?: string;
  historicalDocumentId?: string;
  characterDocumentId?: string;
  uid?: string;
  userName?: string;
  uploadDate?: string;
  updatedDate?: string;
};

function normalizeDocument(raw: unknown): RagDocument {
  const value = (raw ?? {}) as RawDocument;
  const id =
    value.id ??
    value.documentId ??
    value.docId ??
    value._id ??
    value.historicalDocumentId ??
    value.characterDocumentId;

  return {
    id,
    documentId: id,
    title: value.title ?? "",
    content: value.content ?? "",
    type: value.type ?? "TEXT",
    fileUrl: value.fileUrl,
    createdAt: value.createdAt ?? value.uploadDate,
    updatedAt: value.updatedAt ?? value.updatedDate,
    uploadedByUid: value.uid,
    uploadedByName: value.userName,
    characterId: value.characterId,
    contextId: value.contextId,
    deletedAt: value.deletedAt ?? null,
  };
}

function normalizeDocumentList(raw: unknown): RagDocument[] {
  const envelope = raw as { data?: unknown } | null | undefined;
  const data = envelope?.data ?? raw;
  const contentEnvelope = data as { content?: unknown } | null | undefined;
  const list = Array.isArray(data)
    ? data
    : Array.isArray(contentEnvelope?.content)
      ? contentEnvelope.content
      : [];

  return list.map(normalizeDocument);
}

export const documentService = {
  getAllCharacterDocuments: async (): Promise<RagDocument[]> => {
    const res = await axiosClient.get("/character-documents");
    return normalizeDocumentList(res.data);
  },

  getCharacterDocumentById: async (docId: string): Promise<RagDocument> => {
    const res = await axiosClient.get(`/character-documents/${docId}`);
    return normalizeDocument(res.data.data);
  },

  searchCharacterDocuments: async (keyword: string): Promise<RagDocument[]> => {
    const res = await axiosClient.get("/character-documents/search", {
      params: { keyword },
    });
    return normalizeDocumentList(res.data);
  },

  getHistoricalDocuments: async (contextId: string): Promise<RagDocument[]> => {
    const res = await axiosClient.get(`/historical-documents/context/${contextId}`);
    return normalizeDocumentList(res.data);
  },

  getCharacterDocuments: async (characterId: string): Promise<RagDocument[]> => {
    const res = await axiosClient.get(`/character-documents/character/${characterId}`);
    return normalizeDocumentList(res.data);
  },

  // GET /characters/{id}/documents - public listing (auth optional), dùng cho chat citation
  getPublicCharacterDocuments: async (characterId: string): Promise<RagDocument[]> => {
    const res = await axiosClient.get(`/characters/${characterId}/documents`);
    return normalizeDocumentList(res.data);
  },

  // GET /historical-contexts/{id}/documents - public listing (auth optional), dùng cho chat citation
  getPublicContextDocuments: async (contextId: string): Promise<RagDocument[]> => {
    const res = await axiosClient.get(`/historical-contexts/${contextId}/documents`);
    return normalizeDocumentList(res.data);
  },

  createHistoricalDocument: async (
    data: CreateHistoricalDocumentRequest,
  ): Promise<RagDocument> => {
    const res = await axiosClient.post("/historical-documents", {
      ...data,
      type: data.type ?? "TEXT",
    });
    return normalizeDocument(res.data.data);
  },

  createCharacterDocument: async (
    data: CreateCharacterDocumentRequest,
  ): Promise<RagDocument> => {
    const res = await axiosClient.post("/character-documents", {
      ...data,
      type: data.type ?? "TEXT",
    });
    return normalizeDocument(res.data.data);
  },

  updateHistoricalDocument: async (
    docId: string,
    data: DocumentPayload,
  ): Promise<RagDocument> => {
    const res = await axiosClient.put(`/historical-documents/${docId}`, {
      ...data,
      type: data.type ?? "TEXT",
    });
    return normalizeDocument(res.data.data);
  },

  updateCharacterDocument: async (
    docId: string,
    data: DocumentPayload,
  ): Promise<RagDocument> => {
    const res = await axiosClient.put(`/character-documents/${docId}`, {
      ...data,
      type: data.type ?? "TEXT",
    });
    return normalizeDocument(res.data.data);
  },

  deleteHistoricalDocument: async (docId: string): Promise<void> => {
    await axiosClient.delete(`/historical-documents/${docId}`);
  },

  deleteCharacterDocument: async (docId: string): Promise<void> => {
    await axiosClient.delete(`/character-documents/${docId}`);
  },

  // POST /documents/{docId}/upload-pdf - Upload PDF file for an existing document
  uploadPdf: async (docId: string, file: File): Promise<RagDocument> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await axiosClient.post(`/documents/${docId}/upload-pdf`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      // File scan nhieu trang co the phai OCR o backend (~4-5s/trang, file
      // 100+ trang mat toi 9-10 phut) — vuot xa timeout mac dinh 90s cua
      // axiosClient, can noi rong rieng cho request nay.
      timeout: 15 * 60 * 1000,
    });
    return normalizeDocument(res.data.data);
  },

  // GET /documents/{docId}/pdf-url - Create a signed Supabase URL for an existing PDF document
  getPdfUrl: async (docId: string): Promise<{ url: string; expiresIn: number }> => {
    const res = await axiosClient.get(`/documents/${docId}/pdf-url`);
    return {
      url: res.data.data.url,
      expiresIn: res.data.data.expiresIn,
    };
  },

  // POST /documents/pdf/upload-and-extract - Upload a PDF and extract its text
  // before the document record exists (1-step: file in, {fileUrl, rawText,
  // pageCount} out). The caller pre-fills a content editor with rawText, lets
  // staff review/edit it, then creates the document with that content + fileUrl.
  uploadAndExtractPdf: async (
    file: File,
    entityType?: DocumentEntityType,
    entityId?: string,
  ): Promise<ExtractedPdf> => {
    const formData = new FormData();
    formData.append("file", file);
    if (entityType) formData.append("entityType", entityType);
    if (entityId) formData.append("entityId", entityId);
    const res = await axiosClient.post("/documents/pdf/upload-and-extract", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      // Xem chu thich o uploadPdf ben tren — file scan nhieu trang can OCR
      // co the mat toi 9-10 phut, vuot xa timeout mac dinh 90s.
      timeout: 15 * 60 * 1000,
    });
    return res.data.data;
  },

  // POST /documents/pdf/upload-and-extract/stream - Same as uploadAndExtractPdf
  // but streams per-page progress via SSE (page X/Y) instead of a single
  // silent wait — the BE reports one event per page as it finishes (whether
  // that page's text came straight from the PDF or needed OCR), so a large
  // scan can take a while yet still show incremental progress. Mirrors
  // chat.service.ts's sendMessageStream fetch()+ReadableStream pattern since
  // axios doesn't support reading a streamed response incrementally.
  uploadAndExtractPdfStream: async (
    file: File,
    entityType?: DocumentEntityType,
    entityId?: string,
    onProgress?: (page: number, total: number) => void,
    /** Lets the caller cancel a long OCR run (e.g. a "Hủy" button) — aborting also rejects the in-flight reader.read() loop below with an AbortError. */
    signal?: AbortSignal,
  ): Promise<ExtractedPdf> => {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
    const basePath = process.env.NEXT_PUBLIC_API_BASE_PATH ?? "/api/v1";
    const url = `${baseUrl}${basePath}/documents/pdf/upload-and-extract/stream`;

    const buildFormData = () => {
      const formData = new FormData();
      formData.append("file", file);
      if (entityType) formData.append("entityType", entityType);
      if (entityId) formData.append("entityId", entityId);
      return formData;
    };

    const doFetch = (accessToken?: string) => {
      const headers: Record<string, string> = {};
      if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
      // FormData tu set Content-Type (kem boundary) — khong tu set thu cong.
      return fetch(url, { method: "POST", headers, body: buildFormData(), signal });
    };

    let response = await doFetch(useAuthStore.getState().tokens?.accessToken);

    if (response.status === 401) {
      const newAccessToken = await refreshAccessToken();
      response = await doFetch(newAccessToken);
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const error: Error & { response?: { status: number; data: unknown } } = new Error(
        errorData?.message || `HTTP error! status: ${response.status}`,
      );
      error.response = { status: response.status, data: errorData };
      throw error;
    }

    if (!response.body) {
      throw new Error("ReadableStream not yet supported in this browser.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffered = "";
    let doneReading = false;
    let result: ExtractedPdf | null = null;
    let streamError: Error | null = null;

    while (!doneReading) {
      const { value, done: readerDone } = await reader.read();
      doneReading = readerDone;
      if (!value) continue;

      buffered += decoder.decode(value, { stream: true });
      const lines = buffered.split("\n");
      // Dong cuoi co the bi cat giua chung boi chunk boundary — giu lai cho lan doc sau.
      buffered = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const dataStr = line.slice(line.indexOf(":") + 1).trim();
        if (!dataStr) continue;
        try {
          const parsed = JSON.parse(dataStr);
          if (parsed.type === "progress") {
            onProgress?.(parsed.page, parsed.total);
          } else if (parsed.type === "done") {
            result = parsed.data;
          } else if (parsed.type === "error") {
            streamError = new Error(parsed.message || "Trích xuất PDF thất bại");
          }
        } catch {
          console.warn("Failed to parse SSE data line", line);
        }
      }
    }

    if (streamError) throw streamError;
    if (!result) throw new Error("Không nhận được kết quả trích xuất PDF");
    return result;
  },
};
