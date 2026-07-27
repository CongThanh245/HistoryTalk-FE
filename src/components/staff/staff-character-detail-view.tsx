"use client";

import * as React from "react";
import {
  ArrowLeftIcon,
  PencilIcon,
  ChatCircleDotsIcon,
  EyeIcon,
  LinkIcon,
  CheckCircleIcon,
  PlusIcon,
  ScrollIcon,
  TrashIcon,
  MapPinIcon,
  ImageIcon,
  VideoIcon,
  CubeIcon,
  UploadSimpleIcon,
} from "@phosphor-icons/react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isValidUrl } from "@/lib/utils/url";
import {
  StaffFormLabel,
  StaffFormInput,
  StaffFormTextarea,
} from "@/components/staff/staff-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmDialog } from "@/components/commons/confirm-dialog";
import { ChatMain } from "@/components/chat/chat-main";
import { StaffCharacterMediaPreview } from "@/components/staff/staff-media-preview";
import { MediaSlotField } from "@/components/staff/media-slot-field";
import { NewDocumentPanel } from "@/components/staff/new-document-panel";
import { StaffPublishToggle } from "@/components/staff/staff-publish-toggle";
import { StaffDocumentDetailDialog } from "@/components/staff/staff-document-detail-dialog";
import type { EventEraBackend } from "@/services/event.service";
import { toast } from "sonner";
import { PdfUploadDialog } from "@/components/staff/pdf-upload-dialog";
import { PdfViewerDialog } from "@/components/staff/pdf-viewer-dialog";
import { hasValidationErrors, validateContextDraft } from "@/lib/utils/content-validation";
import { FORM_TABS, type StaffCharacterDetailViewProps } from "./staff-character-detail-view.types";
import { useStaffCharacterDetailView } from "./use-staff-character-detail-view";

