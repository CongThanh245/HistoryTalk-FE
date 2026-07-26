"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmDialog } from "@/components/commons/confirm-dialog";
import { PdfUploadDialog } from "@/components/staff/pdf-upload-dialog";
import { PdfViewerDialog } from "@/components/staff/pdf-viewer-dialog";
import { FORM_TABS, type StaffCharacterDetailViewProps } from "../staff-character-detail-view.types";
import { useStaffCharacterDetailView } from "../use-staff-character-detail-view";
import { DetailHeader } from "./detail-header";
import { BasicTab } from "./basic-tab";
import { MediaTab } from "./media-tab";
import { ContentTab } from "./content-tab";
import { RagTab } from "./rag-tab";
import { ContextTab } from "./context-tab";
import { ChatPreviewPanel } from "./chat-preview-panel";
import type { MediaKind } from "./types";

export type { CharacterDraft } from "../staff-character-detail-view.types";
export { EMPTY_CHARACTER_DRAFT } from "../staff-character-detail-view.types";

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function StaffCharacterDetailView(props: StaffCharacterDetailViewProps) {
  const {
    mode,
    eventOptions,
    isLoadingEvents,
    documents = [],
    isLoadingDocuments = false,
    onDeleteDocument,
    isDeleteDocumentPending = false,
    onUploadDocumentPdf,
    isUploadDocumentPdfPending = false,
    onGetDocumentPdfUrl,
    isGetDocumentPdfUrlPending = false,
    onUnmapContext,
    isMapContextPending,
    isPending,
    onUploadMedia,
    isUploadMediaPending = false,
    onDeleteMedia,
    isDeleteMediaPending = false,
    onCreateTextDocument,
    isCreateTextDocumentPending = false,
    onCreatePdfDocument,
    isCreatePdfDocumentPending = false,
  } = props;

  const router = useRouter();
  const {
    draft,
    isEditing,
    setIsEditing,
    isDirty,
    set,
    cancelEditing,
    cancelDialogOpen,
    setCancelDialogOpen,
    leaveDialogOpen,
    setLeaveDialogOpen,
    errors,
    tabHasError,
    activeTab,
    setActiveTab,
    hasDraftErrors,
    hasPublishErrors,
    canSave,
    canPublishCharacter,
    publishBlockedMessage,
    showValidationErrors,
    publishValidationErrors,
    handleSaveClick,
    documentDetailOpen,
    setDocumentDetailOpen,
    getDocumentId,
    selectDocument,
    clearDocumentDraft,
    uploadDialogOpen,
    setUploadDialogOpen,
    uploadTargetDocId,
    setUploadTargetDocId,
    viewerOpen,
    setViewerOpen,
    viewerUrl,
    setViewerUrl,
    viewerLoading,
    setViewerLoading,
    pendingPdfFile,
    setPendingPdfFile,
    pdfPreviewUrl,
    setPdfPreviewUrl,
    fileInputRef,
    pendingImageFile,
    setPendingImageFile,
    pendingModelFile,
    setPendingModelFile,
    pendingVideoFile,
    setPendingVideoFile,
    pendingImagePreviewUrl,
    setPendingImagePreviewUrl,
    pendingVideoPreviewUrl,
    setPendingVideoPreviewUrl,
    isCreated,
    characterId,
    sessionId,
    setSessionId,
    activeChatContextId,
    chatCharacter,
    chatInitializingLabel,
    canStartChat,
    selectedContextId,
    setSelectedContextId,
    mappedContexts,
    handleMapContext,
    handleRemoveContext,
    quickCreateOpen,
    setQuickCreateOpen,
    quickCtx,
    setQuickContextField,
    quickErrors,
    resetQuickCtx,
    createEvent,
  } = useStaffCharacterDetailView(props);

  // In edit mode the character already exists, so a picked file uploads
  // immediately; in create mode there's no characterId yet, so the file is
  // held as "pending" and actually uploaded by the page's onSave handler
  // right after the character is created (mirrors the PDF pendingPdfFile flow).
  const handleMediaPick = async (
    file: File,
    mediaType: MediaKind,
    setPendingFile: (file: File | null) => void,
    setPendingPreviewUrl?: (url: string | null) => void,
  ) => {
    if (isCreated && onUploadMedia) {
      try {
        await onUploadMedia(characterId, file, mediaType);
      } catch {
        // onUploadMedia's hook already shows an error toast
      }
      return;
    }
    setPendingFile(file);
    setPendingPreviewUrl?.(URL.createObjectURL(file));
  };

  const handleMediaClear = async (
    mediaType: MediaKind,
    pendingFile: File | null,
    setPendingFile: (file: File | null) => void,
    pendingPreviewUrl?: string | null,
    setPendingPreviewUrl?: (url: string | null) => void,
  ) => {
    if (pendingFile) {
      if (pendingPreviewUrl && setPendingPreviewUrl) {
        URL.revokeObjectURL(pendingPreviewUrl);
        setPendingPreviewUrl(null);
      }
      setPendingFile(null);
      return;
    }
    if (isCreated && onDeleteMedia) {
      try {
        await onDeleteMedia(characterId, mediaType);
      } catch {
        // onDeleteMedia's hook already shows an error toast
      }
    }
  };

  // A PDF document's "content" is just an internal placeholder (PDF text
  // isn't extracted/editable) — the manual text editor and "attach PDF"
  // action only make sense for a document that doesn't already have a file.
  const selectedDocument = documents.find((document) => getDocumentId(document) === draft.documentId);
  const selectedDocumentHasPdf = !!selectedDocument?.fileUrl;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[var(--bg-content)]">
      {/* ═══════ Header ═══════ */}
      <DetailHeader
        mode={mode}
        draft={draft}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        isDirty={isDirty}
        isCreated={isCreated}
        isPending={isPending}
        canSave={canSave}
        canPublishCharacter={canPublishCharacter}
        publishBlockedMessage={publishBlockedMessage}
        hasPublishErrors={hasPublishErrors}
        publishValidationErrors={publishValidationErrors}
        showValidationErrors={showValidationErrors}
        mappedContextsLength={mappedContexts.length}
        setActiveTab={setActiveTab}
        set={set}
        handleSaveClick={handleSaveClick}
        setLeaveDialogOpen={setLeaveDialogOpen}
        setCancelDialogOpen={setCancelDialogOpen}
        onBack={() => router.push("/staff/characters")}
      />

      <ConfirmDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        title="Hủy bỏ thay đổi?"
        description="Bạn có một số thay đổi chưa được lưu. Nếu hủy bỏ, các thay đổi này sẽ bị mất. Bạn có chắc chắn muốn tiếp tục không?"
        confirmLabel="Hủy và xóa thay đổi"
        cancelLabel="Tiếp tục chỉnh sửa"
        variant="danger"
        onConfirm={() => {
          cancelEditing();
          setCancelDialogOpen(false);
        }}
      />

      {/* Leave Page confirm */}
      <ConfirmDialog
        open={leaveDialogOpen}
        onOpenChange={setLeaveDialogOpen}
        title="Bỏ dở phiên làm việc?"
        description="Bạn có một số thay đổi chưa được lưu và sẽ bị mất nếu bạn rời khỏi trang này. Bạn có chắc chắn muốn rời đi?"
        confirmLabel="Rời đi"
        cancelLabel="Ở lại"
        variant="danger"
        onConfirm={() => {
          setLeaveDialogOpen(false);
          router.push("/staff/characters");
        }}
      />

      {/* ═══════ Body — two columns ═══════ */}
      <div className="flex-1 flex min-h-0">
        {/* ── Left Panel: Form ── */}
        <div
          className="w-[600px] shrink-0 border-r border-card-light-border overflow-hidden flex flex-col"
        >
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as typeof activeTab)}
            className="flex flex-col h-full min-h-0 gap-0"
          >
            <div
              className="px-6 pt-6 pb-4 shrink-0 border-b border-card-light-border"
            >
              <p className="text-xs font-semibold uppercase tracking-widest mb-3 text-content-heading">
                Thông tin nhân vật
              </p>

              <TabsList
                className="w-full grid grid-cols-5 h-auto p-1 gap-1 bg-[rgba(27,38,50,0.04)]"
              >
                {FORM_TABS.map((tab) => (
                  <TabsTrigger
                    key={tab.key}
                    value={tab.key}
                    className="relative text-[11px] px-1 py-2 leading-tight whitespace-normal text-center data-[state=active]:shadow-sm"
                  >
                    {tab.label}
                    {tabHasError(tab.key) && (
                      <span
                        className="absolute top-1 right-1.5 h-1.5 w-1.5 rounded-full bg-accent-danger"
                      />
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
              <BasicTab draft={draft} set={set} isEditing={isEditing} errors={errors} />

              <MediaTab
                draft={draft}
                isEditing={isEditing}
                errors={errors}
                isUploadMediaPending={isUploadMediaPending}
                isDeleteMediaPending={isDeleteMediaPending}
                pendingImageFile={pendingImageFile}
                setPendingImageFile={setPendingImageFile}
                pendingModelFile={pendingModelFile}
                setPendingModelFile={setPendingModelFile}
                pendingVideoFile={pendingVideoFile}
                setPendingVideoFile={setPendingVideoFile}
                pendingImagePreviewUrl={pendingImagePreviewUrl}
                setPendingImagePreviewUrl={setPendingImagePreviewUrl}
                pendingVideoPreviewUrl={pendingVideoPreviewUrl}
                setPendingVideoPreviewUrl={setPendingVideoPreviewUrl}
                handleMediaPick={handleMediaPick}
                handleMediaClear={handleMediaClear}
              />

              <ContentTab draft={draft} set={set} isEditing={isEditing} errors={errors} />

              <RagTab
                mode={mode}
                draft={draft}
                set={set}
                isEditing={isEditing}
                documents={documents}
                isLoadingDocuments={isLoadingDocuments}
                onDeleteDocument={onDeleteDocument}
                isDeleteDocumentPending={isDeleteDocumentPending}
                onUploadDocumentPdf={onUploadDocumentPdf}
                isUploadDocumentPdfPending={isUploadDocumentPdfPending}
                onGetDocumentPdfUrl={onGetDocumentPdfUrl}
                isGetDocumentPdfUrlPending={isGetDocumentPdfUrlPending}
                onCreateTextDocument={onCreateTextDocument}
                isCreateTextDocumentPending={isCreateTextDocumentPending}
                onCreatePdfDocument={onCreatePdfDocument}
                isCreatePdfDocumentPending={isCreatePdfDocumentPending}
                getDocumentId={getDocumentId}
                selectDocument={selectDocument}
                clearDocumentDraft={clearDocumentDraft}
                documentDetailOpen={documentDetailOpen}
                setDocumentDetailOpen={setDocumentDetailOpen}
                uploadDialogOpen={uploadDialogOpen}
                setUploadDialogOpen={setUploadDialogOpen}
                uploadTargetDocId={uploadTargetDocId}
                setUploadTargetDocId={setUploadTargetDocId}
                viewerOpen={viewerOpen}
                setViewerOpen={setViewerOpen}
                viewerUrl={viewerUrl}
                setViewerUrl={setViewerUrl}
                viewerLoading={viewerLoading}
                setViewerLoading={setViewerLoading}
                pendingPdfFile={pendingPdfFile}
                setPendingPdfFile={setPendingPdfFile}
                pdfPreviewUrl={pdfPreviewUrl}
                setPdfPreviewUrl={setPdfPreviewUrl}
                fileInputRef={fileInputRef}
                selectedDocumentHasPdf={selectedDocumentHasPdf}
              />

              <ContextTab
                isCreated={isCreated}
                eventOptions={eventOptions}
                isLoadingEvents={isLoadingEvents}
                isMapContextPending={isMapContextPending}
                onUnmapContext={onUnmapContext}
                selectedContextId={selectedContextId}
                setSelectedContextId={setSelectedContextId}
                mappedContexts={mappedContexts}
                handleMapContext={handleMapContext}
                handleRemoveContext={handleRemoveContext}
                hasDraftErrors={hasDraftErrors}
                quickCreateOpen={quickCreateOpen}
                setQuickCreateOpen={setQuickCreateOpen}
                quickCtx={quickCtx}
                setQuickContextField={setQuickContextField}
                quickErrors={quickErrors}
                resetQuickCtx={resetQuickCtx}
                createEvent={createEvent}
              />
            </div>
          </Tabs>
        </div>

        {/* ── Right Panel: Chat Preview ── */}
        <ChatPreviewPanel
          canStartChat={canStartChat}
          chatCharacter={chatCharacter}
          activeChatContextId={activeChatContextId}
          sessionId={sessionId}
          setSessionId={setSessionId}
          chatInitializingLabel={chatInitializingLabel}
          isCreated={isCreated}
          hasPublishErrors={hasPublishErrors}
        />
      </div>

      {/* PDF Upload Dialog */}
      <PdfUploadDialog
        open={uploadDialogOpen}
        onOpenChange={(open) => {
          setUploadDialogOpen(open);
          if (!open) setUploadTargetDocId(null);
        }}
        onUpload={async (file) => {
          if (uploadTargetDocId && onUploadDocumentPdf) {
            await onUploadDocumentPdf(uploadTargetDocId, file);
            setUploadDialogOpen(false);
            setUploadTargetDocId(null);
          }
        }}
        isUploading={isUploadDocumentPdfPending}
        title="Upload PDF"
        description="Chọn file PDF để upload cho tài liệu này. Bạn có thể xem preview trước khi xác nhận."
      />

      {/* PDF Viewer Dialog */}
      <PdfViewerDialog
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        pdfUrl={viewerUrl}
        isLoading={viewerLoading}
        title="Xem PDF"
      />
    </div>
  );
}
