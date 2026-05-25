import { axiosClient } from "@/configs/axios.client";

export type DocumentType = "TEXT";

export interface DocumentPayload {
  title: string;
  content: string;
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
  createdAt?: string;
  updatedAt?: string;
}

type RawDocument = Partial<RagDocument> & {
  _id?: string;
  docId?: string;
  id?: string;
  documentId?: string;
  historicalDocumentId?: string;
  characterDocumentId?: string;
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
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
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
  getHistoricalDocuments: async (contextId: string): Promise<RagDocument[]> => {
    const res = await axiosClient.get(`/historical-documents/context/${contextId}`);
    return normalizeDocumentList(res.data);
  },

  getCharacterDocuments: async (characterId: string): Promise<RagDocument[]> => {
    const res = await axiosClient.get(`/character-documents/character/${characterId}`);
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
};