export type { CharacterDraft } from "./staff-character-detail-view.types";
export { EMPTY_CHARACTER_DRAFT } from "./staff-character-detail-view.types";

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
    <p className="text-[11px] font-medium" style={{ color: "var(--accent-danger)" }}>
      {message}
    </p>
  ) : null;
}

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
    onExtractPdfDocument,
    isExtractPdfDocumentPending = false,
    onCreatePdfDocument,
    isCreatePdfDocumentPending = false,
    onUpdateDocument,
    isUpdateDocumentPending = false,
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
    pendingPdfFileUrl,
    setPendingPdfFileUrl,
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

  type MediaKind = "IMAGE_2D" | "MODEL_3D" | "VIDEO";

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
    if (file.size > MEDIA_MAX_UPLOAD_BYTES) {
      toast.error(`${MEDIA_SIZE_HINT}. File đã chọn nặng ${(file.size / 1024 / 1024).toFixed(1)}MB.`);
      return;
    }

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
                router.push("/staff/characters");
              }
            }}
            style={{ color: "var(--content-muted)" }}
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div
              className="relative w-10 h-10 overflow-hidden rounded-lg shrink-0"
              style={{ background: "var(--card-light-border)" }}
            >
              {isValidUrl(draft.image) && (
                <Image
                  src={draft.image}
                  alt={draft.name || "avatar"}
                  fill
                  className="object-cover"
                />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <h1 className="text-lg font-bold leading-tight" style={{ color: "var(--content-heading)" }}>
                  {mode === "create" && !isCreated
                    ? "Tạo nhân vật mới"
                    : draft.name || "Nhân vật"}
                </h1>
                {isCreated && (
                  <StaffPublishToggle
                    isPublished={draft.isPublished}
                    disabled={!isEditing}
                    canPublish={canPublishCharacter}
                    blockedMessage={publishBlockedMessage}
                    entityLabel="nhân vật"
                    compact
                    onPublish={() => set("isPublished")(true)}
                    onUnpublish={() => set("isPublished")(false)}
                    onBlockedAttempt={() => {
                      if (hasPublishErrors) {
                        showValidationErrors(publishValidationErrors);
                      } else if (mappedContexts.length === 0) {
                        setActiveTab("context");
                        toast.error("Vui lòng liên kết bối cảnh lịch sử trước khi xuất bản.");
                      }
                    }}
                  />
                )}
              </div>
              <p className="text-xs" style={{ color: "var(--content-muted)" }}>
                {mode === "create" && !isCreated
                  ? "Điền thông tin bên trái, xem preview chat bên phải"
                  : draft.title}
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
                {isPending
                  ? "Đang lưu..."
                  : isCreated
                    ? "Lưu thay đổi"
                    : "Tạo nhân vật"}
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
      <div className="flex flex-1 min-h-0">
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
              className="px-6 pt-6 pb-4 border-b shrink-0"
              style={{ borderColor: "var(--card-light-border)" }}
            >
              <p className="mb-3 text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--content-heading)" }}>
                Thông tin nhân vật
              </p>

              <TabsList
                className="grid w-full h-auto grid-cols-5 gap-1 p-1"
                style={{ background: "rgba(27,38,50,0.04)" }}
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
                        className="absolute top-1 right-1.5 h-1.5 w-1.5 rounded-full"
                        style={{ background: "var(--accent-danger)" }}
                      />
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="flex-1 px-6 py-6 space-y-5 overflow-y-auto">
            <TabsContent value="basic" className="mt-0 space-y-5">

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <StaffFormLabel>Tên nhân vật *</StaffFormLabel>
                <StaffFormInput
                  value={draft.name}
                  onChange={(e) => set("name")(e.target.value)}
                  placeholder="VD: Ngô Quyền"
                  disabled={!isEditing}
                />
                <ValidationErrorText message={errors.name} />
              </div>
              <div className="grid gap-1.5">
                <StaffFormLabel>Chức vị *</StaffFormLabel>
                <StaffFormInput
                  value={draft.title}
                  onChange={(e) => set("title")(e.target.value)}
                  placeholder="VD: Tiết độ sứ"
                  disabled={!isEditing}
                />
                <ValidationErrorText message={errors.title} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-3">
                <StaffFormLabel>Ngày sinh</StaffFormLabel>
                <div className="grid grid-cols-[44px_54px_1fr_auto] gap-2 items-end">
                  <StaffFormInput
                    type="number"
                    min={1}
                    max={31}
                    value={draft.bornDay}
                    onChange={(e) => set("bornDay")(e.target.value)}
                    placeholder="Ngày"
                    disabled={!isEditing}
                  />
                  <StaffFormInput
                    type="number"
                    min={1}
                    max={12}
                    value={draft.bornMonth}
                    onChange={(e) => set("bornMonth")(e.target.value)}
                    placeholder="Tháng"
                    disabled={!isEditing}
                  />
                  <StaffFormInput
                    type="number"
                    value={draft.bornYear}
                    onChange={(e) => set("bornYear")(e.target.value)}
                    placeholder="Năm"
                    disabled={!isEditing}
                  />
                  <label className="flex items-center h-10 gap-2 px-2 text-xs font-medium border rounded-md" style={{ borderColor: "var(--card-light-border)", color: "var(--content-heading)" }}>
                    <Checkbox
                      checked={draft.isBornBc}
                      onCheckedChange={(val) => set("isBornBc")(!!val)}
                      disabled={!isEditing}
                    />
                    TCN
                  </label>
                </div>
                <ValidationErrorText message={errors.bornDay || errors.bornMonth || errors.bornYear} />
              </div>

              <div className="grid gap-3">
                <StaffFormLabel>Ngày mất</StaffFormLabel>
                <div className="grid grid-cols-[44px_54px_1fr_auto] gap-2 items-end">
                  <StaffFormInput
                    type="number"
                    min={1}
                    max={31}
                    value={draft.deathDay}
                    onChange={(e) => set("deathDay")(e.target.value)}
                    placeholder="Ngày"
                    disabled={!isEditing}
                  />
                  <StaffFormInput
                    type="number"
                    min={1}
                    max={12}
                    value={draft.deathMonth}
                    onChange={(e) => set("deathMonth")(e.target.value)}
                    placeholder="Tháng"
                    disabled={!isEditing}
                  />
                  <StaffFormInput
                    type="number"
                    value={draft.deathYear}
                    onChange={(e) => set("deathYear")(e.target.value)}
                    placeholder="Năm"
                    disabled={!isEditing}
                  />
                  <label className="flex items-center h-10 gap-2 px-2 text-xs font-medium border rounded-md" style={{ borderColor: "var(--card-light-border)", color: "var(--content-heading)" }}>
                    <Checkbox
                      checked={draft.isDeathBc}
                      onCheckedChange={(val) => set("isDeathBc")(!!val)}
                      disabled={!isEditing}
                    />
                    TCN
                  </label>
                </div>
                <ValidationErrorText message={errors.deathDay || errors.deathMonth || errors.deathYear} />
              </div>
            </div>
            </TabsContent>

            <TabsContent value="media" className="mt-0 space-y-5">
            <MediaSlotField
              label="Ảnh nhân vật"
              icon={<ImageIcon className="h-3.5 w-3.5" />}
              accept="image/jpeg,image/png,image/webp,image/gif"
              disabled={!isEditing}
              isBusy={isUploadMediaPending || isDeleteMediaPending}
              hasValue={!!draft.image || !!pendingImageFile}
              hint={`JPEG, PNG, WEBP, GIF · ${MEDIA_SIZE_HINT}`}
              caption={
                pendingImageFile
                  ? `Đã chọn: ${pendingImageFile.name} (sẽ tải lên sau khi lưu)`
                  : draft.image
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
              errorMessage={errors.image}
            >
              {pendingImagePreviewUrl && (
                // eslint-disable-next-line @next/next/no-img-element -- local blob preview, not an optimizable remote asset
                <img
                  src={pendingImagePreviewUrl}
                  alt="Xem trước ảnh"
                  className="object-cover w-32 h-32 mt-1 border rounded-lg"
                  style={{ borderColor: "var(--card-light-border)" }}
                />
              )}
            </MediaSlotField>

            <MediaSlotField
              label="Mô hình 3D (.glb)"
              icon={<CubeIcon className="h-3.5 w-3.5" />}
              accept=".glb,.fbx,model/gltf-binary"
              disabled={!isEditing}
              isBusy={isUploadMediaPending || isDeleteMediaPending}
              hasValue={!!draft.modelUrl || !!pendingModelFile}
              hint={`GLB, FBX · ${MEDIA_SIZE_HINT}`}
              caption={
                pendingModelFile
                  ? `Đã chọn: ${pendingModelFile.name} (sẽ tải lên sau khi lưu)`
                  : draft.modelUrl
                    ? "Đã có mô hình 3D"
                    : "Chưa có mô hình 3D"
              }
              onPick={(file) => handleMediaPick(file, "MODEL_3D", setPendingModelFile)}
              onClear={() => handleMediaClear("MODEL_3D", pendingModelFile, setPendingModelFile)}
            />

            <StaffCharacterMediaPreview
              imageUrl={draft.image}
              modelUrl={draft.modelUrl}
              alt={draft.name || "Ảnh nhân vật"}
            />
            </TabsContent>

            <TabsContent value="content" className="mt-0 space-y-5">
            <div className="grid gap-1.5">
              <StaffFormLabel>Tiểu sử / Bối cảnh *</StaffFormLabel>
              <StaffFormTextarea
                value={draft.background}
                onChange={(e) => set("background")(e.target.value)}
                placeholder="Mô tả cuộc đời, vai trò lịch sử..."
                style={{ minHeight: "120px" }}
                disabled={!isEditing}
              />
              <ValidationErrorText message={errors.background} />
            </div>

            <div className="grid gap-1.5">
              <StaffFormLabel>Tính cách *</StaffFormLabel>
              <StaffFormTextarea
                value={draft.personality}
                onChange={(e) => set("personality")(e.target.value)}
                placeholder="Đặc điểm tính cách, phong cách nói chuyện..."
                style={{ minHeight: "90px" }}
                disabled={!isEditing}
              />
              <ValidationErrorText message={errors.personality} />
            </div>
            </TabsContent>

            <TabsContent value="rag" className="mt-0 space-y-3">
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <ScrollIcon className="w-4 h-4" style={{ color: "var(--accent-blue)" }} />
                  <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--content-heading)" }}>
                    Tài liệu RAG kèm theo
                  </p>
                </div>
                <div className="p-3 border rounded-lg" style={{ borderColor: "var(--card-light-border)" }}>
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--content-heading)" }}>
                      {mode === "edit" ? "Tài liệu đã import" : "Tài liệu"}
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
                      <p className="text-xs" style={{ color: "var(--content-muted)" }}>Đang tải tài liệu...</p>
                    ) : documents.length ? (
                      <div className="space-y-2">
                        {documents.map((document, index) => {
                          const documentId = getDocumentId(document);

                          return (
                            <div
                              key={documentId ?? `character-document-${index}`}
                              className="flex items-start gap-2 p-2 border rounded-md"
                              style={{ borderColor: "var(--card-light-border)", background: "rgba(255,255,255,0.35)" }}
                            >
                              <button
                                type="button"
                                className="flex-1 min-w-0 text-left cursor-pointer"
                                onClick={() => setViewingDocument(document)}
                                title="Xem chi tiết tài liệu này"
                              >
                                <p className="text-sm font-semibold truncate" style={{ color: "var(--content-heading)" }}>
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
                                    className="shrink-0 rounded-full hover:bg-(--accent-gold)/15"
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
                                    style={{ color: "var(--accent-gold)" }}
                                    title="Xem PDF gốc"
                                  >
                                    <EyeIcon className="w-4 h-4" />
                                  </Button>
                                )}
                                {onUploadDocumentPdf && !document.fileUrl && isEditing && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-sm"
                                    className="shrink-0 rounded-full hover:bg-(--accent-blue)/15"
                                    disabled={isUploadDocumentPdfPending}
                                    onClick={() => {
                                      if (documentId) {
                                        setUploadTargetDocId(documentId);
                                        setUploadDialogOpen(true);
                                      }
                                    }}
                                    style={{ color: "var(--accent-blue)" }}
                                    title="Đính kèm PDF gốc"
                                  >
                                    <UploadSimpleIcon className="w-4 h-4" />
                                  </Button>
                                )}
                                {isEditing && onUpdateDocument && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-sm"
                                    className="shrink-0 rounded-full"
                                    onClick={() => openDocumentEdit(document)}
                                    style={{ color: "var(--content-heading)" }}
                                    title="Sửa nội dung"
                                  >
                                    <PencilIcon className="w-4 h-4" />
                                  </Button>
                                )}
                                {onDeleteDocument && isEditing && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-sm"
                                    className="shrink-0 rounded-full hover:bg-(--accent-danger)/15"
                                    disabled={isDeleteDocumentPending}
                                    onClick={() => setDeleteDocumentTarget(document)}
                                    style={{ color: "var(--accent-danger)" }}
                                    title="Xóa tài liệu"
                                  >
                                    <TrashIcon className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs" style={{ color: "var(--content-muted)" }}>Chưa có tài liệu nào.</p>
                    )
                  ) : draft.documentContent.trim() ? (
                    // The not-yet-created document lives entirely in the draft
                    // (no real id until the character is saved) — reuse the
                    // same row markup, and the view/edit/delete dialogs below,
                    // via a sentinel "pending" id.
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
                            className="flex items-start gap-2 p-2 border rounded-md"
                            style={{ borderColor: "var(--card-light-border)", background: "rgba(255,255,255,0.35)" }}
                          >
                            <button
                              type="button"
                              className="flex-1 min-w-0 text-left cursor-pointer"
                              onClick={() => setViewingDocument(pendingDocument)}
                              title="Xem chi tiết tài liệu này"
                            >
                              <p className="text-sm font-semibold truncate" style={{ color: "var(--content-heading)" }}>
                                {pendingDocument.title || "Tài liệu chưa đặt tên"}
                              </p>
                              <p className="mt-0.5 line-clamp-2 text-xs" style={{ color: "var(--content-muted)" }}>
                                {pendingDocument.content || "Chưa có nội dung"}
                              </p>
                            </button>
                            <div className="flex items-center gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                className="shrink-0 rounded-full"
                                onClick={() => openDocumentEdit(pendingDocument)}
                                style={{ color: "var(--content-heading)" }}
                                title="Sửa nội dung"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                className="shrink-0 rounded-full hover:bg-(--accent-danger)/15"
                                onClick={() => setDeleteDocumentTarget(pendingDocument)}
                                style={{ color: "var(--accent-danger)" }}
                                title="Xóa tài liệu"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <p className="text-xs" style={{ color: "var(--content-muted)" }}>
                      Chưa có tài liệu nào. Tài liệu sẽ được tạo cùng lúc khi bạn tạo nhân vật.
                    </p>
                  )}
                </div>
            </div>
            </TabsContent>

            <TabsContent value="context" className="mt-0 space-y-5">
            {isCreated ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <LinkIcon className="w-4 h-4" style={{ color: "var(--accent-blue)" }} />
                  <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--content-heading)" }}>
                    Liên kết bối cảnh lịch sử
                  </p>
                </div>

                {mappedContexts.length > 0 && (
                  <div className="space-y-2">
                    {mappedContexts.map(ctx => (
                      <div
                        key={ctx.contextId}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-xl border group"
                        style={{
                          borderColor: "rgba(34,197,94,0.3)",
                          background: "rgba(34,197,94,0.06)",
                        }}
                      >
                        <CheckCircleIcon className="w-4 h-4 shrink-0" style={{ color: "rgb(22,163,74)" }} />
                        <p className="flex-1 text-xs font-medium text-green-700">
                          Đã liên kết: {ctx.name}
                        </p>
                        {onUnmapContext && (
                          <button
                            onClick={() => handleRemoveContext(ctx.contextId)}
                            disabled={isMapContextPending}
                            className="p-1 text-red-600 transition-all rounded-md opacity-0 group-hover:opacity-100 hover:bg-red-100 disabled:opacity-50"
                            title="Gỡ liên kết"
                          >
                            <TrashIcon className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <div className="flex-1">
                    <Select
                      value={selectedContextId}
                      onValueChange={setSelectedContextId}
                      disabled={isLoadingEvents || isMapContextPending}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={isLoadingEvents ? "Đang tải..." : "Chọn bối cảnh để liên kết"}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {eventOptions.map((ev) => (
                          <SelectItem key={ev.id} value={ev.id}>
                            {ev.title} — {ev.year < 0 ? `${Math.abs(ev.year)} TCN` : ev.year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={handleMapContext}
                    disabled={
                      !selectedContextId ||
                      hasDraftErrors ||
                      isMapContextPending ||
                      mappedContexts.some(c => c.contextId === selectedContextId)
                    }
                    className={`shrink-0 border-0 transition-all duration-200 ${
                      selectedContextId && !mappedContexts.some(c => c.contextId === selectedContextId)
                        ? "bg-[var(--accent-blue)] text-[var(--bg-deep)] hover:brightness-90 hover:shadow-sm cursor-pointer"
                        : ""
                    }`}
                  >
                    <LinkIcon className="h-4 w-4 mr-1.5" />
                    {isMapContextPending ? "Đang liên kết..." : "Liên kết"}
                  </Button>
                </div>

                {/* ── Quick-create context — Sheet trigger ── */}
                <button
                  type="button"
                  className="w-full mt-2 flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all hover:bg-black/[0.04] border"
                  style={{
                    color: "var(--accent-blue)",
                    borderColor: "var(--card-light-border)",
                    background: "transparent",
                  }}
                  onClick={() => setQuickCreateOpen(true)}
                >
                  <PlusIcon className="h-3.5 w-3.5 shrink-0" />
                  Tạo nhanh bối cảnh mới
                  <span
                    className="ml-auto text-[10px] font-normal px-1.5 py-0.5 rounded"
                    style={{ background: "rgba(59,130,246,0.1)", color: "var(--accent-blue)" }}
                  >
                    Mới
                  </span>
                </button>

                {/* ── Quick-create Sheet ── */}
                <Sheet open={quickCreateOpen} onOpenChange={setQuickCreateOpen}>
                  <SheetContent
                    side="right"
                    className="w-full sm:max-w-[480px] p-0 flex flex-col overflow-hidden"
                    style={{
                      background: "var(--bg-content)",
                      borderColor: "var(--card-light-border)",
                    }}
                  >
                    {/* Sheet Header */}
                    <SheetHeader
                      className="px-6 py-5 border-b shrink-0"
                      style={{ borderColor: "var(--card-light-border)" }}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
                          style={{ background: "rgba(59,130,246,0.1)" }}
                        >
                          <ScrollIcon className="w-4 h-4" style={{ color: "var(--accent-blue)" }} />
                        </div>
                        <div>
                          <SheetTitle
                            className="text-base font-bold"
                            style={{ color: "var(--content-heading)" }}
                          >
                            Tạo bối cảnh lịch sử mới
                          </SheetTitle>
                          <SheetDescription
                            className="text-xs mt-0.5"
                            style={{ color: "var(--content-muted)" }}
                          >
                            Bối cảnh sẽ được liên kết với nhân vật này ngay sau khi tạo.
                          </SheetDescription>
                        </div>
                      </div>
                    </SheetHeader>

                    {/* Sheet Body — scrollable */}
                    <div className="flex-1 px-6 py-5 space-y-6 overflow-y-auto">

                      {/* Section: Nội dung */}
                      <div className="space-y-4">
                        <p
                          className="text-[10px] font-bold uppercase tracking-widest"
                          style={{ color: "var(--content-muted)" }}
                        >
                          Nội dung
                        </p>

                        <div className="grid gap-1.5">
                          <Label className="text-xs font-medium" style={{ color: "var(--content-heading)" }}>
                            Tên bối cảnh <span style={{ color: "var(--accent-danger)" }}>*</span>
                          </Label>
                          <Input
                            id="qc-name"
                            value={quickCtx.name}
                            onChange={(e) => setQuickContextField("name")(e.target.value)}
                            placeholder="VD: Chiến thắng Bạch Đằng"
                            className="text-sm h-9"
                          />
                          <ValidationErrorText message={quickErrors.name} />
                        </div>

                        <div className="grid gap-1.5">
                          <Label className="text-xs font-medium" style={{ color: "var(--content-heading)" }}>
                            Mô tả <span style={{ color: "var(--accent-danger)" }}>*</span>
                          </Label>
                          <textarea
                            id="qc-description"
                            value={quickCtx.description}
                            onChange={(e) => setQuickContextField("description")(e.target.value)}
                            placeholder="Bối cảnh lịch sử, ý nghĩa sự kiện..."
                            rows={4}
                            className="w-full px-3 py-2 text-sm transition-colors border rounded-md outline-none resize-none focus:ring-1 focus:ring-blue-400"
                            style={{
                              borderColor: "var(--card-light-border)",
                              background: "var(--bg-content)",
                              color: "var(--content-text)",
                            }}
                          />
                          <ValidationErrorText message={quickErrors.description} />
                        </div>

                        <div className="grid gap-1.5">
                          <Label className="text-xs font-medium flex items-center gap-1.5" style={{ color: "var(--content-heading)" }}>
                            <MapPinIcon className="h-3.5 w-3.5" />
                            Địa điểm <span style={{ color: "var(--accent-danger)" }}>*</span>
                          </Label>
                          <Input
                            id="qc-location"
                            value={quickCtx.location}
                            onChange={(e) => setQuickContextField("location")(e.target.value)}
                            placeholder="VD: Sông Bạch Đằng, Quảng Ninh"
                            className="text-sm h-9"
                          />
                          <ValidationErrorText message={quickErrors.location} />
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="h-px" style={{ background: "var(--card-light-border)" }} />

                      {/* Section: Phân loại & Thời gian */}
                      <div className="space-y-4">
                        <p
                          className="text-[10px] font-bold uppercase tracking-widest"
                          style={{ color: "var(--content-muted)" }}
                        >
                          Phân loại &amp; Thời gian
                        </p>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="grid gap-1.5">
                            <Label className="text-xs font-medium" style={{ color: "var(--content-heading)" }}>
                              Thời đại <span style={{ color: "var(--accent-danger)" }}>*</span>
                            </Label>
                            <Select
                              value={quickCtx.era}
                              onValueChange={(v) => setQuickContextField("era")(v as EventEraBackend)}
                            >
                              <SelectTrigger className="text-sm h-9">
                                <SelectValue placeholder="Chọn thời đại" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ANCIENT">Cổ đại</SelectItem>
                                <SelectItem value="MEDIEVAL">Trung đại</SelectItem>
                                <SelectItem value="MODERN">Cận đại</SelectItem>
                                <SelectItem value="CONTEMPORARY">Hiện đại</SelectItem>
                              </SelectContent>
                            </Select>
                            <ValidationErrorText message={quickErrors.era} />
                          </div>

                          <div className="grid gap-1.5">
                            <Label className="text-xs font-medium" style={{ color: "var(--content-heading)" }}>
                              Năm <span style={{ color: "var(--accent-danger)" }}>*</span>
                            </Label>
                            <Input
                              id="qc-year"
                              type="number"
                              value={quickCtx.year}
                              onChange={(e) => setQuickContextField("year")(e.target.value)}
                              placeholder="VD: 938"
                              className="text-sm h-9"
                            />
                            <ValidationErrorText message={quickErrors.year} />
                          </div>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="h-px" style={{ background: "var(--card-light-border)" }} />

                      {/* Section: Media */}
                      <div className="space-y-4">
                        <p
                          className="text-[10px] font-bold uppercase tracking-widest"
                          style={{ color: "var(--content-muted)" }}
                        >
                          Media (tuỳ chọn)
                        </p>

                        <div className="grid gap-1.5">
                          <Label className="text-xs font-medium flex items-center gap-1.5" style={{ color: "var(--content-heading)" }}>
                            <ImageIcon className="h-3.5 w-3.5" />
                            URL hình ảnh
                          </Label>
                          <Input
                            id="qc-imageUrl"
                            value={quickCtx.imageUrl}
                            onChange={(e) => setQuickContextField("imageUrl")(e.target.value)}
                            placeholder="https://..."
                            className="text-sm h-9"
                          />
                          <ValidationErrorText message={quickErrors.imageUrl} />
                        </div>

                        <div className="grid gap-1.5">
                          <Label className="text-xs font-medium flex items-center gap-1.5" style={{ color: "var(--content-heading)" }}>
                            <VideoIcon className="h-3.5 w-3.5" />
                            URL video (tuỳ chọn — có thể tải file video lên sau khi tạo)
                          </Label>
                          <Input
                            id="qc-videoUrl"
                            value={quickCtx.videoUrl}
                            onChange={(e) => setQuickContextField("videoUrl")(e.target.value)}
                            placeholder="https://.../video.mp4"
                            className="text-sm h-9"
                          />
                          <ValidationErrorText message={quickErrors.videoUrl} />
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="h-px" style={{ background: "var(--card-light-border)" }} />

                      {/* Section: Trạng thái */}
                      <div
                        className="flex items-center justify-between gap-3 px-4 py-3 transition-colors border rounded-xl"
                        style={{
                          borderColor: quickCtx.isPublished ? "rgba(34,197,94,0.35)" : "rgba(234,179,8,0.35)",
                          background: quickCtx.isPublished ? "rgba(34,197,94,0.06)" : "rgba(254,243,199,0.25)",
                        }}
                      >
                        <div className="flex-1">
                          <p
                            className="text-sm font-semibold"
                            style={{ color: quickCtx.isPublished ? "rgb(22,163,74)" : "#92400e" }}
                          >
                            {quickCtx.isPublished ? "Đã xuất bản" : "Chưa xuất bản"}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: "var(--content-muted)" }}>
                            {quickCtx.isPublished
                              ? "Bối cảnh đang hiển thị công khai cho người dùng."
                              : "Bật để hiển thị bối cảnh cho người dùng."}
                          </p>
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={quickCtx.isPublished}
                          onClick={() => setQuickContextField("isPublished")(!quickCtx.isPublished)}
                          className="relative inline-flex h-6 transition-colors border-2 border-transparent rounded-full cursor-pointer w-11 shrink-0 focus-visible:outline-none"
                          style={{ background: quickCtx.isPublished ? "rgb(34,197,94)" : "rgba(234,179,8,0.4)" }}
                        >
                          <span
                            className="block w-5 h-5 transition-transform rounded-full shadow-lg pointer-events-none"
                            style={{
                              background: "#fff",
                              transform: quickCtx.isPublished ? "translateX(20px)" : "translateX(0)",
                            }}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Sheet Footer */}
                    <div
                      className="flex items-center justify-end gap-2 px-6 py-4 border-t shrink-0"
                      style={{ borderColor: "var(--card-light-border)" }}
                    >
                      <Button
                        variant="outline"
                        className="bg-transparent border-[var(--card-light-border)] hover:bg-black/[0.08] hover:border-[var(--content-muted)] transition-colors"
                        style={{ color: "var(--content-heading)" }}
                        onClick={() => {
                          setQuickCreateOpen(false);
                          resetQuickCtx();
                        }}
                      >
                        Huỷ
                      </Button>
                      <Button
                        disabled={
                          !quickCtx.name.trim() ||
                          !quickCtx.description.trim() ||
                          !quickCtx.era ||
                          !quickCtx.year ||
                          !quickCtx.location.trim() ||
                          hasValidationErrors(validateContextDraft(quickCtx)) ||
                          createEvent.isPending
                        }
                        className="border-0 bg-[var(--accent-blue)] text-[var(--bg-deep)] transition-all duration-200 hover:brightness-90 hover:shadow-sm cursor-pointer"
                        onClick={() => {
                          const nextErrors = validateContextDraft(quickCtx);
                          if (hasValidationErrors(nextErrors)) {
                            toast.error("Vui lòng kiểm tra thông tin bối cảnh.");
                            return;
                          }
                          createEvent.mutate(
                            {
                              name: quickCtx.name.trim(),
                              description: quickCtx.description.trim(),
                              era: quickCtx.era as EventEraBackend,
                              year: Number(quickCtx.year),
                              location: quickCtx.location.trim() || undefined,
                              imageUrl: quickCtx.imageUrl.trim() || undefined,
                              videoUrl: quickCtx.videoUrl.trim() || undefined,
                              isPublished: quickCtx.isPublished,
                            },
                            {
                              onSuccess: (newCtx) => {
                                setSelectedContextId(newCtx.id);
                                setQuickCreateOpen(false);
                                resetQuickCtx();
                                toast.success("Tạo bối cảnh thành công!");
                              },
                            },
                          );
                        }}
                      >
                        <PlusIcon className="h-4 w-4 mr-1.5" />
                        {createEvent.isPending ? "Đang tạo..." : "Tạo bối cảnh"}
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            ) : (
              <div
                className="px-4 py-8 text-center border border-dashed rounded-xl"
                style={{ borderColor: "var(--card-light-border)" }}
              >
                <LinkIcon className="w-5 h-5 mx-auto mb-2" style={{ color: "var(--content-muted)" }} />
                <p className="text-sm" style={{ color: "var(--content-muted)" }}>
                  Tạo nhân vật trước để liên kết với bối cảnh lịch sử.
                </p>
              </div>
            )}
            </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* ── Right Panel: Chat Preview ── */}
        <div className="flex-1 flex flex-col min-w-0 relative bg-[var(--bg-app)]">
          {canStartChat ? (
            <ChatMain
              character={chatCharacter}
              contextId={activeChatContextId}
              sessionId={sessionId}
              onSessionCreated={setSessionId}
              initializingLabel={chatInitializingLabel}
            />
          ) : (
            <div className="relative flex flex-col items-center justify-center flex-1 p-12">
              <div className="w-full max-w-2xl aspect-[4/3] relative rounded-3xl overflow-hidden shadow-2xl border border-[var(--card-light-border)]">
                {/* Blurred mock-up */}
                <div className="absolute inset-0 bg-white" style={{ filter: "blur(40px)", opacity: 0.6 }} />
                <div className="absolute inset-0 flex flex-col p-8 space-y-6 opacity-20 bg-gray-50">
                  <div className="w-48 h-12 bg-gray-300 rounded-full" />
                  <div className="w-2/3 h-24 bg-gray-200 rounded-2xl" />
                  <div className="w-1/2 h-24 ml-auto bg-blue-200 rounded-2xl" />
                  <div className="w-3/4 h-24 bg-gray-200 rounded-2xl" />
                </div>

                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="px-6 space-y-4 text-center">
                    <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto shadow-xl border border-[var(--card-light-border)]">
                      <ChatCircleDotsIcon className="w-10 h-10" style={{ color: "var(--accent-blue)" }} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold" style={{ color: "var(--content-heading)" }}>
                        Hệ thống đối thoại chưa khởi tạo
                      </h3>
                      <p className="max-w-sm mx-auto mt-1 text-sm" style={{ color: "var(--content-muted)" }}>
                        {!isCreated
                          ? "Hãy hoàn tất thông tin và 'Tạo nhân vật' để bắt đầu trải nghiệm AI."
                          : hasPublishErrors
                            ? "Nhân vật cần đủ thông tin và URL hình ảnh hợp lệ trước khi chat."
                            : "Bạn cần liên kết nhân vật với một 'Bối cảnh lịch sử' ở khung bên trái để AI có thể hiểu được bối cảnh trò chuyện."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
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

      {/* Document view (read-only) */}
      <StaffDocumentDetailDialog
        open={!!viewingDocument}
        onOpenChange={(open) => !open && setViewingDocument(null)}
        title={viewingDocument?.title ?? ""}
        content={viewingDocument?.content ?? ""}
        titleBadge={
          viewingDocument?.fileUrl ? (
            <span
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
              style={{ background: "rgba(234,179,8,0.12)", color: "rgb(146,64,14)" }}
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
          <DialogHeader className="shrink-0 border-b px-6 py-4" style={{ borderColor: "var(--card-light-border)" }}>
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
                <span className="text-micro" style={{ color: "var(--content-muted)" }}>
                  {editDraftContent.length.toLocaleString("vi-VN")} ký tự
                </span>
              </div>
              <StaffFormTextarea
                value={editDraftContent}
                onChange={(e) => setEditDraftContent(e.target.value)}
                placeholder="Nội dung tài liệu"
                style={{ minHeight: "260px" }}
                disabled={isSavingDocumentEdit}
              />
            </div>
          </div>
          <div className="flex shrink-0 justify-end gap-2 border-t px-6 py-4" style={{ borderColor: "var(--card-light-border)" }}>
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
        description={`Tài liệu "${deleteDocumentTarget?.title || "chưa đặt tên"}" sẽ bị xóa vĩnh viễn khỏi nhân vật này.`}
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
