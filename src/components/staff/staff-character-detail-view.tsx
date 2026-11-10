"use client";

import * as React from "react";
import {
  ArrowLeft as ArrowLeftIcon,
  Pencil as PencilIcon,
  MessageCircleMore as ChatCircleDotsIcon,
  Eye as EyeIcon,
  Link as LinkIcon,
  CheckCircle as CheckCircleIcon,
  Plus as PlusIcon,
  ScrollText as ScrollIcon,
  Trash2 as TrashIcon,
  MapPin as MapPinIcon,
  Image as ImageIcon,
  Video as VideoIcon,
  Box as CubeIcon,
  CircleCheck as CheckIcon,
  CircleAlert as AlertIcon,
  Columns2 as ColumnsIcon,
} from "lucide-react";
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
import { cn } from "@/lib/utils/cn";
import {
  StaffFormLabel,
  StaffFormInput,
  StaffFormTextarea,
} from "@/components/staff/staff-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectEmpty,
  SelectSearch,
  SelectTrigger,
  SelectValue,
  useSelectSearch,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmDialog } from "@/components/commons/confirm-dialog";
import { ChatMain } from "@/components/chat/chat-main";
import { ExamStartDialog } from "@/components/chat/exam-start-dialog";
import { CHAT_MODE_LABELS } from "@/services/chat.service";
import { StaffCharacterMediaPreview } from "@/components/staff/staff-media-preview";
import { MediaSlotField } from "@/components/staff/media-slot-field";
import { CharacterVoiceFields } from "@/components/staff/character-voice-fields";
import { NewDocumentPanel } from "@/components/staff/new-document-panel";
import { MarkdownMessage } from "@/components/chat/MarkdownMessage";
import { StaffPublishToggle } from "@/components/staff/staff-publish-toggle";
import { StaffDocumentDetailDialog } from "@/components/staff/staff-document-detail-dialog";
import type { EventEraBackend } from "@/services/event.service";
import { toast } from "sonner";
import { PdfViewerDialog } from "@/components/staff/pdf-viewer-dialog";
import { hasValidationErrors, validateContextDraft } from "@/lib/utils/content-validation";
import { FORM_TABS, type FormTabKey, type StaffCharacterDetailViewProps } from "./staff-character-detail-view.types";
import { useStaffCharacterDetailView } from "./use-staff-character-detail-view";

export type { CharacterDraft } from "./staff-character-detail-view.types";
export { EMPTY_CHARACTER_DRAFT } from "./staff-character-detail-view.types";

// Mirrors config.storage.mediaMaxUploadMb on the backend â€” Supabase's
// project-wide storage upload limit (Project Settings â†’ Storage), not
// per-type. Checked client-side too so an oversized file gets rejected the
// moment it's picked instead of after filling out the whole form and
// waiting for the request to fail. Keep this in sync manually if that
// Supabase setting ever changes.
const MEDIA_MAX_UPLOAD_MB = 50;
const MEDIA_MAX_UPLOAD_BYTES = MEDIA_MAX_UPLOAD_MB * 1024 * 1024;
const MEDIA_SIZE_HINT = `Tá»‘i Ä‘a ${MEDIA_MAX_UPLOAD_MB}MB`;
// Backend: 2D images up to 10MB (DirectBinaryUploadStrategy); 3D models are bounded by the 50MB multipart cap.
const IMAGE_MAX_UPLOAD_MB = 10;

/** Sentinel id for the not-yet-created document being composed in create mode â€” it reuses the same view/edit/delete dialogs as a real, already-imported RagDocument. */
const PENDING_DOCUMENT_ID = "pending";

function ValidationErrorText({ message }: { message?: string }) {
  return message ? (
    <p className="text-[11px] font-medium text-[var(--accent-danger)]">
      {message}
    </p>
  ) : null;
}

