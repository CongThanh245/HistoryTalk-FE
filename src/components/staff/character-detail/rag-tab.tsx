"use client";

import * as React from "react";
import {
  ScrollText,
  Pencil,
  Eye,
  Trash2,
  File,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { TabsContent } from "@/components/ui/tabs";
import { NewDocumentPanel } from "@/components/staff/new-document-panel";
import { StaffDocumentDetailDialog } from "@/components/staff/staff-document-detail-dialog";
import { toast } from "sonner";
import { DocumentList } from "./document-list";
import type { RagTabProps } from "./types";

export function RagTab({
  mode,
  draft,
  set,
  isEditing,
  documents,
  isLoadingDocuments,
  onDeleteDocument,
  isDeleteDocumentPending,
  onUploadDocumentPdf,
  isUploadDocumentPdfPending,
  onGetDocumentPdfUrl,
  isGetDocumentPdfUrlPending,
  onCreateTextDocument,
  isCreateTextDocumentPending,
  onCreatePdfDocument,
  isCreatePdfDocumentPending,
  getDocumentId,
  selectDocument,
  clearDocumentDraft,
  documentDetailOpen,
  setDocumentDetailOpen,
  setUploadDialogOpen,
  setUploadTargetDocId,
  setViewerOpen,
  setViewerUrl,
  setViewerLoading,
  pendingPdfFile,
  setPendingPdfFile,
  pdfPreviewUrl,
  setPdfPreviewUrl,
  fileInputRef,
  selectedDocumentHasPdf,
}: RagTabProps) {
  return (
    <TabsContent value="rag" className="space-y-3 mt-0">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <ScrollText className="h-4 w-4 text-accent-blue" />
          <p className="text-xs font-semibold uppercase tracking-widest text-content-heading">
            Tài liệu RAG kèm theo
          </p>
        </div>

        {mode === "edit" && (
          <div className="rounded-lg border border-card-light-border p-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-content-heading">
                Tài liệu đã import
              </p>
            </div>

            <div className="mb-3">
              <NewDocumentPanel
                disabled={!isEditing}
                onCreateText={async (data) => {
                  if (onCreateTextDocument) await onCreateTextDocument(data);
                }}
                isCreateTextPending={isCreateTextDocumentPending}
                onCreatePdf={async (data) => {
                  if (onCreatePdfDocument) await onCreatePdfDocument(data);
                }}
                isCreatePdfPending={isCreatePdfDocumentPending}
              />
            </div>

            <DocumentList
              documents={documents}
              isLoadingDocuments={isLoadingDocuments}
              isEditing={isEditing}
              draftDocumentId={draft.documentId}
              getDocumentId={getDocumentId}
              selectDocument={selectDocument}
              setDocumentDetailOpen={setDocumentDetailOpen}
              onDeleteDocument={onDeleteDocument}
              isDeleteDocumentPending={isDeleteDocumentPending}
              onUploadDocumentPdf={onUploadDocumentPdf}
              isUploadDocumentPdfPending={isUploadDocumentPdfPending}
              onGetDocumentPdfUrl={onGetDocumentPdfUrl}
              isGetDocumentPdfUrlPending={isGetDocumentPdfUrlPending}
              setUploadTargetDocId={setUploadTargetDocId}
              setUploadDialogOpen={setUploadDialogOpen}
              setViewerLoading={setViewerLoading}
              setViewerOpen={setViewerOpen}
              setViewerUrl={setViewerUrl}
              clearDocumentDraft={clearDocumentDraft}
            />
          </div>
        )}

        {/* PDF Upload for Create Mode */}
        {mode === "create" && (
          <div className="rounded-lg border border-card-light-border p-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-content-heading">
                File PDF đính kèm
                {pendingPdfFile && (
                  <span className="ml-1.5 text-micro px-1.5 py-0.5 rounded-full bg-[var(--accent-gold)]/10 text-[var(--accent-gold)]">
                    Đã chọn
                  </span>
                )}
              </p>
              {pendingPdfFile && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setPendingPdfFile(null);
                    if (pdfPreviewUrl) {
                      URL.revokeObjectURL(pdfPreviewUrl);
                      setPdfPreviewUrl(null);
                    }
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>

            {!pendingPdfFile ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-card-light-border rounded-lg p-4 text-center cursor-pointer transition-colors hover:border-[var(--accent-gold)]/50 hover:bg-[var(--accent-gold)]/5"
              >
                <File className="h-8 w-8 mx-auto mb-2 text-content-muted" />
                <p className="text-sm font-medium text-content-heading">
                  Click để chọn file PDF
                </p>
                <p className="text-xs mt-1 text-content-muted">
                  Hoặc kéo thả file vào đây
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && file.type === "application/pdf") {
                      setPendingPdfFile(file);
                      setPdfPreviewUrl(URL.createObjectURL(file));
                    } else if (file) {
                      toast.error("Vui lòng chọn file PDF");
                    }
                    e.target.value = "";
                  }}
                />
              </div>
            ) : (
              <div className="space-y-3">
                <div
                  className="flex items-center gap-3 p-3 rounded-lg border border-[rgba(234,179,8,0.3)] bg-[rgba(234,179,8,0.05)]"
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-[rgba(234,179,8,0.1)]"
                  >
                    <File className="h-5 w-5 text-accent-gold" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate text-content-heading">
                      {pendingPdfFile.name}
                    </p>
                    <p className="text-xs text-content-muted">
                      {(pendingPdfFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setViewerUrl(pdfPreviewUrl);
                      setViewerOpen(true);
                    }}
                    className="text-accent-gold border-[rgba(234,179,8,0.3)]"
                  >
                    <Eye className="h-4 w-4 mr-1.5" />
                    Xem trước
                  </Button>
                </div>

                {pdfPreviewUrl && (
                  <div
                    className="border border-card-light-border rounded-lg overflow-hidden h-[200px]"
                  >
                    <iframe
                      src={pdfPreviewUrl}
                      className="w-full h-full border-none"
                      title="PDF Preview"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {!selectedDocumentHasPdf && (
          <>
            <div
              className="rounded-lg border border-card-light-border p-3"
            >
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-content-heading">
                Nội dung văn bản (nhập tay)
              </p>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-content-heading">
                    {draft.documentTitle || "Chưa có tiêu đề tài liệu"}
                  </p>
                  <p className="text-xs mt-0.5 text-content-muted">
                    {draft.documentContent.length.toLocaleString("vi-VN")} ký tự
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="shrink-0"
                  onClick={() => setDocumentDetailOpen(true)}
                >
                  {isEditing ? (
                    <>
                      <Pencil className="mr-1.5 h-3.5 w-3.5" />
                      {draft.documentContent ? "Sửa nội dung" : "Nhập nội dung"}
                    </>
                  ) : (
                    <>
                      <Eye className="mr-1.5 h-3.5 w-3.5" />
                      Xem nội dung
                    </>
                  )}
                </Button>
              </div>
            </div>

            <StaffDocumentDetailDialog
              open={documentDetailOpen}
              onOpenChange={setDocumentDetailOpen}
              title={draft.documentTitle}
              content={draft.documentContent}
              editable
              onTitleChange={isEditing ? set("documentTitle") : undefined}
              onContentChange={isEditing ? set("documentContent") : undefined}
              titlePlaceholder="Để trống sẽ dùng tên nhân vật"
              contentPlaceholder="Dán plain text tài liệu tham khảo để AI dùng khi chat..."
            />
          </>
        )}
      </div>
    </TabsContent>
  );
}
