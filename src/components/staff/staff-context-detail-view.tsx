"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft as ArrowLeftIcon,
  Pencil as PencilIcon,
  Eye as EyeIcon,
  Trash2 as TrashIcon,
  Image as ImageIcon,
  Video as VideoIcon,
  Expand as ArrowsOutIcon,
  Users as UsersIcon,
  Unlink as LinkBreakIcon,
  Search as MagnifyingGlassIcon,
  ScrollText as ScrollIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  StaffFormLabel,
  StaffFormInput,
  StaffFormTextarea,
  StaffFormSelect,
} from "@/components/staff/staff-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StaffPublishToggle } from "@/components/staff/staff-publish-toggle";
import { StaffImageHoverPreview } from "@/components/staff/staff-media-preview";
import { MediaSlotField } from "@/components/staff/media-slot-field";
import { NewDocumentPanel } from "@/components/staff/new-document-panel";
import { StaffDocumentDetailDialog } from "@/components/staff/staff-document-detail-dialog";
import { ConfirmDialog } from "@/components/commons/confirm-dialog";
import { PdfViewerDialog } from "@/components/staff/pdf-viewer-dialog";
import { isValidUrl } from "@/lib/utils/url";
import { toast } from "sonner";
import { FORM_TABS, type StaffContextDetailViewProps } from "./staff-context-detail-view.types";
import { useStaffContextDetailView } from "./use-staff-context-detail-view";

export type { ContextDraft } from "./staff-context-detail-view.types";
export { EMPTY_CONTEXT_DRAFT } from "./staff-context-detail-view.types";

const ERA_OPTIONS = [
  { value: "ANCIENT" as const, label: "Cổ đại" },
  { value: "MEDIEVAL" as const, label: "Trung đại" },
  { value: "MODERN" as const, label: "Cận đại" },
  { value: "CONTEMPORARY" as const, label: "Hiện đại" },
];

// Mirrors config.storage.mediaMaxUploadMb on the backend — Supabase's
// project-wide storage upload limit (Project Settings → Storage), not
// per-type. Checked client-side too so an oversized file gets rejected the
// moment it's picked instead of after filling out the whole form and
// waiting for the request to fail. Keep this in sync manually if that
// Supabase setting ever changes.
const MEDIA_MAX_UPLOAD_MB = 50;
const MEDIA_MAX_UPLOAD_BYTES = MEDIA_MAX_UPLOAD_MB * 1024 * 1024;
const MEDIA_SIZE_HINT = `Tối đa ${MEDIA_MAX_UPLOAD_MB}MB`;

/** Sentinel id for the not-yet-created document being composed in create mode — it reuses the same view/edit/delete dialogs as a real, already-imported RagDocument. */
const PENDING_DOCUMENT_ID = "pending";

function ValidationErrorText({ message }: { message?: string }) {
  return message ? (
    <p className="text-[11px] font-medium text-[var(--accent-danger)]">
      {message}
    </p>
  ) : null;
}

