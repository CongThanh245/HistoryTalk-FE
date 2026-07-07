import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  documentService,
  type CreateCharacterDocumentRequest,
  type CreateHistoricalDocumentRequest,
  type DocumentPayload,
} from "@/services/document.service";
import { toast } from "sonner";
import { queryKeys } from "@/shared/query-key";

function getErrorMessage(error: unknown, fallback: string) {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error
  ) {
    const response = (error as { response?: { data?: { message?: string } } })
      .response;
    return response?.data?.message ?? fallback;
  }

  return fallback;
}

export function useHistoricalDocuments(contextId?: string) {
  return useQuery({
    queryKey: queryKeys.documents.historicalByContext(contextId || ""),
    queryFn: () => documentService.getHistoricalDocuments(contextId!),
    enabled: !!contextId,
  });
}

export function useCharacterDocuments(characterId?: string) {
  return useQuery({
    queryKey: queryKeys.documents.characterByCharacter(characterId || ""),
    queryFn: () => documentService.getCharacterDocuments(characterId!),
    enabled: !!characterId,
  });
}

// Public listing (auth optional) — dùng để hiển thị nguồn tài liệu trong chat
export function usePublicCharacterDocuments(characterId?: string) {
  return useQuery({
    queryKey: queryKeys.documents.publicByCharacter(characterId || ""),
    queryFn: () => documentService.getPublicCharacterDocuments(characterId!),
    enabled: !!characterId,
    staleTime: 1000 * 60 * 5,
  });
}

export function usePublicContextDocuments(contextId?: string) {
  return useQuery({
    queryKey: queryKeys.documents.publicByContext(contextId || ""),
    queryFn: () => documentService.getPublicContextDocuments(contextId!),
    enabled: !!contextId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useAllCharacterDocuments() {
  return useQuery({
    queryKey: queryKeys.documents.characterAll,
    queryFn: () => documentService.getAllCharacterDocuments(),
  });
}

export function useCharacterDocument(docId?: string) {
  return useQuery({
    queryKey: queryKeys.documents.characterDetail(docId || ""),
    queryFn: () => documentService.getCharacterDocumentById(docId!),
    enabled: !!docId,
  });
}

export function useSearchCharacterDocuments(keyword?: string) {
  const q = keyword?.trim() ?? "";

  return useQuery({
    queryKey: queryKeys.documents.characterSearch(q),
    queryFn: () => documentService.searchCharacterDocuments(q),
    enabled: !!q,
  });
}

export function useCreateHistoricalDocument() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateHistoricalDocumentRequest) =>
      documentService.createHistoricalDocument(data),
    onSuccess: (_doc, data) => {
      qc.invalidateQueries({
        queryKey: queryKeys.documents.historicalByContext(data.contextId),
      });
      toast.success("Đã import tài liệu cho bối cảnh");
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Import tài liệu thất bại"));
    },
  });
}

export function useCreateCharacterDocument() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCharacterDocumentRequest) =>
      documentService.createCharacterDocument(data),
    onSuccess: (_doc, data) => {
      qc.invalidateQueries({ queryKey: queryKeys.documents.characterAll });
      qc.invalidateQueries({
        queryKey: queryKeys.documents.characterByCharacter(data.characterId),
      });
      toast.success("Đã import tài liệu cho nhân vật");
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Import tài liệu thất bại"));
    },
  });
}

export function useUpdateHistoricalDocument(contextId?: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ docId, data }: { docId: string; data: DocumentPayload }) =>
      documentService.updateHistoricalDocument(docId, data),
    onSuccess: () => {
      if (contextId) {
        qc.invalidateQueries({
          queryKey: queryKeys.documents.historicalByContext(contextId),
        });
      }
      toast.success("Đã cập nhật tài liệu");
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Cập nhật tài liệu thất bại"));
    },
  });
}

export function useUpdateCharacterDocument(characterId?: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ docId, data }: { docId: string; data: DocumentPayload }) =>
      documentService.updateCharacterDocument(docId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.documents.characterAll });
      if (characterId) {
        qc.invalidateQueries({
          queryKey: queryKeys.documents.characterByCharacter(characterId),
        });
      }
      toast.success("Đã cập nhật tài liệu");
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Cập nhật tài liệu thất bại"));
    },
  });
}

export function useDeleteHistoricalDocument(contextId?: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (docId: string) => documentService.deleteHistoricalDocument(docId),
    onSuccess: () => {
      if (contextId) {
        qc.invalidateQueries({
          queryKey: queryKeys.documents.historicalByContext(contextId),
        });
      }
      toast.success("Đã xóa tài liệu");
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Xóa tài liệu thất bại"));
    },
  });
}

export function useDeleteCharacterDocument(characterId?: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (docId: string) => documentService.deleteCharacterDocument(docId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.documents.characterAll });
      if (characterId) {
        qc.invalidateQueries({
          queryKey: queryKeys.documents.characterByCharacter(characterId),
        });
      }
      toast.success("Đã xóa tài liệu");
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Xóa tài liệu thất bại"));
    },
  });
}

// POST /documents/{docId}/upload-pdf - Upload PDF file for an existing document
export function useUploadDocumentPdf() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ docId, file }: { docId: string; file: File }) =>
      documentService.uploadPdf(docId, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.documents.all });
      toast.success("Đã upload PDF thành công");
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Upload PDF thất bại"));
    },
  });
}

// GET /documents/{docId}/pdf-url - Create a signed Supabase URL for downloading PDF
export function useGetDocumentPdfUrl() {
  return useMutation({
    mutationFn: (docId: string) => documentService.getPdfUrl(docId),
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Không thể lấy link tải PDF"));
    },
  });
}