/** "10/9/1385", "1385 TCN", or "" â€” whatever parts of the date are known. */
function formatLifeDate(day: string, month: string, year: string, isBc: boolean) {
  if (!year) return "";
  return [day, month, year].filter(Boolean).join("/") + (isBc ? " TCN" : "");
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
  const contextSearch = useSelectSearch();
  const [charEditDocTab, setCharEditDocTab] = React.useState<"split" | "edit" | "preview">("split");
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
    hasUnpublishedLinkedContext,
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
    viewerOpen,
    setViewerOpen,
    viewerUrl,
    setViewerUrl,
    viewerLoading,
    setViewerLoading,
    setPendingPdfFileUrl,
    setPendingPdfFile,
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
    startTestExam,
    startTestInterview,
    testSessionMode,
    isStartingTestExam,
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
  const deferredCharEditContent = React.useDeferredValue(editDraftContent);
  const [isTestExamDialogOpen, setIsTestExamDialogOpen] = React.useState(false);

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
      toast.error(`${MEDIA_SIZE_HINT}. File Ä‘Ã£ chá»n náº·ng ${(file.size / 1024 / 1024).toFixed(1)}MB.`);
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

  const bornText = formatLifeDate(draft.bornDay, draft.bornMonth, draft.bornYear, draft.isBornBc);
  const deathText = formatLifeDate(draft.deathDay, draft.deathMonth, draft.deathYear, draft.isDeathBc);
  const lifeSpan = bornText || deathText ? `${bornText || "?"} â€“ ${deathText || "?"}` : "";
  const lifeSpanYears =
    draft.bornYear || draft.deathYear
      ? `${draft.bornYear || "?"}${draft.isBornBc ? " TCN" : ""} â€“ ${draft.deathYear || "?"}${draft.isDeathBc ? " TCN" : ""}`
      : "";

  // Counts on the tabs let staff see how complete a character is without opening each tab.
  const tabCounts: Partial<Record<FormTabKey, number>> =
    mode === "edit" && !isLoadingDocuments ? { rag: documents.length, context: mappedContexts.length } : {};

  const documentCount = mode === "edit" ? documents.length : draft.documentContent?.trim() ? 1 : 0;
  const checklist: { label: string; done: boolean; tab: FormTabKey }[] = [
    { label: "áº¢nh nhÃ¢n váº­t", done: !!draft.image || !!pendingImageFile, tab: "media" },
    { label: "MÃ´ hÃ¬nh 3D", done: !!draft.modelUrl || !!pendingModelFile, tab: "media" },
    { label: "Tiá»ƒu sá»­", done: !!draft.background.trim(), tab: "content" },
    { label: "TÃ­nh cÃ¡ch", done: !!draft.personality.trim(), tab: "content" },
    { label: documentCount ? `${documentCount} tÃ i liá»‡u` : "ChÆ°a cÃ³ tÃ i liá»‡u", done: documentCount > 0, tab: "rag" },
    {
      label: mappedContexts.length ? `${mappedContexts.length} bá»‘i cáº£nh` : "ChÆ°a liÃªn káº¿t bá»‘i cáº£nh",
      done: mappedContexts.length > 0,
      tab: "context",
    },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[var(--bg-main)]">
      {/* â•â•â•â•â•â•â• Header â•â•â•â•â•â•â• */}
      <div
        className="flex items-center justify-between px-6 py-4 border-b shrink-0 border-[var(--border-default)]"
      >
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="text-content-muted hover:bg-[var(--status-neutral-bg)] "
            onClick={() => {
              if (isDirty && isEditing) {
                setLeaveDialogOpen(true);
              } else {
                router.push("/staff/characters");
              }
            }}
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div
              className="relative w-10 h-10 overflow-hidden rounded-full shrink-0 bg-[var(--status-neutral-bg)]"
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
                <h1 className="archive-title is-plain text-2xl">
                  {mode === "create" && !isCreated
                    ? "Táº¡o nhÃ¢n váº­t má»›i"
                    : draft.name || "NhÃ¢n váº­t"}
                </h1>
                {isCreated && (
                  <StaffPublishToggle
                    isPublished={draft.isPublished}
                    disabled={!isEditing}
                    canPublish={canPublishCharacter}
                    blockedMessage={publishBlockedMessage}
                    entityLabel="nhÃ¢n váº­t"
                    compact
                    onPublish={() => set("isPublished")(true)}
                    onUnpublish={() => set("isPublished")(false)}
                    onBlockedAttempt={() => {
                      if (hasPublishErrors) {
                        showValidationErrors(publishValidationErrors);
                      } else if (mappedContexts.length === 0) {
                        setActiveTab("context");
                        toast.error("Vui lÃ²ng liÃªn káº¿t bá»‘i cáº£nh lá»‹ch sá»­ trÆ°á»›c khi xuáº¥t báº£n.");
                      } else if (hasUnpublishedLinkedContext) {
                        setActiveTab("context");
                        toast.error("Vui lÃ²ng xuáº¥t báº£n táº¥t cáº£ bá»‘i cáº£nh lá»‹ch sá»­ liÃªn káº¿t trÆ°á»›c khi xuáº¥t báº£n nhÃ¢n váº­t.");
                      }
                    }}
                  />
                )}
              </div>
              <p className="text-xs text-[var(--content-muted)]">
                {mode === "create" && !isCreated
                  ? "Äiá»n thÃ´ng tin bÃªn trÃ¡i, thá»­ trÃ² chuyá»‡n bÃªn pháº£i sau khi táº¡o"
                  : [draft.title, lifeSpanYears].filter(Boolean).join(" Â· ")}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isCreated && !isEditing && (
            <Button
              variant="outline"
              size="sm"
              className="rounded-sm bg-transparent border-border-card hover:bg-[var(--status-neutral-bg)] text-[var(--content-heading)] hover:text-[var(--content-heading)] dark:hover:text-[var(--content-heading)] transition-colors"
              onClick={() => setIsEditing(true)}
            >
              <PencilIcon className="h-4 w-4 mr-1.5" />
              Chá»‰nh sá»­a
            </Button>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        title="Há»§y bá» thay Ä‘á»•i?"
        description="Báº¡n cÃ³ má»™t sá»‘ thay Ä‘á»•i chÆ°a Ä‘Æ°á»£c lÆ°u. Náº¿u há»§y bá», cÃ¡c thay Ä‘á»•i nÃ y sáº½ bá»‹ máº¥t. Báº¡n cÃ³ cháº¯c cháº¯n muá»‘n tiáº¿p tá»¥c khÃ´ng?"
        confirmLabel="Há»§y vÃ  xÃ³a thay Ä‘á»•i"
        cancelLabel="Tiáº¿p tá»¥c chá»‰nh sá»­a"
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
        title="Bá» dá»Ÿ phiÃªn lÃ m viá»‡c?"
        description="Báº¡n cÃ³ má»™t sá»‘ thay Ä‘á»•i chÆ°a Ä‘Æ°á»£c lÆ°u vÃ  sáº½ bá»‹ máº¥t náº¿u báº¡n rá»i khá»i trang nÃ y. Báº¡n cÃ³ cháº¯c cháº¯n muá»‘n rá»i Ä‘i?"
        confirmLabel="Rá»i Ä‘i"
        cancelLabel="á»ž láº¡i"
        variant="danger"
        onConfirm={() => {
          setLeaveDialogOpen(false);
          router.push("/staff/characters");
        }}
      />

      {/* â•â•â•â•â•â•â• Body â€” two columns â•â•â•â•â•â•â• */}
      <div className="flex flex-1 min-h-0">
        {/* â”€â”€ Left Panel: Form â”€â”€ */}
        <div
          className="w-[600px] shrink-0 border-r overflow-hidden flex flex-col border-[var(--card-light-border)]"
        >
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as typeof activeTab)}
            className="flex flex-col h-full min-h-0 gap-0"
          >
            <div className="px-6 border-b shrink-0 border-[var(--card-light-border)]">
              <TabsList
                className="flex h-11 w-full justify-start gap-5 overflow-x-auto overflow-y-hidden py-0 px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {FORM_TABS.map((tab) => (
                  <TabsTrigger
                    key={tab.key}
                    value={tab.key}
                    className="relative shrink-0 px-0.5 text-sm"
                  >
                    {tab.label}
                    {tabCounts[tab.key] != null && (
                      <span className="ml-1 text-xs font-normal text-[var(--content-muted)]">({tabCounts[tab.key]})</span>
                    )}
                    {tabHasError(tab.key) && (
                      <span
                        className="absolute top-1 -right-1.5 h-1.5 w-1.5 rounded-full bg-[var(--accent-danger)]"
                      />
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="flex-1 px-6 py-6 space-y-5 overflow-y-auto">
              <TabsContent value="basic" className="mt-0 space-y-5">
                {!isEditing ? (
                  // View mode reads as plain text â€” disabled inputs looked broken and were hard to read.
                  <dl className="grid gap-5 sm:grid-cols-2">
                    {[
                      { label: "Chá»©c vá»‹", value: draft.title },
                      { label: "Sinh â€“ máº¥t", value: lifeSpan },
                    ].map((item) => (
                      <div key={item.label} className="min-w-0">
                        <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--content-muted)]">{item.label}</dt>
                        <dd className="mt-1 text-[15px] font-medium text-[var(--content-heading)]">{item.value || "â€”"}</dd>
                      </div>
                    ))}
                  </dl>
                ) : (
              <div className="space-y-5">

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-1.5">
                    <StaffFormLabel>TÃªn nhÃ¢n váº­t *</StaffFormLabel>
                    <StaffFormInput
                      value={draft.name}
                      onChange={(e) => set("name")(e.target.value)}
                      placeholder="VD: NgÃ´ Quyá»n"
                      disabled={!isEditing}
                    />
                    <ValidationErrorText message={errors.name} />
                  </div>
                  <div className="grid gap-1.5">
                    <StaffFormLabel>Chá»©c vá»‹ *</StaffFormLabel>
                    <StaffFormInput
                      value={draft.title}
                      onChange={(e) => set("title")(e.target.value)}
                      placeholder="VD: Tiáº¿t Ä‘á»™ sá»©"
                      disabled={!isEditing}
                    />
                    <ValidationErrorText message={errors.title} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-3">
                    <StaffFormLabel>NgÃ y sinh</StaffFormLabel>
                    <div className="grid grid-cols-[44px_54px_1fr_auto] gap-2 items-end">
                      <StaffFormInput
                        type="number"
                        min={1}
                        max={31}
                        value={draft.bornDay}
                        onChange={(e) => set("bornDay")(e.target.value)}
                        placeholder="NgÃ y"
                        disabled={!isEditing}
                      />
                      <StaffFormInput
                        type="number"
                        min={1}
                        max={12}
                        value={draft.bornMonth}
                        onChange={(e) => set("bornMonth")(e.target.value)}
                        placeholder="ThÃ¡ng"
                        disabled={!isEditing}
                      />
                      <StaffFormInput
                        type="number"
                        value={draft.bornYear}
                        onChange={(e) => set("bornYear")(e.target.value)}
                        placeholder="NÄƒm"
                        disabled={!isEditing}
                      />
                      <label className="flex items-center h-10 gap-2 px-2 text-xs font-medium border rounded-sm border-[var(--card-light-border)] text-[var(--content-heading)]">
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
                    <StaffFormLabel>NgÃ y máº¥t</StaffFormLabel>
                    <div className="grid grid-cols-[44px_54px_1fr_auto] gap-2 items-end">
                      <StaffFormInput
                        type="number"
                        min={1}
                        max={31}
                        value={draft.deathDay}
                        onChange={(e) => set("deathDay")(e.target.value)}
                        placeholder="NgÃ y"
                        disabled={!isEditing}
                      />
                      <StaffFormInput
                        type="number"
                        min={1}
                        max={12}
                        value={draft.deathMonth}
                        onChange={(e) => set("deathMonth")(e.target.value)}
                        placeholder="ThÃ¡ng"
                        disabled={!isEditing}
                      />
                      <StaffFormInput
                        type="number"
                        value={draft.deathYear}
                        onChange={(e) => set("deathYear")(e.target.value)}
                        placeholder="NÄƒm"
                        disabled={!isEditing}
                      />
                      <label className="flex items-center h-10 gap-2 px-2 text-xs font-medium border rounded-sm border-[var(--card-light-border)] text-[var(--content-heading)]">
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
              </div>
                )}

                <div className="border-t pt-5 border-[var(--card-light-border)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--content-muted)]">
                    TÃ¬nh tráº¡ng ná»™i dung
                  </p>
                  <ul className="mt-3 grid gap-1 sm:grid-cols-2">
                    {checklist.map((item) => (
                      <li key={item.label + item.tab}>
                        <button
                          type="button"
                          onClick={() => setActiveTab(item.tab)}
                          className="flex w-full items-center gap-2 rounded-sm px-1.5 py-1 text-left text-sm transition-colors hover:bg-[var(--status-neutral-bg)]"
                        >
                          {item.done ? (
                            <CheckIcon className="h-4 w-4 shrink-0 text-[var(--status-success)]" aria-label="ÄÃ£ cÃ³" />
                          ) : (
                            <AlertIcon className="h-4 w-4 shrink-0 text-[var(--status-warning)]" aria-label="CÃ²n thiáº¿u" />
                          )}
                          <span className={item.done ? "text-[var(--content-heading)]" : "text-[var(--content-muted)]"}>
                            {item.label}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </TabsContent>

              <TabsContent value="media" className="mt-0 space-y-5">
                <MediaSlotField
                  label="áº¢nh nhÃ¢n váº­t"
                  icon={<ImageIcon className="h-3.5 w-3.5" />}
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  maxMb={IMAGE_MAX_UPLOAD_MB}
                  disabled={!isEditing}
                  isBusy={isUploadMediaPending || isDeleteMediaPending}
                  hasValue={!!draft.image || !!pendingImageFile}
                  hint={`JPEG, PNG, WEBP, GIF Â· Tá»‘i Ä‘a ${IMAGE_MAX_UPLOAD_MB}MB`}
                  caption={
                    pendingImageFile
                      ? `ÄÃ£ chá»n: ${pendingImageFile.name} (sáº½ táº£i lÃªn sau khi lÆ°u)`
                      : draft.image
                        ? "ÄÃ£ cÃ³ áº£nh"
                        : "ChÆ°a cÃ³ áº£nh"
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
                      alt="Xem trÆ°á»›c áº£nh"
                      className="object-cover w-32 h-32 mt-1 border rounded-sm border-[var(--card-light-border)]"
                    />
                  )}
                </MediaSlotField>

                <MediaSlotField
                  label="MÃ´ hÃ¬nh 3D (.glb)"
                  icon={<CubeIcon className="h-3.5 w-3.5" />}
                  accept=".glb,.fbx,model/gltf-binary"
                  maxMb={MEDIA_MAX_UPLOAD_MB}
                  disabled={!isEditing}
                  isBusy={isUploadMediaPending || isDeleteMediaPending}
                  hasValue={!!draft.modelUrl || !!pendingModelFile}
                  hint={`GLB, FBX Â· ${MEDIA_SIZE_HINT}`}
                  caption={
                    pendingModelFile
                      ? `ÄÃ£ chá»n: ${pendingModelFile.name} (sáº½ táº£i lÃªn sau khi lÆ°u)`
                      : draft.modelUrl
                        ? "ÄÃ£ cÃ³ mÃ´ hÃ¬nh 3D"
                        : "ChÆ°a cÃ³ mÃ´ hÃ¬nh 3D"
                  }
                  onPick={(file) => handleMediaPick(file, "MODEL_3D", setPendingModelFile)}
                  onClear={() => handleMediaClear("MODEL_3D", pendingModelFile, setPendingModelFile)}
                />

                <StaffCharacterMediaPreview
                  imageUrl={draft.image}
                  modelUrl={draft.modelUrl}
                  alt={draft.name || "áº¢nh nhÃ¢n váº­t"}
                />
              </TabsContent>

              <TabsContent value="content" className="mt-0 space-y-5">
                {!isEditing ? (
                  <dl className="space-y-6">
                    {[
                      { label: "Tiá»ƒu sá»­ / Bá»‘i cáº£nh", value: draft.background },
                      { label: "TÃ­nh cÃ¡ch", value: draft.personality },
                      { label: "Giá»ng Ä‘á»c", value: draft.voiceId || "Máº·c Ä‘á»‹nh (Thiá»‡n Minh, nam)" },
                      {
                        label: "CÃ¡ch xÆ°ng hÃ´",
                        value: `Tá»± xÆ°ng "${draft.selfPronoun || "ta"}", gá»i ngÆ°á»i há»c "${draft.addressPronoun || "ngÆ°Æ¡i"}"`,
                      },
                    ].map((item) => (
                      <div key={item.label}>
                        <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--content-muted)]">{item.label}</dt>
                        <dd className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-[var(--content-heading)]">
                          {item.value || "â€”"}
                        </dd>
                      </div>
                    ))}
                  </dl>
                ) : (
              <div className="space-y-5">
                <div className="grid gap-1.5">
                  <StaffFormLabel>Tiá»ƒu sá»­ / Bá»‘i cáº£nh *</StaffFormLabel>
                  <StaffFormTextarea
                    value={draft.background}
                    onChange={(e) => set("background")(e.target.value)}
                    placeholder="MÃ´ táº£ cuá»™c Ä‘á»i, vai trÃ² lá»‹ch sá»­..."
                    className="min-h-30"
                    disabled={!isEditing}
                  />
                  <ValidationErrorText message={errors.background} />
                </div>

                <div className="grid gap-1.5">
                  <StaffFormLabel>TÃ­nh cÃ¡ch *</StaffFormLabel>
                  <StaffFormTextarea
                    value={draft.personality}
                    onChange={(e) => set("personality")(e.target.value)}
                    placeholder="Äáº·c Ä‘iá»ƒm tÃ­nh cÃ¡ch, phong cÃ¡ch nÃ³i chuyá»‡n..."
                    className="min-h-22.5"
                    disabled={!isEditing}
                  />
                  <ValidationErrorText message={errors.personality} />
                </div>

                <CharacterVoiceFields
                  value={{ voiceId: draft.voiceId, selfPronoun: draft.selfPronoun, addressPronoun: draft.addressPronoun }}
                  onChange={(patch) =>
                    (Object.entries(patch) as [keyof typeof patch, string][]).forEach(([field, value]) => set(field)(value))
                  }
                  disabled={!isEditing}
                  errors={{ selfPronoun: errors.selfPronoun, addressPronoun: errors.addressPronoun }}
                />
              </div>
                )}
              </TabsContent>

              {/* Kept mounted (hidden when inactive): a PDF picked and extracted here but not yet added must survive
                  switching tabs, e.g. to fix a duplicate name after a failed create. */}
              <TabsContent value="rag" forceMount className="data-[state=inactive]:hidden mt-0 space-y-3">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <ScrollIcon className="w-4 h-4 text-[var(--accent-blue)]" />
                    <p className="text-sm font-semibold text-[var(--content-heading)]">
                      TÃ i liá»‡u RAG kÃ¨m theo
                    </p>
                  </div>
                  <div className="p-3 border rounded-sm border-[var(--card-light-border)]">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <p className="text-sm font-semibold text-[var(--content-heading)]">
                        {mode === "edit" ? "TÃ i liá»‡u Ä‘Ã£ import" : "TÃ i liá»‡u"}
                      </p>
                    </div>

                    <div className="mb-3">
                      {/* Deferred: the document is saved by the page's Táº¡o / LÆ°u thay Ä‘á»•i, not a second button. Remounts
                          (empty) once a saved document shows up in the list, so it is not saved twice. */}
                      <NewDocumentPanel
                        key={`doc-panel-${documents.length}`}
                        deferred
                        onDraftChange={(doc) => {
                          set("documentTitle")(doc?.title ?? "");
                          set("documentContent")(doc?.content ?? "");
                          setPendingPdfFileUrl(doc?.fileUrl ?? null);
                          setPendingPdfFile(doc?.file ?? null);
                        }}
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
                        onExtractPdf={async (file, onProgress, signal, enableAiVision) => {
                          if (!onExtractPdfDocument) throw new Error("onExtractPdfDocument not provided");
                          return onExtractPdfDocument(file, onProgress, signal, enableAiVision);
                        }}
                        isExtractPdfPending={isExtractPdfDocumentPending}
                        onCreatePdf={async (data) => {
                          if (mode === "edit") {
                            if (onCreatePdfDocument) await onCreatePdfDocument(data);
                          } else {
                            set("documentTitle")(data.title);
                            set("documentContent")(data.content);
                            setPendingPdfFileUrl(data.fileUrl);
                            setPendingPdfFile(data.file);
                          }
                        }}
                        isCreatePdfPending={isCreatePdfDocumentPending}
                      />
                    </div>

                    {mode === "edit" ? (
                      isLoadingDocuments ? (
                        <p className="text-xs text-[var(--content-muted)]">Äang táº£i tÃ i liá»‡u...</p>
                      ) : documents.length ? (
                        <div className="space-y-2">
                          {documents.map((document, index) => {
                            const documentId = getDocumentId(document);

                            return (
                              <div
                                key={documentId ?? `character-document-${index}`}
                                className="flex items-start gap-2 p-2 border rounded-sm border-[var(--card-light-border)] bg-[var(--bg-elevated)]"
                              >
                                <button
                                  type="button"
                                  className="flex-1 min-w-0 text-left cursor-pointer"
                                  onClick={() => setViewingDocument(document)}
                                  title="Xem chi tiáº¿t tÃ i liá»‡u nÃ y"
                                >
                                  <p className="text-sm font-semibold truncate text-[var(--content-heading)]">
                                    {document.title || "TÃ i liá»‡u chÆ°a Ä‘áº·t tÃªn"}
                                  </p>
                                  <p className="mt-0.5 line-clamp-2 text-xs text-[var(--content-muted)]">
                                    {document.content || "ChÆ°a cÃ³ ná»™i dung"}
                                  </p>
                                </button>
                                <div className="flex items-center gap-1">
                                  {onGetDocumentPdfUrl && !!document.fileUrl && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon-sm"
                                      className="shrink-0 rounded-sm text-accent-gold hover:bg-(--accent-gold)/15"
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
                                      title="Xem PDF gá»‘c"
                                    >
                                      <EyeIcon className="w-4 h-4" />
                                    </Button>
                                  )}
                                  {isEditing && onUpdateDocument && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon-sm"
                                      className="rounded-sm shrink-0 text-content-heading"
                                      onClick={() => openDocumentEdit(document)}
                                      title="Sá»­a ná»™i dung"
                                    >
                                      <PencilIcon className="w-4 h-4" />
                                    </Button>
                                  )}
                                  {onDeleteDocument && isEditing && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon-sm"
                                      className="shrink-0 rounded-sm text-accent-danger hover:bg-(--accent-danger)/15"
                                      disabled={isDeleteDocumentPending}
                                      onClick={() => setDeleteDocumentTarget(document)}
                                      title="XÃ³a tÃ i liá»‡u"
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
                        <p className="text-xs text-[var(--content-muted)]">ChÆ°a cÃ³ tÃ i liá»‡u nÃ o.</p>
                      )
                    ) : !draft.documentContent.trim() && (
                      <p className="text-xs text-[var(--content-muted)]">
                        ChÆ°a cÃ³ tÃ i liá»‡u nÃ o. Báº¥m Â«TÃ i liá»‡u má»›iÂ» Ä‘á»ƒ Ä‘Ã­nh kÃ¨m; tÃ i liá»‡u Ä‘Æ°á»£c táº¡o cÃ¹ng nhÃ¢n váº­t.
                      </p>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="context" className="mt-0 space-y-5">
                {isCreated ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <LinkIcon className="w-4 h-4 text-[var(--accent-blue)]" />
                      <p className="text-sm font-semibold text-[var(--content-heading)]">
                        LiÃªn káº¿t bá»‘i cáº£nh lá»‹ch sá»­
                      </p>
                    </div>

                    {mappedContexts.length > 0 && (
                      <div className="space-y-2">
                        {mappedContexts.map(ctx => {
                          const event = eventOptions.find(ev => ev.id === ctx.contextId);
                          const isCtxPublished = event ? event.isPublished : true;
                          return (
                            <div
                              key={ctx.contextId}
                              className={cn(
                                "flex items-center gap-2 px-3 py-2.5 rounded-sm border group",
                                isCtxPublished
                                  ? "border-[var(--status-success-border)] bg-[var(--status-success-bg)]"
                                  : "border-[var(--border-strong)] bg-[var(--status-neutral-bg)]"
                              )}
                            >
                              {isCtxPublished ? (
                                <CheckCircleIcon className="w-4 h-4 shrink-0 text-[var(--status-success)]" />
                              ) : (
                                <span className="w-2 h-2 rounded-full bg-[var(--status-warning)] shrink-0 animate-pulse" />
                              )}
                              <p className={cn(
                                "flex-1 text-xs font-medium",
                                isCtxPublished ? "text-[var(--status-success)]" : "text-[var(--text-tertiary)]"
                              )}>
                                ÄÃ£ liÃªn káº¿t: {ctx.name} {!isCtxPublished && " (ChÆ°a xuáº¥t báº£n)"}
                              </p>
                              {onUnmapContext && (
                                <button
                                  onClick={() => handleRemoveContext(ctx.contextId)}
                                  disabled={isMapContextPending}
                                  className="p-1 text-[var(--accent-danger)] transition-all rounded-sm opacity-0 group-hover:opacity-100 hover:bg-[var(--status-danger-bg)] disabled:opacity-50"
                                  title="Gá»¡ liÃªn káº¿t"
                                >
                                  <TrashIcon className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Select
                           value={selectedContextId}
                           onValueChange={setSelectedContextId}
                           onOpenChange={contextSearch.onOpenChange}
                           disabled={isLoadingEvents || isMapContextPending}
                        >
                           <SelectTrigger>
                             <SelectValue
                               placeholder={isLoadingEvents ? "Äang táº£i..." : "Chá»n bá»‘i cáº£nh Ä‘á»ƒ liÃªn káº¿t"}
                             />
                           </SelectTrigger>
                           <SelectContent className="max-h-80">
                             <SelectSearch value={contextSearch.search} onChange={contextSearch.setSearch} placeholder="TÃ¬m bá»‘i cáº£nh..." />
                             {!eventOptions.some((ev) => contextSearch.matches(ev.title)) && <SelectEmpty />}
                             {eventOptions.filter((ev) => ev.id === selectedContextId || contextSearch.matches(ev.title)).map((ev) => {
                               const isSelectable = !draft.isPublished || ev.isPublished;
                               return (
                                 <SelectItem key={ev.id} value={ev.id} disabled={!isSelectable}>
                                   {ev.title} â€” {ev.year < 0 ? `${Math.abs(ev.year)} TCN` : ev.year}
                                   {!ev.isPublished && " (ChÆ°a xuáº¥t báº£n)"}
                                 </SelectItem>
                               );
                             })}
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
                        className={`shrink-0 border-0 transition-all duration-200 ${selectedContextId && !mappedContexts.some(c => c.contextId === selectedContextId)
                            ? "bg-[var(--accent-gold)] text-white hover:bg-[var(--accent-bronze)] cursor-pointer"
                            : ""
                          }`}
                      >
                        <LinkIcon className="h-4 w-4 mr-1.5" />
                        {isMapContextPending ? "Äang liÃªn káº¿t..." : "LiÃªn káº¿t"}
                      </Button>
                    </div>

                    {/* â”€â”€ Quick-create context â€” Sheet trigger â”€â”€ */}
                    <button
                      type="button"
                      className="w-full mt-2 flex items-center gap-2 px-3 py-2.5 rounded-sm text-xs font-semibold transition-all hover:bg-[var(--status-neutral-bg)] border text-[var(--accent-blue)] border-[var(--card-light-border)] bg-transparent"
                      onClick={() => setQuickCreateOpen(true)}
                    >
                      <PlusIcon className="h-3.5 w-3.5 shrink-0" />
                      Táº¡o nhanh bá»‘i cáº£nh má»›i
                      <span
                        className="ml-auto text-[10px] font-normal px-1.5 py-0.5 rounded-sm text-[var(--accent-blue)] bg-accent-blue/10"
                      >
                        Má»›i
                      </span>
                    </button>

                    {/* â”€â”€ Quick-create Sheet â”€â”€ */}
                    <Sheet open={quickCreateOpen} onOpenChange={setQuickCreateOpen}>
                      <SheetContent
                        side="right"
                        className="w-full sm:max-w-[480px] p-0 flex flex-col overflow-hidden bg-[var(--bg-content)] border-[var(--card-light-border)]"
                      >
                        {/* Sheet Header */}
                        <SheetHeader
                          className="px-6 py-5 border-b shrink-0 border-[var(--card-light-border)]"
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className="flex items-center justify-center w-8 h-8 rounded-sm shrink-0 bg-accent-blue/10"
                            >
                              <ScrollIcon className="w-4 h-4 text-[var(--accent-blue)]" />
                            </div>
                            <div>
                              <SheetTitle
                                className="text-base font-bold text-[var(--content-heading)]"
                              >
                                Táº¡o bá»‘i cáº£nh lá»‹ch sá»­ má»›i
                              </SheetTitle>
                              <SheetDescription
                                className="text-xs mt-0.5 text-[var(--content-muted)]"
                              >
                                Bá»‘i cáº£nh sáº½ Ä‘Æ°á»£c liÃªn káº¿t vá»›i nhÃ¢n váº­t nÃ y ngay sau khi táº¡o.
                              </SheetDescription>
                            </div>
                          </div>
                        </SheetHeader>

                        {/* Sheet Body â€” scrollable */}
                        <div className="flex-1 px-6 py-5 space-y-6 overflow-y-auto">

                          {/* Section: Ná»™i dung */}
                          <div className="space-y-4">
                            <p
                              className="text-xs font-semibold text-[var(--content-muted)]"
                            >
                              Ná»™i dung
                            </p>

                            <div className="grid gap-1.5">
                              <Label className="text-xs font-medium text-[var(--content-heading)]">
                                TÃªn bá»‘i cáº£nh <span className="text-accent-danger">*</span>
                              </Label>
                              <Input
                                id="qc-name"
                                value={quickCtx.name}
                                onChange={(e) => setQuickContextField("name")(e.target.value)}
                                placeholder="VD: Chiáº¿n tháº¯ng Báº¡ch Äáº±ng"
                                className="text-sm h-9"
                              />
                              <ValidationErrorText message={quickErrors.name} />
                            </div>

                            <div className="grid gap-1.5">
                              <Label className="text-xs font-medium text-[var(--content-heading)]">
                                MÃ´ táº£ <span className="text-accent-danger">*</span>
                              </Label>
                              <textarea
                                id="qc-description"
                                value={quickCtx.description}
                                onChange={(e) => setQuickContextField("description")(e.target.value)}
                                placeholder="Bá»‘i cáº£nh lá»‹ch sá»­, Ã½ nghÄ©a sá»± kiá»‡n..."
                                rows={4}
                                className="w-full px-3 py-2 text-sm transition-colors border rounded-sm outline-none resize-none focus:ring-1 focus:ring-[var(--accent-gold)] border-[var(--card-light-border)] bg-[var(--bg-content)] text-[var(--content-text)]"
                              />
                              <ValidationErrorText message={quickErrors.description} />
                            </div>

                            <div className="grid gap-1.5">
                              <Label className="text-xs font-medium flex items-center gap-1.5 text-[var(--content-heading)]">
                                <MapPinIcon className="h-3.5 w-3.5" />
                                Äá»‹a Ä‘iá»ƒm <span className="text-accent-danger">*</span>
                              </Label>
                              <Input
                                id="qc-location"
                                value={quickCtx.location}
                                onChange={(e) => setQuickContextField("location")(e.target.value)}
                                placeholder="VD: SÃ´ng Báº¡ch Äáº±ng, Quáº£ng Ninh"
                                className="text-sm h-9"
                              />
                              <ValidationErrorText message={quickErrors.location} />
                            </div>
                          </div>

                          {/* Divider */}
                          <div className="h-px bg-[var(--card-light-border)]" />

                          {/* Section: PhÃ¢n loáº¡i & Thá»i gian */}
                          <div className="space-y-4">
                            <p
                              className="text-xs font-semibold text-[var(--content-muted)]"
                            >
                              PhÃ¢n loáº¡i &amp; Thá»i gian
                            </p>

                            <div className="grid grid-cols-2 gap-3">
                              <div className="grid gap-1.5">
                                <Label className="text-xs font-medium text-[var(--content-heading)]">
                                  Thá»i Ä‘áº¡i <span className="text-accent-danger">*</span>
                                </Label>
                                <Select
                                  value={quickCtx.era}
                                  onValueChange={(v) => setQuickContextField("era")(v as EventEraBackend)}
                                >
                                  <SelectTrigger className="text-sm h-9">
                                    <SelectValue placeholder="Chá»n thá»i Ä‘áº¡i" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="ANCIENT">Cá»• Ä‘áº¡i</SelectItem>
                                    <SelectItem value="MEDIEVAL">Trung Ä‘áº¡i</SelectItem>
                                    <SelectItem value="MODERN">Cáº­n Ä‘áº¡i</SelectItem>
                                    <SelectItem value="CONTEMPORARY">Hiá»‡n Ä‘áº¡i</SelectItem>
                                  </SelectContent>
                                </Select>
                                <ValidationErrorText message={quickErrors.era} />
                              </div>

                              <div className="grid gap-1.5">
                                <Label className="text-xs font-medium text-[var(--content-heading)]">
                                  NÄƒm <span className="text-accent-danger">*</span>
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
                          <div className="h-px bg-[var(--card-light-border)]" />

                          {/* Section: Media */}
                          <div className="space-y-4">
                            <p
                              className="text-xs font-semibold text-[var(--content-muted)]"
                            >
                              Media (tuá»³ chá»n)
                            </p>

                            <div className="grid gap-1.5">
                              <Label className="text-xs font-medium flex items-center gap-1.5 text-[var(--content-heading)]">
                                <ImageIcon className="h-3.5 w-3.5" />
                                URL hÃ¬nh áº£nh
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
                              <Label className="text-xs font-medium flex items-center gap-1.5 text-[var(--content-heading)]">
                                <VideoIcon className="h-3.5 w-3.5" />
                                URL video (tuá»³ chá»n â€” cÃ³ thá»ƒ táº£i file video lÃªn sau khi táº¡o)
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
                          <div className="h-px bg-[var(--card-light-border)]" />

                          {/* Section: Tráº¡ng thÃ¡i */}
                          <div
                            className={`flex items-center justify-between gap-3 px-4 py-3 transition-colors border rounded-sm ${quickCtx.isPublished ? "border-[var(--status-success-border)] bg-[var(--status-success-bg)]" : "border-[var(--border-strong)] bg-[var(--status-neutral-bg)]"}`}
                          >
                            <div className="flex-1">
                              <p
                                className={`text-sm font-semibold ${quickCtx.isPublished ? "text-[var(--status-success)]" : "text-[var(--text-tertiary)]"}`}
                              >
                                {quickCtx.isPublished ? "ÄÃ£ xuáº¥t báº£n" : "ChÆ°a xuáº¥t báº£n"}
                              </p>
                              <p className="text-xs mt-0.5 text-[var(--content-muted)]">
                                {quickCtx.isPublished
                                  ? "Bá»‘i cáº£nh Ä‘ang hiá»ƒn thá»‹ cÃ´ng khai cho ngÆ°á»i dÃ¹ng."
                                  : "Báº­t Ä‘á»ƒ hiá»ƒn thá»‹ bá»‘i cáº£nh cho ngÆ°á»i dÃ¹ng."}
                              </p>
                            </div>
                            <button
                              type="button"
                              role="switch"
                              aria-checked={quickCtx.isPublished}
                              onClick={() => setQuickContextField("isPublished")(!quickCtx.isPublished)}
                              className={`relative inline-flex h-6 transition-colors border-2 border-transparent rounded-full cursor-pointer w-11 shrink-0 focus-visible:outline-none ${quickCtx.isPublished ? "bg-[var(--status-success)]" : "bg-[var(--border-strong)]"}`}
                            >
                              <span
                                className={`block w-5 h-5 transition-transform rounded-full shadow-lg pointer-events-none bg-white ${quickCtx.isPublished ? "translate-x-5" : "translate-x-0"}`}
                              />
                            </button>
                          </div>
                        </div>

                        {/* Sheet Footer */}
                        <div
                          className="flex items-center justify-end gap-2 px-6 py-4 border-t shrink-0 border-[var(--card-light-border)]"
                        >
                          <Button
                            variant="outline"
                            className="rounded-sm bg-transparent border-border-card hover:bg-[var(--status-neutral-bg)] transition-colors text-[var(--content-heading)]"
                            onClick={() => {
                              setQuickCreateOpen(false);
                              resetQuickCtx();
                            }}
                          >
                            Huá»·
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
                            className="border-0 bg-[var(--accent-gold)] text-white hover:bg-[var(--accent-bronze)] transition-all duration-200 cursor-pointer"
                            onClick={() => {
                              const nextErrors = validateContextDraft(quickCtx);
                              if (hasValidationErrors(nextErrors)) {
                                toast.error("Vui lÃ²ng kiá»ƒm tra thÃ´ng tin bá»‘i cáº£nh.");
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
                                    toast.success("Táº¡o bá»‘i cáº£nh thÃ nh cÃ´ng!");
                                  },
                                },
                              );
                            }}
                          >
                            <PlusIcon className="h-4 w-4 mr-1.5" />
                            {createEvent.isPending ? "Äang táº¡o..." : "Táº¡o bá»‘i cáº£nh"}
                          </Button>
                        </div>
                      </SheetContent>
                    </Sheet>
                  </div>
                ) : (
                  <div
                    className="px-4 py-8 text-center border border-dashed rounded-sm border-[var(--card-light-border)]"
                  >
                    <LinkIcon className="w-5 h-5 mx-auto mb-2 text-[var(--content-muted)]" />
                    <p className="text-sm text-[var(--content-muted)]">
                      Táº¡o nhÃ¢n váº­t trÆ°á»›c Ä‘á»ƒ liÃªn káº¿t vá»›i bá»‘i cáº£nh lá»‹ch sá»­.
                    </p>
                  </div>
                )}
              </TabsContent>
            </div>

            {/* Save bar â€” pinned to the bottom of the form column, so Save is always in reach while editing. */}
            {isEditing && (
              <div className="flex shrink-0 items-center justify-between gap-3 border-t px-6 py-3 border-[var(--border-default)] bg-[var(--bg-main)]">
                <p className="text-sm text-[var(--content-muted)]">
                  {isDirty ? "CÃ³ thay Ä‘á»•i chÆ°a lÆ°u" : isCreated ? "Äang chá»‰nh sá»­a" : "Äiá»n thÃ´ng tin Ä‘á»ƒ táº¡o nhÃ¢n váº­t"}
                </p>
                <div className="flex items-center gap-2">
                  {isCreated && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-sm bg-transparent border-border-card hover:bg-[var(--status-neutral-bg)] hover:text-[var(--content-heading)] text-[var(--content-heading)] transition-colors"
                      onClick={() => {
                        if (isDirty) {
                          setCancelDialogOpen(true);
                        } else {
                          setIsEditing(false);
                        }
                      }}
                    >
                      Há»§y
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={handleSaveClick}
                    disabled={!canSave}
                    className="border-0 bg-[var(--accent-gold)] text-white hover:bg-[var(--accent-bronze)] font-semibold transition-all duration-200 cursor-pointer"
                  >
                    {isPending ? "Äang lÆ°u..." : isCreated ? "LÆ°u thay Ä‘á»•i" : "Táº¡o nhÃ¢n váº­t"}
                  </Button>
                </div>
              </div>
            )}
          </Tabs>
        </div>

        {/* â”€â”€ Right Panel: test chat â”€â”€ */}
        <div className="flex-1 flex flex-col min-w-0 relative bg-[var(--bg-app)]">
          <div className="flex shrink-0 items-center gap-2 border-b px-6 py-2.5 border-[var(--border-default)] bg-[var(--bg-main)]">
            <ChatCircleDotsIcon className="h-4 w-4 text-[var(--accent-gold)]" aria-hidden="true" />
            <p className="whitespace-nowrap text-sm font-semibold text-[var(--content-heading)]">Thá»­ trÃ² chuyá»‡n</p>
            <p className="hidden truncate text-xs text-[var(--content-muted)] lg:block">Â· Kiá»ƒm tra cÃ¡ch nhÃ¢n váº­t tráº£ lá»i theo ná»™i dung Ä‘Ã£ lÆ°u</p>
            {canStartChat && (
              <div className="ml-auto flex shrink-0 overflow-hidden rounded-sm border border-[var(--border-strong)]" role="group" aria-label="Cháº¿ Ä‘á»™ thá»­">
                {(["CHAT", "EXAM"] as const).map((mode) => {
                  const active = (isStartingTestExam ? "EXAM" : testSessionMode) === mode;
                  return (
                    <button
                      key={mode}
                      type="button"
                      aria-pressed={active}
                      disabled={isStartingTestExam}
                      title={mode === "CHAT" ? "Báº¡n há»i, nhÃ¢n váº­t tráº£ lá»i" : "NhÃ¢n váº­t há»i, cháº¥m vÃ  cho Ä‘iá»ƒm"}
                      onClick={() => (mode === "CHAT" ? startTestInterview() : setIsTestExamDialogOpen(true))}
                      className={cn(
                        "px-3 py-1 text-xs font-semibold transition-colors disabled:opacity-60",
                        active
                          ? "bg-[var(--text-primary)] text-[var(--text-inverse)]"
                          : "text-[var(--content-heading)] hover:bg-[var(--status-neutral-bg)]",
                      )}
                    >
                      {CHAT_MODE_LABELS[mode]}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <ExamStartDialog
            open={isTestExamDialogOpen}
            characterName={chatCharacter.name}
            onOpenChange={setIsTestExamDialogOpen}
            onStart={startTestExam}
          />
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
              <div className="w-full max-w-2xl aspect-[4/3] relative rounded-sm overflow-hidden border border-[var(--card-light-border)]">
                {/* Blurred mock-up */}
                <div className="absolute inset-0 bg-[var(--bg-elevated)] opacity-60" />
                <div className="absolute inset-0 flex flex-col p-8 space-y-6 opacity-20 bg-[var(--bg-deep)]">
                  <div className="w-48 h-12 bg-[var(--bg-deep)] rounded-sm" />
                  <div className="w-2/3 h-24 bg-[var(--bg-deep)] rounded-sm" />
                  <div className="w-1/2 h-24 ml-auto bg-[var(--bg-deep)] rounded-sm" />
                  <div className="w-3/4 h-24 bg-[var(--bg-deep)] rounded-sm" />
                </div>

                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="px-6 space-y-4 text-center">
                    <div className="w-20 h-20 bg-[var(--bg-elevated)] rounded-sm flex items-center justify-center mx-auto border border-[var(--card-light-border)]">
                      <ChatCircleDotsIcon className="w-10 h-10 text-[var(--accent-gold)]" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-[var(--content-heading)]">
                        Há»‡ thá»‘ng Ä‘á»‘i thoáº¡i chÆ°a khá»Ÿi táº¡o
                      </h3>
                      <p className="max-w-sm mx-auto mt-1 text-sm text-[var(--content-muted)]">
                        {!isCreated
                          ? "HÃ£y hoÃ n táº¥t thÃ´ng tin vÃ  'Táº¡o nhÃ¢n váº­t' Ä‘á»ƒ báº¯t Ä‘áº§u tráº£i nghiá»‡m AI."
                          : hasPublishErrors
                            ? "NhÃ¢n váº­t cáº§n Ä‘á»§ thÃ´ng tin vÃ  URL hÃ¬nh áº£nh há»£p lá»‡ trÆ°á»›c khi chat."
                            : "Báº¡n cáº§n liÃªn káº¿t nhÃ¢n váº­t vá»›i má»™t 'Bá»‘i cáº£nh lá»‹ch sá»­' á»Ÿ khung bÃªn trÃ¡i Ä‘á»ƒ AI cÃ³ thá»ƒ hiá»ƒu Ä‘Æ°á»£c bá»‘i cáº£nh trÃ² chuyá»‡n."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

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
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-[var(--status-neutral-bg)] text-[var(--text-tertiary)]"
            >
              CÃ³ PDF gá»‘c
            </span>
          ) : undefined
        }
      />

      {/* Document edit â€” header/footer stay fixed, only the middle scrolls,
          so "LÆ°u thay Ä‘á»•i" never needs a scroll-to-find on long content. */}
      <Dialog open={!!editingDocument} onOpenChange={(open) => !open && closeDocumentEdit()}>
        <DialogContent className="flex max-h-[85vh] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-[680px]">
          <DialogHeader className="shrink-0 border-b px-6 py-4 border-[var(--card-light-border)]">
            <DialogTitle>Sá»­a tÃ i liá»‡u</DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 px-6 py-4 space-y-4 overflow-y-auto">
            <div className="grid gap-1.5">
              <StaffFormLabel>TiÃªu Ä‘á»</StaffFormLabel>
              <StaffFormInput
                value={editDraftTitle}
                onChange={(e) => setEditDraftTitle(e.target.value)}
                placeholder="TiÃªu Ä‘á» tÃ i liá»‡u"
                disabled={isSavingDocumentEdit}
              />
            </div>
            <div className="grid gap-1.5">
              <div className="flex items-center justify-between">
                <StaffFormLabel>Ná»™i dung</StaffFormLabel>
                <div className="flex items-center gap-2">
                  {(() => {
                    const imgCount = (editDraftContent.match(/!\[.*?\]\(.*?\)/g) || []).length;
                    return imgCount > 0 ? (
                      <span className="text-[11px] font-medium text-accent-gold bg-accent-gold/10 px-2 py-0.5 rounded-sm">
                        {imgCount} hÃ¬nh áº£nh
                      </span>
                    ) : null;
                  })()}
                  <span className="text-micro text-[var(--content-muted)]">
                    {editDraftContent.length.toLocaleString("vi-VN")} kÃ½ tá»±
                  </span>
                  <div className="inline-flex rounded-sm border border-[var(--card-light-border)] p-0.5 bg-[var(--bg-elevated)]">
                    <button
                      type="button"
                      onClick={() => setCharEditDocTab("split")}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-sm transition-colors ${
                        charEditDocTab === "split"
                          ? "bg-[var(--accent-gold)] text-white shadow-xs"
                          : "text-content-muted hover:text-content-heading"
                      }`}
                      title="Cháº¿ Ä‘á»™ song song: Vá»«a sá»­a thÃ´ vá»«a xem trÆ°á»›c"
                    >
                      <ColumnsIcon className="h-3 w-3" />
                      Song song
                    </button>
                    <button
                      type="button"
                      onClick={() => setCharEditDocTab("edit")}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-sm transition-colors ${
                        charEditDocTab === "edit"
                          ? "bg-[var(--accent-gold)] text-white shadow-xs"
                          : "text-content-muted hover:text-content-heading"
                      }`}
                    >
                      <PencilIcon className="h-3 w-3" />
                      Chá»‰nh sá»­a
                    </button>
                    <button
                      type="button"
                      onClick={() => setCharEditDocTab("preview")}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-sm transition-colors ${
                        charEditDocTab === "preview"
                          ? "bg-[var(--accent-gold)] text-white shadow-xs"
                          : "text-content-muted hover:text-content-heading"
                      }`}
                    >
                      <EyeIcon className="h-3 w-3" />
                      Xem trÆ°á»›c
                    </button>
                  </div>
                </div>
              </div>
              {charEditDocTab === "split" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  <div className="flex flex-col">
                    <span className="text-[11px] font-semibold text-content-muted mb-1 flex items-center gap-1">
                      <PencilIcon className="h-3 w-3" /> VÄƒn báº£n thÃ´ (Raw)
                    </span>
                    <StaffFormTextarea
                      value={editDraftContent}
                      onChange={(e) => setEditDraftContent(e.target.value)}
                      placeholder="Ná»™i dung tÃ i liá»‡u"
                      className="min-h-65 max-h-96"
                      disabled={isSavingDocumentEdit}
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-semibold text-content-muted mb-1 flex items-center gap-1">
                      <EyeIcon className="h-3 w-3" /> Xem trÆ°á»›c trá»±c tiáº¿p (Real-time)
                    </span>
                    <div className="rounded-sm border border-[var(--card-light-border)] bg-[var(--bg-elevated)] p-4 text-xs overflow-y-auto min-h-65 max-h-96 leading-relaxed">
                      {deferredCharEditContent.trim() ? (
                        <MarkdownMessage text={deferredCharEditContent} />
                      ) : (
                        <p className="italic text-content-muted">ChÆ°a cÃ³ ná»™i dung Ä‘á»ƒ xem trÆ°á»›c</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : charEditDocTab === "edit" ? (
                <StaffFormTextarea
                  value={editDraftContent}
                  onChange={(e) => setEditDraftContent(e.target.value)}
                  placeholder="Ná»™i dung tÃ i liá»‡u"
                  className="min-h-65"
                  disabled={isSavingDocumentEdit}
                />
              ) : (
                <div
                  className="rounded-sm border border-[var(--card-light-border)] bg-[var(--bg-elevated)] p-4 text-xs overflow-y-auto min-h-65 max-h-96 leading-relaxed"
                >
                  {deferredCharEditContent.trim() ? (
                    <MarkdownMessage text={deferredCharEditContent} />
                  ) : (
                    <p className="italic text-content-muted">ChÆ°a cÃ³ ná»™i dung Ä‘á»ƒ xem trÆ°á»›c</p>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex shrink-0 justify-end gap-2 border-t px-6 py-4 border-[var(--card-light-border)]">
            <Button type="button" variant="outline" onClick={closeDocumentEdit} disabled={isSavingDocumentEdit}>
              Há»§y
            </Button>
            <Button
              type="button"
              onClick={() => {
                // The pending create-mode document has no real id yet â€” just
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
              {isSavingDocumentEdit || isUpdateDocumentPending ? "Äang lÆ°u..." : "LÆ°u thay Ä‘á»•i"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete document confirm */}
      <ConfirmDialog
        open={!!deleteDocumentTarget}
        onOpenChange={(open) => !open && setDeleteDocumentTarget(null)}
        title="XÃ³a tÃ i liá»‡u?"
        description={`TÃ i liá»‡u "${deleteDocumentTarget?.title || "chÆ°a Ä‘áº·t tÃªn"}" sáº½ bá»‹ xÃ³a vÄ©nh viá»…n khá»i nhÃ¢n váº­t nÃ y.`}
        confirmLabel="XÃ³a"
        variant="danger"
        isPending={isDeleteDocumentPending}
        onConfirm={() => {
          const docId = deleteDocumentTarget ? getDocumentId(deleteDocumentTarget) : undefined;
          if (!docId) return;
          if (docId === PENDING_DOCUMENT_ID) {
            set("documentTitle")("");
            set("documentContent")("");
            setPendingPdfFileUrl(null);
            setPendingPdfFile(null);
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
