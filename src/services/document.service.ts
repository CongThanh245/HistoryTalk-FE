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

export const documentService = {
  createHistoricalDocument: async (
    data: CreateHistoricalDocumentRequest,
  ): Promise<RagDocument> => {
    const res = await axiosClient.post("/historical-documents", {
      ...data,
      type: data.type ?? "TEXT",
    });
    return res.data.data;
  },

  createCharacterDocument: async (
    data: CreateCharacterDocumentRequest,
  ): Promise<RagDocument> => {
    const res = await axiosClient.post("/character-documents", {
      ...data,
      type: data.type ?? "TEXT",
    });
    return res.data.data;
  },
};
