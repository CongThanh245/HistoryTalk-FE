"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  PencilIcon,
  EyeIcon,
  TrashIcon,
  ImageIcon,
  VideoIcon,
  UploadSimpleIcon,
  FilePdfIcon,
  PlayIcon,
  ArrowsOutIcon,
  UsersIcon,
  LinkBreakIcon,
  MagnifyingGlassIcon,
  ScrollIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  StaffFormLabel,
  StaffFormInput,
  StaffFormTextarea,
  StaffFormSelect,
} from "@/components/staff/staff-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { StaffPublishToggle } from "@/components/staff/staff-publish-toggle";
import { StaffImageHoverPreview } from "@/components/staff/staff-media-preview";
import { MediaSlotField } from "@/components/staff/media-slot-field";
import { NewDocumentPanel } from "@/components/staff/new-document-panel";
import { ConfirmDialog } from "@/components/commons/confirm-dialog";
import { PdfUploadDialog } from "@/components/staff/pdf-upload-dialog";
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

function ValidationErrorText({ message }: { message?: string }) {
  return message ? (
    <p className="text-[11px] font-medium" style={{ color: "var(--accent-danger)" }}>
      {message}
    </p>
  ) : null;
}

function extractYoutubeId(url?: string | null) {
  if (!url) return null;
  const match = url.match(/(?:v=|youtu\.be\/|embed\/)([^&\n?#]+)/);
  return match?.[1] ?? null;
}

function isDirectVideoUrl(url?: string | null) {
  if (!url) return false;
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    return /\.(mp4|webm|ogg|mov|avi|mkv)$/.test(pathname);
  } catch {
    return false;
  }
}

// Shows YouTube's own static thumbnail (always correctly framed, unlike the
// iframe player which can crop non-16:9 videos to fill the box) and only
// swaps to the live embed once clicked, so the preview panel never shows a
// misleadingly cropped frame before the user asks to actually play it.
function YoutubePreview({ youtubeId }: { youtubeId: string }) {
  const [playing, setPlaying] = React.useState(false);

  if (playing) {
    return (
      <iframe
        src={`https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1&autoplay=1`}
        title="Xem trước video bối cảnh"
        className="h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        style={{ border: "none" }}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      className="group relative h-full w-full"
      style={{ background: "#000" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- external YouTube CDN thumbnail, not a local/optimized asset */}
      <img
        src={`https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`}
        alt="Xem trước video bối cảnh"
        className="h-full w-full object-contain"
      />
      <span className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/35">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 shadow-lg">
          <PlayIcon className="h-5 w-5 translate-x-px" weight="fill" style={{ color: "#1b2632" }} />
        </span>
      </span>
    </button>
  );
}

export function StaffContextDetailView(props: StaffContextDetailViewProps) {
  const {
    mode,
    isPending,
    documents = [],
    isLoadingDocuments = false,
    onDeleteDocument,
    isDeleteDocumentPending = false,
    onUploadDocumentPdf,
    isUploadDocumentPdfPending = false,
    onGetDocumentPdfUrl,
    isGetDocumentPdfUrlPending = false,
    onUploadMedia,
    isUploadMediaPending = false,
    onDeleteMedia,
    isDeleteMediaPending = false,
    onCreateTextDocument,
    isCreateTextDocumentPending = false,
    onCreatePdfDocument,
    isCreatePdfDocumentPending = false,
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
    pendingVideoFile,
    setPendingVideoFile,
    pendingImagePreviewUrl,
    setPendingImagePreviewUrl,
    pendingVideoPreviewUrl,
    setPendingVideoPreviewUrl,
    isCreated,
  } = useStaffContextDetailView(props);

  type MediaKind = "IMAGE_2D" | "VIDEO";

  // In edit mode the context already exists, so a picked file uploads
  // immediately; in create mode there's no contextId yet, so the file is
  // held as "pending" and actually uploaded by the page's onSave handler
  // right after the context is created (mirrors the PDF pendingPdfFile flow).
  const handleMediaPick = async (
    file: File,
    mediaType: MediaKind,
    setPendingFile: (file: File | null) => void,
    setPendingPreviewUrl: (url: string | null) => void,
  ) => {
    if (isCreated && draft.id && onUploadMedia) {
      try {
        await onUploadMedia(draft.id, file, mediaType);
      } catch {
        // onUploadMedia's hook already shows an error toast
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

  const [unmapTarget, setUnmapTarget] = React.useState<{ characterId: string; name: string } | null>(null);
  const [imageLightboxOpen, setImageLightboxOpen] = React.useState(false);
  const [videoLightboxOpen, setVideoLightboxOpen] = React.useState(false);
  const youtubeId = extractYoutubeId(draft.videoUrl);
  const hasVideo = !!youtubeId || isDirectVideoUrl(draft.videoUrl);

  const visibleTabs = FORM_TABS.filter((tab) => tab.key !== "characters" || mode === "edit");

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[var(--bg-content)]">
      {/* ═══════ Header ═══════ */}
      <div
        className="flex items-center justify-between px-6 py-4 border-b shrink-0"
        style={{ borderColor: "var(--card-light-border)" }}
      >
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-black/[0.08] dark:hover:bg-black/[0.08]"
            onClick={() => {
              if (isDirty && isEditing) {
                setLeaveDialogOpen(true);
              } else {
                router.push("/staff/contexts");
              }
            }}
            style={{ color: "var(--content-muted)" }}
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg overflow-hidden relative shrink-0"
              style={{ background: "var(--card-light-border)" }}
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
                <h1 className="text-lg font-bold leading-tight" style={{ color: "var(--content-heading)" }}>
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
              <p className="text-xs" style={{ color: "var(--content-muted)" }}>
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
                {isPending ? "Đang lưu..." : isCreated ? "Lưu thay đổi" : "Tạo bối cảnh"}
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
          className="w-[600px] shrink-0 border-r overflow-hidden flex flex-col"
          style={{ borderColor: "var(--card-light-border)" }}
        >
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as typeof activeTab)}
            className="flex flex-col h-full min-h-0 gap-0"
          >
            <div
              className="px-6 pt-6 pb-4 shrink-0 border-b"
              style={{ borderColor: "var(--card-light-border)" }}
            >
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--content-heading)" }}>
                Thông tin bối cảnh
              </p>

              <TabsList
                className="w-full grid h-auto p-1 gap-1"
                style={{ background: "rgba(27,38,50,0.04)", gridTemplateColumns: `repeat(${visibleTabs.length}, minmax(0, 1fr))` }}
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
                        className="absolute top-1 right-1.5 h-1.5 w-1.5 rounded-full"
                        style={{ background: "var(--accent-danger)" }}
                      />
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              <TabsContent value="basic" className="space-y-4 mt-0">
                <div className="grid gap-1.5">
                  <StaffFormLabel>Tên sự kiện *</StaffFormLabel>
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
                    style={{ minHeight: "120px" }}
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
                  hasValue={!!draft.imageUrl || !!pendingImageFile}
                  caption={
                    pendingImageFile
                      ? `Đã chọn: ${pendingImageFile.name} (sẽ tải lên sau khi lưu)`
                      : draft.imageUrl
                        ? "Đã có ảnh"
                        : "Chưa có ảnh"
                  }
                  onPick={(file) => handleMediaPick(file, "IMAGE_2D", setPendingImageFile, setPendingImagePreviewUrl)}
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
                      className="mt-1 h-32 w-32 rounded-lg border object-cover"
                      style={{ borderColor: "var(--card-light-border)" }}
                    />
                  )}
                </MediaSlotField>

                <div className="grid gap-1.5">
                  <StaffFormLabel className="flex items-center gap-1.5">
                    <VideoIcon className="h-3.5 w-3.5" />
                    URL video YouTube
                  </StaffFormLabel>
                  <StaffFormInput
                    value={draft.videoUrl}
                    onChange={(e) => set("videoUrl")(e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    disabled={!isEditing}
                  />
                  <ValidationErrorText message={errors.videoUrl} />
                </div>

                <MediaSlotField
                  label="Hoặc tải lên file video trực tiếp"
                  icon={<VideoIcon className="h-3.5 w-3.5" />}
                  accept="video/mp4,video/webm,video/quicktime"
                  disabled={!isEditing}
                  isBusy={isUploadMediaPending || isDeleteMediaPending}
                  hasValue={!!pendingVideoFile}
                  caption={
                    pendingVideoFile
                      ? `Đã chọn: ${pendingVideoFile.name} (sẽ tải lên sau khi lưu)`
                      : "Ghi đè URL YouTube ở trên nếu bạn upload file video trực tiếp"
                  }
                  onPick={(file) => handleMediaPick(file, "VIDEO", setPendingVideoFile, setPendingVideoPreviewUrl)}
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
                      className="mt-1 h-32 w-full max-w-xs rounded-lg border object-cover"
                      style={{ borderColor: "var(--card-light-border)" }}
                    />
                  )}
                </MediaSlotField>

                <p className="text-xs" style={{ color: "var(--content-muted)" }}>
                  Xem preview trực tiếp ở khung bên phải.
                </p>
              </TabsContent>

              <TabsContent value="rag" className="space-y-3 mt-0">
                <div className="flex items-center gap-2">
                  <ScrollIcon className="h-4 w-4" style={{ color: "var(--accent-blue)" }} />
                  <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--content-heading)" }}>
                    Tài liệu RAG kèm theo
                  </p>
                </div>

                {mode === "edit" && (
                  <div className="rounded-lg border p-3" style={{ borderColor: "var(--card-light-border)" }}>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--content-heading)" }}>
                        Tài liệu đã import
                        {documents.length > 0 && (
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
                          if (onCreateTextDocument) await onCreateTextDocument(data);
                        }}
                        isCreateTextPending={isCreateTextDocumentPending}
                        onCreatePdf={async (data) => {
                          if (onCreatePdfDocument) await onCreatePdfDocument(data);
                        }}
                        isCreatePdfPending={isCreatePdfDocumentPending}
                      />
                    </div>

                    {isLoadingDocuments ? (
                      <p className="text-xs" style={{ color: "var(--content-muted)" }}>Đang tải tài liệu...</p>
                    ) : documents.length ? (
                      <div className="space-y-2">
                        {documents.map((document, index) => {
                          const documentId = getDocumentId(document);
                          const selected = !!documentId && draft.documentId === documentId;

                          return (
                            <div
                              key={documentId ?? `historical-document-${index}`}
                              className="flex items-start gap-2 rounded-md border p-2"
                              style={{
                                borderColor: selected ? "rgba(59,130,246,0.45)" : "var(--card-light-border)",
                                background: selected ? "rgba(59,130,246,0.08)" : "rgba(255,255,255,0.35)",
                              }}
                            >
                              <button
                                type="button"
                                className="min-w-0 flex-1 text-left"
                                onClick={() => selectDocument(document)}
                              >
                                <p className="truncate text-sm font-semibold" style={{ color: "var(--content-heading)" }}>
                                  {document.title || "Tài liệu chưa đặt tên"}
                                </p>
                                <p className="mt-0.5 line-clamp-2 text-xs" style={{ color: "var(--content-muted)" }}>
                                  {document.content || "Chưa có nội dung"}
                                </p>
                              </button>
                              <div className="flex items-center gap-1">
                                {onGetDocumentPdfUrl && !!document.fileUrl && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-sm"
                                    className="shrink-0 rounded-full"
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
                                    style={{ color: "var(--accent-gold)" }}
                                    title="Xem PDF"
                                  >
                                    <EyeIcon className="h-4 w-4" />
                                  </Button>
                                )}
                                {onUploadDocumentPdf && !document.fileUrl && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-sm"
                                    className="shrink-0 rounded-full"
                                    disabled={isUploadDocumentPdfPending || !isEditing}
                                    onClick={() => {
                                      if (documentId) {
                                        setUploadTargetDocId(documentId);
                                        setUploadDialogOpen(true);
                                      }
                                    }}
                                    style={{ color: "var(--accent-blue)" }}
                                    title="Upload PDF"
                                  >
                                    <UploadSimpleIcon className="h-4 w-4" />
                                  </Button>
                                )}
                                {onDeleteDocument && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-sm"
                                    className="shrink-0 rounded-full"
                                    disabled={!isEditing || isDeleteDocumentPending}
                                    onClick={() => {
                                      if (!documentId) return;
                                      onDeleteDocument(documentId);
                                      if (draft.documentId === documentId) clearDocumentDraft();
                                    }}
                                    style={{ color: "var(--accent-danger)" }}
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
                      <p className="text-xs" style={{ color: "var(--content-muted)" }}>Chưa có tài liệu nào.</p>
                    )}
                  </div>
                )}

                {mode === "create" && (
                  <div className="rounded-lg border p-3" style={{ borderColor: "var(--card-light-border)" }}>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--content-heading)" }}>
                        File PDF đính kèm
                        {pendingPdfFile && (
                          <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--accent-gold)]/10 text-[var(--accent-gold)]">
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
                          <TrashIcon className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>

                    {!pendingPdfFile ? (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors hover:border-[var(--accent-gold)]/50 hover:bg-[var(--accent-gold)]/5"
                        style={{ borderColor: "var(--card-light-border)" }}
                      >
                        <FilePdfIcon className="h-8 w-8 mx-auto mb-2" style={{ color: "var(--content-muted)" }} />
                        <p className="text-sm font-medium" style={{ color: "var(--content-heading)" }}>
                          Click để chọn file PDF
                        </p>
                        <p className="text-xs mt-1" style={{ color: "var(--content-muted)" }}>
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
                          className="flex items-center gap-3 p-3 rounded-lg border"
                          style={{ borderColor: "rgba(234,179,8,0.3)", background: "rgba(234,179,8,0.05)" }}
                        >
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                            style={{ background: "rgba(234,179,8,0.1)" }}
                          >
                            <FilePdfIcon className="h-5 w-5" style={{ color: "var(--accent-gold)" }} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate" style={{ color: "var(--content-heading)" }}>
                              {pendingPdfFile.name}
                            </p>
                            <p className="text-xs" style={{ color: "var(--content-muted)" }}>
                              {(pendingPdfFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setUploadDialogOpen(true)}
                            style={{ color: "var(--accent-gold)", borderColor: "rgba(234,179,8,0.3)" }}
                          >
                            <EyeIcon className="h-4 w-4 mr-1.5" />
                            Xem trước
                          </Button>
                        </div>

                        {pdfPreviewUrl && (
                          <div
                            className="border rounded-lg overflow-hidden"
                            style={{ borderColor: "var(--card-light-border)", height: "200px" }}
                          >
                            <iframe src={pdfPreviewUrl} className="w-full h-full" title="PDF Preview" style={{ border: "none" }} />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {!selectedDocumentHasPdf && (
                  <>
                    <div className="grid gap-1.5">
                      <div className="flex items-center justify-between">
                        <StaffFormLabel>Tiêu đề tài liệu</StaffFormLabel>
                        {draft.documentId && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                            Đang sửa
                          </span>
                        )}
                        {!draft.documentId && draft.documentContent.trim() && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400">
                            Tài liệu mới
                          </span>
                        )}
                      </div>
                      <StaffFormInput
                        value={draft.documentTitle}
                        onChange={(e) => set("documentTitle")(e.target.value)}
                        placeholder="Để trống sẽ dùng tên bối cảnh"
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <div className="flex items-center justify-between">
                        <StaffFormLabel>Nội dung tài liệu</StaffFormLabel>
                        <span className="text-[10px]" style={{ color: "var(--content-muted)" }}>
                          {draft.documentContent.length.toLocaleString("vi-VN")} ký tự
                        </span>
                      </div>
                      <StaffFormTextarea
                        value={draft.documentContent}
                        onChange={(e) => set("documentContent")(e.target.value)}
                        placeholder="Dán plain text tài liệu tham khảo để AI dùng khi chat..."
                        style={{ minHeight: "160px" }}
                        disabled={!isEditing}
                      />
                    </div>
                  </>
                )}
              </TabsContent>

              <TabsContent value="characters" className="space-y-4 mt-0">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--content-heading)" }}>
                    Nhân vật đã gắn với bối cảnh này
                  </p>
                  <p className="mt-1 text-xs" style={{ color: "var(--content-muted)" }}>
                    Đây là các nhân vật mà người dùng có thể trò chuyện khi khám phá bối cảnh &quot;{draft.name || "..."}&quot;.
                  </p>
                </div>

                {isLoadingCharactersInContext ? (
                  <p className="text-xs" style={{ color: "var(--content-muted)" }}>Đang tải nhân vật...</p>
                ) : charactersInContext.length ? (
                  <div className="space-y-2">
                    {charactersInContext.map((character) => (
                      <div
                        key={character.id}
                        className="flex items-center gap-3 rounded-lg border p-2.5"
                        style={{ borderColor: "var(--card-light-border)", background: "rgba(255,255,255,0.35)" }}
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
                          <p className="truncate text-sm font-semibold" style={{ color: "var(--content-heading)" }}>
                            {character.name}
                          </p>
                          <p className="truncate text-xs" style={{ color: "var(--content-muted)" }}>
                            {character.title || character.role || "—"}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 rounded-md px-2.5 text-xs font-semibold"
                            style={{ borderColor: "var(--card-light-border)", color: "var(--content-heading)" }}
                            onClick={() => router.push(`/staff/characters/${character.id}`)}
                          >
                            Xem chi tiết
                          </Button>
                          {onUnmapCharacter && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              className="rounded-full"
                              title="Gỡ liên kết khỏi bối cảnh"
                              disabled={!isEditing}
                              style={{ color: "var(--accent-danger)" }}
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
                  <p className="text-xs" style={{ color: "var(--content-muted)" }}>
                    Chưa có nhân vật nào được gắn với bối cảnh này.
                  </p>
                )}

                <div className="space-y-2 border-t pt-4" style={{ borderColor: "var(--card-light-border)" }}>
                  <StaffFormLabel>Thêm nhân vật vào bối cảnh này</StaffFormLabel>
                  <div className="relative">
                    <MagnifyingGlassIcon
                      className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                      style={{ color: "var(--content-subtle)" }}
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
                    <p className="text-xs" style={{ color: "var(--content-muted)" }}>Đang tìm kiếm...</p>
                  ) : availableCharacters.length > 0 ? (
                    <div className="space-y-1.5">
                      {availableCharacters.map((character) => (
                        <div
                          key={character.id}
                          className="flex items-center gap-3 rounded-lg border p-2"
                          style={{ borderColor: "var(--card-light-border)" }}
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
                          <p className="min-w-0 flex-1 truncate text-sm" style={{ color: "var(--content-heading)" }}>
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
                    <p className="text-xs" style={{ color: "var(--content-muted)" }}>
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
          <div
            className="overflow-hidden rounded-xl border"
            style={{ borderColor: "var(--card-light-border)", background: "rgba(255,255,255,0.35)" }}
          >
            <div className="border-b px-3 py-2" style={{ borderColor: "var(--card-light-border)" }}>
              <p className="text-xs font-semibold" style={{ color: "var(--content-heading)" }}>
                Xem trước ảnh
              </p>
            </div>
            <div className="group relative aspect-video" style={{ background: "#0b0f14" }}>
              {isValidUrl(draft.imageUrl) ? (
                <>
                  <Image src={draft.imageUrl} alt={draft.name || "Ảnh bối cảnh"} fill className="object-contain" sizes="600px" />
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
                <div className="flex h-full items-center justify-center text-xs text-center px-4" style={{ color: "var(--content-muted)" }}>
                  Dán URL ảnh hợp lệ ở tab Media để xem trước
                </div>
              )}
            </div>
          </div>

          <div
            className="overflow-hidden rounded-xl border"
            style={{ borderColor: "var(--card-light-border)", background: "rgba(255,255,255,0.35)" }}
          >
            <div className="border-b px-3 py-2" style={{ borderColor: "var(--card-light-border)" }}>
              <p className="text-xs font-semibold" style={{ color: "var(--content-heading)" }}>
                Xem trước video
              </p>
            </div>
            <div className="group relative aspect-video">
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
              {youtubeId ? (
                <YoutubePreview key={youtubeId} youtubeId={youtubeId} />
              ) : isDirectVideoUrl(draft.videoUrl) ? (
                <video src={draft.videoUrl} controls className="h-full w-full object-contain" style={{ background: "#000" }} />
              ) : (
                <div className="flex h-full items-center justify-center px-4 text-center text-xs" style={{ color: "var(--content-muted)" }}>
                  Dán URL YouTube hoặc file video (.mp4) ở tab Media để xem trước
                </div>
              )}
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
            {videoLightboxOpen && youtubeId ? (
              <iframe
                src={`https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1&autoplay=1`}
                title="Xem đầy đủ video bối cảnh"
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ border: "none" }}
              />
            ) : videoLightboxOpen && isDirectVideoUrl(draft.videoUrl) ? (
              <video src={draft.videoUrl} controls autoPlay className="h-full w-full object-contain" style={{ background: "#000" }} />
            ) : null}
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
