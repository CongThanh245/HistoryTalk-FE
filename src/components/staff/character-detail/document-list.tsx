"use client";

import * as React from "react";
import {
  Eye,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RagDocument } from "@/services/document.service";

interface DocumentListProps {
  documents: RagDocument[];
  isLoadingDocuments: boolean;
  isEditing: boolean;
  draftDocumentId?: string;
  getDocumentId: (document: RagDocument) => string | undefined;
  selectDocument: (document: RagDocument) => void;
  setDocumentDetailOpen: (open: boolean) => void;
  onDeleteDocument?: (docId: string) => void;
  isDeleteDocumentPending: boolean;
  onUploadDocumentPdf?: (docId: string, file: File) => Promise<void>;
  isUploadDocumentPdfPending: boolean;
  onGetDocumentPdfUrl?: (docId: string) => Promise<{ url: string; expiresIn: number }>;
  isGetDocumentPdfUrlPending: boolean;
  setUploadTargetDocId: (id: string | null) => void;
  setUploadDialogOpen: (open: boolean) => void;
  setViewerLoading: (loading: boolean) => void;
  setViewerOpen: (open: boolean) => void;
  setViewerUrl: (url: string | null) => void;
  clearDocumentDraft: () => void;
}

export function DocumentList({
  documents,
  isLoadingDocuments,
  isEditing,
  draftDocumentId,
  getDocumentId,
  selectDocument,
  setDocumentDetailOpen,
  onDeleteDocument,
  isDeleteDocumentPending,
  onUploadDocumentPdf,
  isUploadDocumentPdfPending,
  onGetDocumentPdfUrl,
  isGetDocumentPdfUrlPending,
  setUploadTargetDocId,
  setUploadDialogOpen,
  setViewerLoading,
  setViewerOpen,
  setViewerUrl,
  clearDocumentDraft,
}: DocumentListProps) {
  if (isLoadingDocuments) {
    return <p className="text-xs text-content-muted">Đang tải tài liệu...</p>;
  }

  if (!documents.length) {
    return <p className="text-xs text-content-muted">Chưa có tài liệu nào.</p>;
  }

  return (
    <div className="space-y-2">
      {documents.map((document, index) => {
        const documentId = getDocumentId(document);
        const selected = !!documentId && draftDocumentId === documentId;

        return (
          <div
            key={documentId ?? `character-document-${index}`}
            className={`flex items-start gap-2 rounded-md border p-2 ${
              selected
                ? "border-[rgba(59,130,246,0.45)] bg-[rgba(59,130,246,0.08)]"
                : "border-card-light-border bg-white/35"
            }`}
          >
            <button
              type="button"
              className="min-w-0 flex-1 text-left cursor-pointer"
              onClick={() => {
                selectDocument(document);
                setDocumentDetailOpen(true);
              }}
              title="Xem nội dung tài liệu này"
            >
              <p className="truncate text-sm font-semibold text-content-heading">
                {document.title || "Tài liệu chưa đặt tên"}
              </p>
              <p className="mt-0.5 line-clamp-2 text-xs text-content-muted">
                {document.content || "Chưa có nội dung"}
              </p>
            </button>
            <div className="flex items-center gap-1">
              {onGetDocumentPdfUrl && !!document.fileUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="shrink-0 rounded-full text-accent-gold hover:bg-(--accent-gold)/15"
                  disabled={isGetDocumentPdfUrlPending}
                  onClick={async () => {
                    if (!documentId) return;
                    setViewerLoading(true);
                    setViewerOpen(true);
                    try {
                      const result = await onGetDocumentPdfUrl(documentId);
                      if (result.url) {
                        setViewerUrl(result.url);
                      }
                    } catch {
                      setViewerUrl(null);
                    } finally {
                      setViewerLoading(false);
                    }
                  }}
                  title="Xem PDF"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              )}
              {onUploadDocumentPdf && !document.fileUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="shrink-0 rounded-full text-accent-blue hover:bg-(--accent-blue)/15"
                  disabled={isUploadDocumentPdfPending}
                  onClick={() => {
                    if (documentId) {
                      setUploadTargetDocId(documentId);
                      setUploadDialogOpen(true);
                    }
                  }}
                  title="Upload PDF"
                >
                  <Upload className="h-4 w-4" />
                </Button>
              )}
              {onDeleteDocument && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="shrink-0 rounded-full text-accent-danger hover:bg-(--accent-danger)/15"
                  disabled={!isEditing || isDeleteDocumentPending}
                  onClick={() => {
                    if (!documentId) return;
                    onDeleteDocument(documentId);
                    if (draftDocumentId === documentId) {
                      clearDocumentDraft();
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