export function StaffContextDetailView(props: StaffContextDetailViewProps) {
  const {
    mode,
    isPending,
    pendingLabel,
    documents = [],
    isLoadingDocuments = false,
    onDeleteDocument,
    isDeleteDocumentPending = false,
    onGetDocumentPdfUrl,
    isGetDocumentPdfUrlPending = false,
    onUploadMedia,
    isUploadMediaPending = false,
    onDeleteMedia,
    isDeleteMediaPending = false,
    onCreateTextDocument,
    isCreateTextDocumentPending = false,
    onExtractPdfDocument,
    isExtractPdfDocumentPending = false,
    onCreatePdfDocument,
    isCreatePdfDocumentPending = false,
    onUpdateDocument,
    isUpdateDocumentPending = false,
    charactersInContext = [],
    isLoadingCharactersInContext = false,
    characterSearch = "",
    onCharacterSearchChange,
    availableCharacters = [],
    isLoadingCharacterSearch = false,
    onMapCharacter,
    isMapCharacterPending = false,
    onUnmapCharacter,
    isUnmapCharacterPending = false,
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
    canSave,
    canPublish,
    publishBlockedMessage,
    handleSaveClick,
    getDocumentId,
    viewingDocument,
    setViewingDocument,
    editingDocument,
    editDraftTitle,
    setEditDraftTitle,
    editDraftContent,
    setEditDraftContent,
    openDocumentEdit,
    closeDocumentEdit,
    handleSaveDocumentEdit,
    isSavingDocumentEdit,
    deleteDocumentTarget,
    setDeleteDocumentTarget,
    viewerOpen,
    setViewerOpen,
    viewerUrl,
    setViewerUrl,
    viewerLoading,
    setViewerLoading,
    pendingPdfFileUrl,
    setPendingPdfFileUrl,
    pendingImageFile,
    setPendingImageFile,
    pendingVideoFile,
    setPendingVideoFile,
    pendingImagePreviewUrl,
    setPendingImagePreviewUrl,
    pendingVideoPreviewUrl,
    setPendingVideoPreviewUrl,
    isCreated,
  } = useStaffContextDetailView(props);

  type MediaKind = "IMAGE_2D" | "VIDEO";

  const [imageUploadProgress, setImageUploadProgress] = React.useState<number | null>(null);
  const [videoUploadProgress, setVideoUploadProgress] = React.useState<number | null>(null);

  // In edit mode the context already exists, so a picked file uploads
  // immediately; in create mode there's no contextId yet, so the file is
  // held as "pending" and actually uploaded by the page's onSave handler
  // right after the context is created (mirrors the PDF pendingPdfFile flow).
  const handleMediaPick = async (
    file: File,
    mediaType: MediaKind,
    setPendingFile: (file: File | null) => void,
    setPendingPreviewUrl: (url: string | null) => void,
    setUploadProgress: (percent: number | null) => void,
  ) => {
    if (file.size > MEDIA_MAX_UPLOAD_BYTES) {
      toast.error(`${MEDIA_SIZE_HINT}. File đã chọn nặng ${(file.size / 1024 / 1024).toFixed(1)}MB.`);
      return;
    }

    if (isCreated && draft.id && onUploadMedia) {
      setUploadProgress(0);
      try {
        const result = await onUploadMedia(draft.id, file, mediaType, setUploadProgress);
        // Reflect the new URL in the form right away — the background
        // query invalidation would otherwise only apply once isEditing
        // turns false, leaving the preview stuck on "no media" until F5.
        if (result?.viewUrl) {
          set(mediaType === "IMAGE_2D" ? "imageUrl" : "videoUrl")(result.viewUrl);
        }
      } catch {
        // onUploadMedia's hook already shows an error toast
      } finally {
        setUploadProgress(null);
      }
      return;
    }
    setPendingFile(file);
    setPendingPreviewUrl(URL.createObjectURL(file));
  };

  const handleMediaClear = async (
    mediaType: MediaKind,
    pendingFile: File | null,
    setPendingFile: (file: File | null) => void,
    pendingPreviewUrl: string | null,
    setPendingPreviewUrl: (url: string | null) => void,
  ) => {
    if (pendingFile) {
      if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl);
      setPendingPreviewUrl(null);
      setPendingFile(null);
      return;
    }
    if (isCreated && draft.id && onDeleteMedia) {
      try {
        await onDeleteMedia(draft.id, mediaType);
        set(mediaType === "IMAGE_2D" ? "imageUrl" : "videoUrl")("");
      } catch {
        // onDeleteMedia's hook already shows an error toast
      }
    }
  };

  const [unmapTarget, setUnmapTarget] = React.useState<{ characterId: string; name: string } | null>(null);
  const [imageLightboxOpen, setImageLightboxOpen] = React.useState(false);
  const [videoLightboxOpen, setVideoLightboxOpen] = React.useState(false);
  const hasVideo = !!draft.videoUrl;

  const visibleTabs = FORM_TABS.filter((tab) => tab.key !== "characters" || mode === "edit");

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[var(--bg-content)]">
      {/* ═══════ Header ═══════ */}
      <div
        className="flex items-center justify-between px-6 py-4 border-b shrink-0 border-[var(--card-light-border)]"
      >
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="text-content-muted hover:bg-black/8 dark:hover:bg-black/8"
            onClick={() => {
              if (isDirty && isEditing) {
                setLeaveDialogOpen(true);
              } else {
                router.push("/staff/contexts");
              }
            }}
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg overflow-hidden relative shrink-0 bg-[var(--card-light-border)]"
            >
              {isValidUrl(draft.imageUrl) && (
                <Image
                  src={draft.imageUrl}
                  alt={draft.name || "ảnh bối cảnh"}
                  fill
                  className="object-cover"
                />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <h1 className="text-lg font-bold leading-tight text-[var(--content-heading)]">
                  {mode === "create" && !isCreated ? "Tạo bối cảnh lịch sử" : draft.name || "Bối cảnh"}
                </h1>
                {isCreated && (
                  <StaffPublishToggle
                    isPublished={draft.isPublished}
                    disabled={!isEditing}
                    canPublish={canPublish}
                    blockedMessage={publishBlockedMessage}
                    entityLabel="bối cảnh"
                    compact
                    onPublish={() => set("isPublished")(true)}
                    onUnpublish={() => set("isPublished")(false)}
                    onBlockedAttempt={() => {
                      setActiveTab("basic");
                      toast.error("Vui lòng hoàn tất bối cảnh trước khi xuất bản.");
                    }}
                  />
                )}
              </div>
              <p className="text-xs text-[var(--content-muted)]">
                {mode === "create" && !isCreated
                  ? "Điền thông tin bên trái, xem preview ảnh/video bên phải"
                  : draft.location || "—"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isEditing && (
            <>
              {isCreated && (
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-transparent border-[var(--card-light-border)] hover:bg-black/[0.08] hover:border-[var(--content-muted)] text-[var(--content-heading)] transition-colors"
                  onClick={() => {
                    if (isDirty) {
                      setCancelDialogOpen(true);
                    } else {
                      setIsEditing(false);
                    }
                  }}
                >
                  Hủy chỉnh sửa
                </Button>
              )}
              <Button
                size="sm"
                onClick={handleSaveClick}
                disabled={!canSave}
                className="border-0 bg-[var(--accent-blue)] text-[var(--bg-deep)] font-semibold transition-all duration-200 hover:brightness-[0.85] hover:shadow-md cursor-pointer"
              >
                {isPending ? pendingLabel || "Đang lưu..." : isCreated ? "Lưu thay đổi" : "Tạo bối cảnh"}
              </Button>
            </>
          )}
          {isCreated && !isEditing && (
            <Button
              variant="outline"
              size="sm"
              className="bg-transparent border-[var(--card-light-border)] hover:bg-black/[0.08] hover:border-[var(--content-muted)] text-[var(--content-heading)] hover:text-[var(--content-heading)] dark:hover:bg-black/[0.08] dark:hover:text-[var(--content-heading)] transition-colors"
              onClick={() => setIsEditing(true)}
            >
              <PencilIcon className="h-4 w-4 mr-1.5" />
              Chỉnh sửa
            </Button>
          )}
        </div>
      </div>

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
          router.push("/staff/contexts");
        }}
      />

      {/* ═══════ Body — two columns ═══════ */}
      <div className="flex-1 flex min-h-0">
        {/* ── Left Panel: Form ── */}
        <div
          className="w-[600px] shrink-0 border-r overflow-hidden flex flex-col border-[var(--card-light-border)]"
        >
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as typeof activeTab)}
            className="flex flex-col h-full min-h-0 gap-0"
          >
            <div
              className="px-6 pt-6 pb-4 shrink-0 border-b border-[var(--card-light-border)]"
            >
              <p className="text-xs font-semibold uppercase tracking-widest mb-3 text-[var(--content-heading)]">
                Thông tin bối cảnh
              </p>

              <TabsList
                className={`w-full grid h-auto p-1 gap-1 bg-[rgba(27,38,50,0.04)] ${visibleTabs.length === 4 ? "grid-cols-4" : "grid-cols-3"}`}
              >
                {visibleTabs.map((tab) => (
                  <TabsTrigger
                    key={tab.key}
                    value={tab.key}
                    className="relative text-[11px] px-1 py-2 leading-tight whitespace-normal text-center data-[state=active]:shadow-sm"
                  >
                    {tab.label}
                    {tabHasError(tab.key) && (
                      <span
                        className="absolute top-1 right-1.5 h-1.5 w-1.5 rounded-full bg-[var(--accent-danger)]"
                      />
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              <TabsContent value="basic" className="space-y-4 mt-0">
                <div className="grid gap-1.5">
                  <StaffFormLabel>Tên bối cảnh *</StaffFormLabel>
                  <StaffFormInput
                    value={draft.name}
                    onChange={(e) => set("name")(e.target.value)}
                    placeholder="VD: Trận Bạch Đằng"
                    disabled={!isEditing}
                  />
                  <ValidationErrorText message={errors.name} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-1.5">
                    <StaffFormLabel>Thời đại *</StaffFormLabel>
                    <StaffFormSelect
                      value={draft.era}
                      onValueChange={set("era")}
                      placeholder="Chọn thời đại"
                      options={ERA_OPTIONS}
                      disabled={!isEditing}
                    />
                    <ValidationErrorText message={errors.era} />
                  </div>
                  <div className="grid gap-1.5">
                    <StaffFormLabel>Năm *</StaffFormLabel>
                    <StaffFormInput
                      type="number"
                      value={draft.year}
                      onChange={(e) => set("year")(e.target.value)}
                      placeholder="938"
                      disabled={!isEditing}
                    />
                    <ValidationErrorText message={errors.year} />
                  </div>
                </div>

                <div className="grid gap-1.5">
                  <StaffFormLabel>Mô tả *</StaffFormLabel>
                  <StaffFormTextarea
                    value={draft.description}
                    onChange={(e) => set("description")(e.target.value)}
                    placeholder="Bối cảnh lịch sử..."
                    className="min-h-30"
                    disabled={!isEditing}
                  />
                  <ValidationErrorText message={errors.description} />
                </div>

                <div className="grid gap-1.5">
                  <StaffFormLabel>Địa điểm *</StaffFormLabel>
                  <StaffFormInput
                    value={draft.location}
                    onChange={(e) => set("location")(e.target.value)}
                    placeholder="VD: Sông Bạch Đằng, Quảng Ninh"
                    disabled={!isEditing}
                  />
                  <ValidationErrorText message={errors.location} />
                </div>
              </TabsContent>

              <TabsContent value="media" className="space-y-4 mt-0">
                <MediaSlotField
                  label="Ảnh bối cảnh"
                  icon={<ImageIcon className="h-3.5 w-3.5" />}
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  disabled={!isEditing}
                  isBusy={isUploadMediaPending || isDeleteMediaPending}
                  progress={imageUploadProgress}
                  hasValue={!!draft.imageUrl || !!pendingImageFile}
                  hint={`JPEG, PNG, WEBP, GIF · ${MEDIA_SIZE_HINT}`}
                  caption={
                    pendingImageFile
                      ? `Đã chọn: ${pendingImageFile.name} (sẽ tải lên sau khi lưu)`
                      : draft.imageUrl
                        ? "Đã có ảnh"
                        : "Chưa có ảnh"
                  }
                  onPick={(file) =>
                    handleMediaPick(file, "IMAGE_2D", setPendingImageFile, setPendingImagePreviewUrl, setImageUploadProgress)
                  }
                  onClear={() =>
                    handleMediaClear(
                      "IMAGE_2D",
                      pendingImageFile,
                      setPendingImageFile,
                      pendingImagePreviewUrl,
                      setPendingImagePreviewUrl,
                    )
                  }
                  errorMessage={errors.imageUrl}
                >
                  {pendingImagePreviewUrl && (
                    // eslint-disable-next-line @next/next/no-img-element -- local blob preview, not an optimizable remote asset
                    <img
                      src={pendingImagePreviewUrl}
                      alt="Xem trước ảnh"
                      className="mt-1 h-32 w-32 rounded-lg border object-cover border-[var(--card-light-border)]"
                    />
                  )}
                </MediaSlotField>

                <MediaSlotField
                  label="Video bối cảnh"
                  icon={<VideoIcon className="h-3.5 w-3.5" />}
                  accept="video/mp4,video/webm,video/quicktime"
                  disabled={!isEditing}
                  isBusy={isUploadMediaPending || isDeleteMediaPending}
                  progress={videoUploadProgress}
                  hasValue={!!draft.videoUrl || !!pendingVideoFile}
                  hint={`MP4, WEBM, MOV · ${MEDIA_SIZE_HINT}`}
                  caption={
                    pendingVideoFile
                      ? `Đã chọn: ${pendingVideoFile.name} (sẽ tải lên sau khi lưu)`
                      : draft.videoUrl
                        ? "Đã có video"
                        : videoUploadProgress != null
                          ? `Đang tải video lên... ${videoUploadProgress}%`
                          : "Chưa có video"
                  }
                  errorMessage={errors.videoUrl}
                  onPick={(file) =>
                    handleMediaPick(file, "VIDEO", setPendingVideoFile, setPendingVideoPreviewUrl, setVideoUploadProgress)
                  }
                  onClear={() =>
                    handleMediaClear(
                      "VIDEO",
                      pendingVideoFile,
                      setPendingVideoFile,
                      pendingVideoPreviewUrl,
                      setPendingVideoPreviewUrl,
                    )
                  }
                >
                  {pendingVideoPreviewUrl && (
                    <video
                      src={pendingVideoPreviewUrl}
                      controls
                      className="mt-1 h-32 w-full max-w-xs rounded-lg border object-cover border-[var(--card-light-border)]"
                    />
                  )}
                </MediaSlotField>

                <p className="text-xs text-[var(--content-muted)]">
                  Xem preview trực tiếp ở khung bên phải.
                </p>
              </TabsContent>

              <TabsContent value="rag" className="space-y-3 mt-0">
                <div className="flex items-center gap-2">
                  <ScrollIcon className="h-4 w-4 text-[var(--accent-blue)]" />
                  <p className="text-xs font-semibold uppercase tracking-widest text-[var(--content-heading)]">
                    Tài liệu RAG kèm theo
                  </p>
                </div>

                <div className="rounded-lg border p-3 border-[var(--card-light-border)]">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-widest text-[var(--content-heading)]">
                      {mode === "edit" ? "Tài liệu đã import" : "Tài liệu"}
                      {mode === "edit" && documents.length > 0 && (
                        <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--accent-gold)]/10 text-[var(--accent-gold)]">
                          {documents.length}
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="mb-3">
                    <NewDocumentPanel
                      disabled={!isEditing}
                      onCreateText={async (data) => {
                        if (mode === "edit") {
                          if (onCreateTextDocument) await onCreateTextDocument(data);
                        } else {
                          set("documentTitle")(data.title);
                          set("documentContent")(data.content);
                        }
                      }}
                      isCreateTextPending={isCreateTextDocumentPending}
                      onExtractPdf={async (file, onProgress, signal) => {
                        if (!onExtractPdfDocument) throw new Error("onExtractPdfDocument not provided");
                        return onExtractPdfDocument(file, onProgress, signal);
                      }}
                      isExtractPdfPending={isExtractPdfDocumentPending}
                      onCreatePdf={async (data) => {
                        if (mode === "edit") {
                          if (onCreatePdfDocument) await onCreatePdfDocument(data);
                        } else {
                          set("documentTitle")(data.title);
                          set("documentContent")(data.content);
                          setPendingPdfFileUrl(data.fileUrl);
                        }
                      }}
                      isCreatePdfPending={isCreatePdfDocumentPending}
                    />
                  </div>

                  {mode === "edit" ? (
                    isLoadingDocuments ? (
                      <p className="text-xs text-[var(--content-muted)]">Đang tải tài liệu...</p>
                    ) : documents.length ? (
                      <div className="space-y-2">
                        {documents.map((document, index) => {
                          const documentId = getDocumentId(document);

                          return (
                            <div
                              key={documentId ?? `historical-document-${index}`}
                              className="flex items-start gap-2 rounded-md border p-2 border-[var(--card-light-border)] bg-[rgba(255,255,255,0.35)]"
                            >
                              <button
                                type="button"
                                className="min-w-0 flex-1 text-left"
                                onClick={() => setViewingDocument(document)}
                                title="Xem chi tiết tài liệu này"
                              >
                                <p className="truncate text-sm font-semibold text-[var(--content-heading)]">
                                  {document.title || "Tài liệu chưa đặt tên"}
                                </p>
                                <p className="mt-0.5 line-clamp-2 text-xs text-[var(--content-muted)]">
                                  {document.content || "Chưa có nội dung"}
                                </p>
                              </button>
                              <div className="flex items-center gap-1">
                                {onGetDocumentPdfUrl && !!document.fileUrl && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-sm"
                                    className="shrink-0 rounded-full text-accent-gold"
                                    disabled={isGetDocumentPdfUrlPending}
                                    onClick={async () => {
                                      if (!documentId) return;
                                      setViewerLoading(true);
                                      setViewerOpen(true);
                                      try {
                                        const result = await onGetDocumentPdfUrl(documentId);
                                        if (result.url) setViewerUrl(result.url);
                                      } catch {
                                        setViewerUrl(null);
                                      } finally {
                                        setViewerLoading(false);
                                      }
                                    }}
                                    title="Xem PDF gốc"
                                  >
                                    <EyeIcon className="h-4 w-4" />
                                  </Button>
                                )}
                                {isEditing && onUpdateDocument && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-sm"
                                    className="shrink-0 rounded-full text-content-heading"
                                    onClick={() => openDocumentEdit(document)}
                                    title="Sửa nội dung"
                                  >
                                    <PencilIcon className="h-4 w-4" />
                                  </Button>
                                )}
                                {onDeleteDocument && isEditing && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-sm"
                                    className="shrink-0 rounded-full text-accent-danger"
                                    disabled={isDeleteDocumentPending}
                                    onClick={() => setDeleteDocumentTarget(document)}
                                    title="Xóa tài liệu"
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-[var(--content-muted)]">Chưa có tài liệu nào.</p>
                    )
                  ) : draft.documentContent.trim() ? (
                    // The not-yet-created document lives entirely in the draft
                    // (no real id until the context is saved) — reuse the same
                    // row markup, and the view/edit/delete dialogs below, via a
                    // sentinel "pending" id.
                    <div className="space-y-2">
                      {(() => {
                        const pendingDocument = {
                          id: PENDING_DOCUMENT_ID,
                          title: draft.documentTitle,
                          content: draft.documentContent,
                          type: "TEXT" as const,
                          fileUrl: pendingPdfFileUrl || undefined,
                        };
                        return (
                          <div
                            className="flex items-start gap-2 rounded-md border p-2 border-[var(--card-light-border)] bg-[rgba(255,255,255,0.35)]"
                          >
                            <button
                              type="button"
                              className="min-w-0 flex-1 text-left"
                              onClick={() => setViewingDocument(pendingDocument)}
                              title="Xem chi tiết tài liệu này"
                            >
                              <p className="truncate text-sm font-semibold text-[var(--content-heading)]">
                                {pendingDocument.title || "Tài liệu chưa đặt tên"}
                              </p>
                              <p className="mt-0.5 line-clamp-2 text-xs text-[var(--content-muted)]">
                                {pendingDocument.content || "Chưa có nội dung"}
                              </p>
                            </button>
                            <div className="flex items-center gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                className="shrink-0 rounded-full text-content-heading"
                                onClick={() => openDocumentEdit(pendingDocument)}
                                title="Sửa nội dung"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                className="shrink-0 rounded-full text-accent-danger"
                                onClick={() => setDeleteDocumentTarget(pendingDocument)}
                                title="Xóa tài liệu"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <p className="text-xs text-[var(--content-muted)]">
                      Chưa có tài liệu nào. Tài liệu sẽ được tạo cùng lúc khi bạn tạo bối cảnh.
                    </p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="characters" className="space-y-4 mt-0">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-[var(--content-heading)]">
                    Nhân vật đã gắn với bối cảnh này
                  </p>
                  <p className="mt-1 text-xs text-[var(--content-muted)]">
                    Đây là các nhân vật mà người dùng có thể trò chuyện khi khám phá bối cảnh &quot;{draft.name || "..."}&quot;.
                  </p>
                </div>

                {isLoadingCharactersInContext ? (
                  <p className="text-xs text-[var(--content-muted)]">Đang tải nhân vật...</p>
                ) : charactersInContext.length ? (
                  <div className="space-y-2">
                    {charactersInContext.map((character) => (
                      <div
                        key={character.id}
                        className="flex items-center gap-3 rounded-lg border p-2.5 border-[var(--card-light-border)] bg-[rgba(255,255,255,0.35)]"
                      >
                        <StaffImageHoverPreview
                          src={character.avatarUrl}
                          alt={character.name}
                          thumbClassName="h-10 w-10 shrink-0 rounded-full border"
                          previewClassName="h-40 w-40"
                          sizes="40px"
                          previewSizes="160px"
                          fallback={<UsersIcon className="h-4 w-4" />}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-[var(--content-heading)]">
                            {character.name}
                          </p>
                          <p className="truncate text-xs text-[var(--content-muted)]">
                            {character.title || character.role || "—"}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 rounded-md px-2.5 text-xs font-semibold border-[var(--card-light-border)] text-[var(--content-heading)]"
                            onClick={() => router.push(`/staff/characters/${character.id}`)}
                          >
                            Xem chi tiết
                          </Button>
                          {onUnmapCharacter && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              className="rounded-full text-accent-danger"
                              title="Gỡ liên kết khỏi bối cảnh"
                              disabled={!isEditing}
                              onClick={() => setUnmapTarget({ characterId: character.id, name: character.name })}
                            >
                              <LinkBreakIcon className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[var(--content-muted)]">
                    Chưa có nhân vật nào được gắn với bối cảnh này.
                  </p>
                )}

                <div className="space-y-2 border-t pt-4 border-[var(--card-light-border)]">
                  <StaffFormLabel>Thêm nhân vật vào bối cảnh này</StaffFormLabel>
                  <div className="relative">
                    <MagnifyingGlassIcon
                      className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--content-subtle)]"
                    />
                    <StaffFormInput
                      value={characterSearch}
                      onChange={(e) => onCharacterSearchChange?.(e.target.value)}
                      placeholder="Tìm nhân vật theo tên..."
                      className="pl-9"
                      disabled={!isEditing}
                    />
                  </div>

                  {isLoadingCharacterSearch ? (
                    <p className="text-xs text-[var(--content-muted)]">Đang tìm kiếm...</p>
                  ) : availableCharacters.length > 0 ? (
                    <div className="space-y-1.5">
                      {availableCharacters.map((character) => (
                        <div
                          key={character.id}
                          className="flex items-center gap-3 rounded-lg border p-2 border-[var(--card-light-border)]"
                        >
                          <StaffImageHoverPreview
                            src={character.avatarUrl}
                            alt={character.name}
                            thumbClassName="h-8 w-8 shrink-0 rounded-full border"
                            previewClassName="h-32 w-32"
                            sizes="32px"
                            previewSizes="128px"
                            fallback={<UsersIcon className="h-3.5 w-3.5" />}
                          />
                          <p className="min-w-0 flex-1 truncate text-sm text-[var(--content-heading)]">
                            {character.name}
                          </p>
                          <Button
                            type="button"
                            size="sm"
                            className="h-7 shrink-0 rounded-md px-2.5 text-xs font-semibold"
                            disabled={isMapCharacterPending || !isEditing}
                            onClick={() => onMapCharacter?.(character.id)}
                          >
                            Liên kết
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[var(--content-muted)]">
                      {characterSearch ? "Không tìm thấy nhân vật phù hợp." : "Nhập tên để tìm nhân vật cần liên kết."}
                    </p>
                  )}
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* ── Right Panel: Media preview ── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto p-6 gap-4 bg-[var(--bg-app)]">
          <div className="flex flex-col sm:flex-row gap-4">
            <div
              className="flex-1 min-w-0 overflow-hidden rounded-xl border border-[var(--card-light-border)] bg-[rgba(255,255,255,0.35)]"
            >
              <div className="border-b px-3 py-2 border-[var(--card-light-border)]">
                <p className="text-xs font-semibold text-[var(--content-heading)]">
                  Xem trước ảnh
                </p>
              </div>
              <div className="group relative aspect-video max-h-48 bg-[#0b0f14]">
                {isValidUrl(draft.imageUrl) ? (
                  <>
                    <Image src={draft.imageUrl} alt={draft.name || "Ảnh bối cảnh"} fill className="object-contain" sizes="300px" />
                    <button
                      type="button"
                      onClick={() => setImageLightboxOpen(true)}
                      className="absolute top-2 right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/70"
                      title="Xem đầy đủ ảnh"
                    >
                      <ArrowsOutIcon className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-center px-4 text-[var(--content-muted)]">
                    Dán URL ảnh hợp lệ ở tab Media để xem trước
                  </div>
                )}
              </div>
            </div>

            <div
              className="flex-1 min-w-0 overflow-hidden rounded-xl border border-[var(--card-light-border)] bg-[rgba(255,255,255,0.35)]"
            >
              <div className="border-b px-3 py-2 border-[var(--card-light-border)]">
                <p className="text-xs font-semibold text-[var(--content-heading)]">
                  Xem trước video
                </p>
              </div>
              <div className="group relative aspect-video max-h-48">
                {hasVideo && (
                  <button
                    type="button"
                    onClick={() => setVideoLightboxOpen(true)}
                    className="absolute top-2 right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/70"
                    title="Xem đầy đủ video"
                  >
                    <ArrowsOutIcon className="h-4 w-4" />
                  </button>
                )}
                {draft.videoUrl ? (
                  <video src={draft.videoUrl} controls className="h-full w-full object-contain bg-black" />
                ) : (
                  <div className="flex h-full items-center justify-center px-4 text-center text-xs text-[var(--content-muted)]">
                    Tải lên file video (.mp4) ở tab Media để xem trước
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image lightbox */}
      <Dialog open={imageLightboxOpen} onOpenChange={setImageLightboxOpen}>
        <DialogContent className="max-w-5xl! w-[92vw] max-h-[90vh] overflow-hidden border-none bg-black p-0">
          <DialogTitle className="sr-only">Xem đầy đủ ảnh bối cảnh</DialogTitle>
          <div className="relative aspect-video w-full">
            {isValidUrl(draft.imageUrl) && (
              <Image src={draft.imageUrl} alt={draft.name || "Ảnh bối cảnh"} fill className="object-contain" sizes="92vw" />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Video lightbox */}
      <Dialog open={videoLightboxOpen} onOpenChange={setVideoLightboxOpen}>
        <DialogContent className="max-w-5xl! w-[92vw] max-h-[90vh] overflow-hidden border-none bg-black p-0">
          <DialogTitle className="sr-only">Xem đầy đủ video bối cảnh</DialogTitle>
          <div className="aspect-video w-full">
            {videoLightboxOpen && draft.videoUrl && (
              <video src={draft.videoUrl} controls autoPlay className="h-full w-full object-contain bg-black" />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Unmap character confirm */}
      <ConfirmDialog
        open={!!unmapTarget}
        onOpenChange={(open) => !open && setUnmapTarget(null)}
        title="Gỡ liên kết nhân vật?"
        description={`Nhân vật "${unmapTarget?.name}" sẽ không còn xuất hiện trong bối cảnh này nữa. Nhân vật vẫn được giữ lại trong hệ thống.`}
        confirmLabel={isUnmapCharacterPending ? "Đang gỡ..." : "Gỡ liên kết"}
        variant="danger"
        isPending={isUnmapCharacterPending}
        onConfirm={() => {
          if (!unmapTarget) return;
          onUnmapCharacter?.(unmapTarget.characterId);
          setUnmapTarget(null);
        }}
      />

      {/* PDF Viewer Dialog */}
      <PdfViewerDialog
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        pdfUrl={viewerUrl}
        isLoading={viewerLoading}
        title="Xem PDF"
      />

      {/* Document view (read-only) */}
      <StaffDocumentDetailDialog
        open={!!viewingDocument}
        onOpenChange={(open) => !open && setViewingDocument(null)}
        title={viewingDocument?.title ?? ""}
        content={viewingDocument?.content ?? ""}
        titleBadge={
          viewingDocument?.fileUrl ? (
            <span
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[rgba(234,179,8,0.12)] text-[rgb(146,64,14)]"
            >
              Có PDF gốc
            </span>
          ) : undefined
        }
      />

      {/* Document edit — header/footer stay fixed, only the middle scrolls,
          so "Lưu thay đổi" never needs a scroll-to-find on long content. */}
      <Dialog open={!!editingDocument} onOpenChange={(open) => !open && closeDocumentEdit()}>
        <DialogContent className="flex max-h-[85vh] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-[680px]">
          <DialogHeader className="shrink-0 border-b px-6 py-4 border-[var(--card-light-border)]">
            <DialogTitle>Sửa tài liệu</DialogTitle>
          </DialogHeader>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
            <div className="grid gap-1.5">
              <StaffFormLabel>Tiêu đề</StaffFormLabel>
              <StaffFormInput
                value={editDraftTitle}
                onChange={(e) => setEditDraftTitle(e.target.value)}
                placeholder="Tiêu đề tài liệu"
                disabled={isSavingDocumentEdit}
              />
            </div>
            <div className="grid gap-1.5">
              <div className="flex items-center justify-between">
                <StaffFormLabel>Nội dung</StaffFormLabel>
                <span className="text-[10px] text-[var(--content-muted)]">
                  {editDraftContent.length.toLocaleString("vi-VN")} ký tự
                </span>
              </div>
              <StaffFormTextarea
                value={editDraftContent}
                onChange={(e) => setEditDraftContent(e.target.value)}
                placeholder="Nội dung tài liệu"
                className="min-h-65"
                disabled={isSavingDocumentEdit}
              />
            </div>
          </div>
          <div className="flex shrink-0 justify-end gap-2 border-t px-6 py-4 border-[var(--card-light-border)]">
            <Button type="button" variant="outline" onClick={closeDocumentEdit} disabled={isSavingDocumentEdit}>
              Hủy
            </Button>
            <Button
              type="button"
              onClick={() => {
                // The pending create-mode document has no real id yet — just
                // write straight back into the draft instead of calling the
                // (nonexistent) update API.
                if (editingDocument && getDocumentId(editingDocument) === PENDING_DOCUMENT_ID) {
                  set("documentTitle")(editDraftTitle.trim());
                  set("documentContent")(editDraftContent.trim());
                  closeDocumentEdit();
                  return;
                }
                void handleSaveDocumentEdit();
              }}
              disabled={isSavingDocumentEdit || isUpdateDocumentPending}
            >
              {isSavingDocumentEdit || isUpdateDocumentPending ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete document confirm */}
      <ConfirmDialog
        open={!!deleteDocumentTarget}
        onOpenChange={(open) => !open && setDeleteDocumentTarget(null)}
        title="Xóa tài liệu?"
        description={`Tài liệu "${deleteDocumentTarget?.title || "chưa đặt tên"}" sẽ bị xóa vĩnh viễn khỏi bối cảnh này.`}
        confirmLabel="Xóa"
        variant="danger"
        isPending={isDeleteDocumentPending}
        onConfirm={() => {
          const docId = deleteDocumentTarget ? getDocumentId(deleteDocumentTarget) : undefined;
          if (!docId) return;
          if (docId === PENDING_DOCUMENT_ID) {
            set("documentTitle")("");
            set("documentContent")("");
            setPendingPdfFileUrl(null);
            setDeleteDocumentTarget(null);
            return;
          }
          if (!onDeleteDocument) return;
          onDeleteDocument(docId);
          setDeleteDocumentTarget(null);
        }}
      />
    </div>
  );
}
