"use client";

import * as React from "react";
import {
  ArrowLeftIcon,
  PencilIcon,
  FloppyDiskIcon,
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
  UploadSimpleIcon,
  FilePdfIcon,
} from "@phosphor-icons/react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
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
import { ConfirmDialog } from "@/components/commons/confirm-dialog";
import { ChatMain } from "@/components/chat/chat-main";
import { useChatSessions, useCreateSession } from "@/features/chat/hooks";
import type { ChatCharacter } from "@/services/chat.service";
import type { HistoricalEvent, EventEraBackend } from "@/services/event.service";
import { useCreateEvent } from "@/features/events/hooks";
import { toast } from "sonner";
import type { RagDocument } from "@/services/document.service";
import { PdfUploadDialog } from "@/components/staff/pdf-upload-dialog";
import { PdfViewerDialog } from "@/components/staff/pdf-viewer-dialog";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type CharacterDraft = {
  id?: string;
  name: string;
  title: string;
  background: string;
  image: string;
  modelUrl: string;
  personality: string;
  bornYear: string;
  bornMonth: string;
  bornDay: string;
  isBornBc: boolean;
  deathYear: string;
  deathMonth: string;
  deathDay: string;
  isDeathBc: boolean;
  isActive: boolean;
  isPublished: boolean;
  documentId?: string;
  documentTitle: string;
  documentContent: string;
  pendingPdfFile?: File | null;
};

export const EMPTY_CHARACTER_DRAFT: CharacterDraft = {
  name: "",
  title: "",
  background: "",
  image: "",
  modelUrl: "",
  personality: "",
  bornYear: "",
  bornMonth: "",
  bornDay: "",
  isBornBc: false,
  deathYear: "",
  deathMonth: "",
  deathDay: "",
  isDeathBc: false,
  isActive: true,
  isPublished: false,
  documentId: undefined,
  documentTitle: "",
  documentContent: "",
  pendingPdfFile: null,
};

interface StaffCharacterDetailViewProps {
  mode: "create" | "edit";
  initialDraft?: CharacterDraft;
  onSave: (draft: CharacterDraft) => void;
  isPending: boolean;
  eventOptions: HistoricalEvent[];
  isLoadingEvents: boolean;
  /** After a character is created/exists, this is the created character id */
  createdCharacterId?: string | null;
  /** Callback to map a context to the character */
  onMapContext: (
    characterId: string,
    contextId: string,
    options?: { onSuccess?: () => void },
  ) => void;
  isMapContextPending?: boolean;
  /** The currently mapped contextId (from character data) */
  initialContextId?: string;
  /** If true, start in editing mode immediately (e.g. navigated from Edit button) */
  initialEditing?: boolean;
  documents?: RagDocument[];
  isLoadingDocuments?: boolean;
  onDeleteDocument?: (docId: string) => void;
  isDeleteDocumentPending?: boolean;
  /** Callback to upload PDF to a document */
  onUploadDocumentPdf?: (docId: string, file: File) => Promise<void>;
  isUploadDocumentPdfPending?: boolean;
  /** Callback to get PDF URL for viewing */
  onGetDocumentPdfUrl?: (docId: string) => Promise<{ url: string; expiresIn: number }>;
  isGetDocumentPdfUrlPending?: boolean;
  /** Callback after create success to upload PDF (only for create mode) */
  onUploadPdfAfterCreate?: (docId: string, file: File) => Promise<void>;
  isUploadPdfAfterCreatePending?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function StaffCharacterDetailView({
  mode,
  initialDraft,
  onSave,
  isPending,
  eventOptions,
  isLoadingEvents,
  createdCharacterId,
  onMapContext,
  isMapContextPending,
  initialContextId,
  initialEditing,
  documents = [],
  isLoadingDocuments = false,
  onDeleteDocument,
  isDeleteDocumentPending = false,
  onUploadDocumentPdf,
  isUploadDocumentPdfPending = false,
  onGetDocumentPdfUrl,
  isGetDocumentPdfUrlPending = false,
  onUploadPdfAfterCreate,
  isUploadPdfAfterCreatePending = false,
}: StaffCharacterDetailViewProps) {
  const router = useRouter();

  /* ── State ── */
  const [draft, setDraft] = React.useState<CharacterDraft>(initialDraft || EMPTY_CHARACTER_DRAFT);
  const [isEditing, setIsEditing] = React.useState(mode === "create" || !!initialEditing);
  const [publishDialogOpen, setPublishDialogOpen] = React.useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = React.useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = React.useState(false);

  /* ── PDF Dialog State ── */
  const [uploadDialogOpen, setUploadDialogOpen] = React.useState(false);
  const [uploadTargetDocId, setUploadTargetDocId] = React.useState<string | null>(null);
  const [viewerOpen, setViewerOpen] = React.useState(false);
  const [viewerUrl, setViewerUrl] = React.useState<string | null>(null);
  const [viewerLoading, setViewerLoading] = React.useState(false);

  /* ── PDF File for Create Mode ── */
  const [pendingPdfFile, setPendingPdfFile] = React.useState<File | null>(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  /* Detect if form is dirty */
  const isDirty = React.useMemo(() => {
    if (!initialDraft) return draft.name !== "" || draft.title !== "";
    
    // Deep comparison of relevant fields
    const keys: (keyof CharacterDraft)[] = [
      "name", "title", "background", "image", "modelUrl", "personality",
      "bornYear", "bornMonth", "bornDay", "isBornBc",
      "deathYear", "deathMonth", "deathDay", "isDeathBc",
      "isActive", "isPublished", "documentId", "documentTitle", "documentContent"
    ];
    
    return keys.some(key => {
      const v1 = draft[key] ?? "";
      const v2 = initialDraft[key] ?? "";
      return v1 !== v2;
    });
  }, [draft, initialDraft]);

  /* helper to set a single field */
  const set =
    (field: keyof CharacterDraft) => (val: string | boolean) =>
      setDraft((s) => ({ ...s, [field]: val }));

  const getDocumentId = React.useCallback(
    (document: RagDocument) => document.id ?? document.documentId,
    [],
  );

  const selectDocument = (document: RagDocument) => {
    setDraft((s) => ({
      ...s,
      documentId: getDocumentId(document),
      documentTitle: document.title ?? "",
      documentContent: document.content ?? "",
    }));
  };

  const [skipAutoSelect, setSkipAutoSelect] = React.useState(false);

  const clearDocumentDraft = () => {
    setSkipAutoSelect(true);
    setDraft((s) => ({
      ...s,
      documentId: undefined,
      documentTitle: "",
      documentContent: "",
    }));
  };

  /* ── Chat state ── */
  const [sessionId, setSessionId] = React.useState<string | null>(null);

  /* ── Context mapping state ── */
  const [selectedContextId, setSelectedContextId] = React.useState<string>("");
  const [mappedContextId, setMappedContextId] = React.useState<string>("");

  /* ── Quick-create context state ── */
  const [quickCreateOpen, setQuickCreateOpen] = React.useState(false);
  const [quickCtx, setQuickCtx] = React.useState({
    name: "",
    description: "",
    era: "" as EventEraBackend | "",
    year: "",
    location: "",
    imageUrl: "",
    videoUrl: "",
    isPublished: false,
  });
  const createEvent = useCreateEvent();

  // Reset state/sync when props change (especially for edit mode)
  React.useEffect(() => {
    if (initialDraft) {
      setDraft(initialDraft);
    }
  }, [initialDraft]);

  // Reset skipAutoSelect when initialDraft changes (different character loaded)
  React.useEffect(() => {
    if (skipAutoSelect) {
      setSkipAutoSelect(false);
    }
  }, [initialDraft?.id]);

  React.useEffect(() => {
    if (mode !== "edit" || draft.documentId || draft.documentContent || skipAutoSelect) return;
    const firstDocument = documents[0];
    if (!firstDocument) return;
    setDraft((s) => ({
      ...s,
      documentId: getDocumentId(firstDocument),
      documentTitle: firstDocument.title ?? "",
      documentContent: firstDocument.content ?? "",
    }));
  }, [documents, draft.documentContent, draft.documentId, getDocumentId, mode, skipAutoSelect]);

  React.useEffect(() => {
    setSelectedContextId(initialContextId ?? "");
    setMappedContextId(initialContextId ?? "");
  }, [initialContextId]);

  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty && isEditing) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty, isEditing]);

  // Auto-exit editing mode after save completes successfully
  const prevPendingRef = React.useRef(false);
  React.useEffect(() => {
    if (prevPendingRef.current && !isPending) {
      const nowCreated = !!(createdCharacterId || draft.id);
      if (nowCreated) {
        setIsEditing(false);
      }
    }
    prevPendingRef.current = isPending;
  }, [isPending, createdCharacterId, draft.id]);

  /* Whether the character has been persisted (has an id) */
  const isCreated = !!(createdCharacterId || draft.id);
  const characterId = createdCharacterId || draft.id || "";

  // Fetch or create session when character becomes active
  const { data: sessions, isSuccess: isSessionsSuccess } = useChatSessions(
    mappedContextId,
    characterId,
    isCreated && !!mappedContextId
  );

  const createSession = useCreateSession();
  const sessionInitialized = React.useRef(false);

  React.useEffect(() => {
    if (!isCreated || !mappedContextId) return;
    if (!isSessionsSuccess) return;
    if (sessionInitialized.current) return;
    if (sessionId) return;

    sessionInitialized.current = true;

    if (sessions && sessions.length > 0) {
      setSessionId(sessions[0].id);
    } else {
      createSession.mutateAsync({
        contextId: mappedContextId,
        characterId
      }).then((session) => {
        setSessionId(session.id);
      }).catch(console.error);
    }
  }, [isCreated, mappedContextId, characterId, isSessionsSuccess, sessions, sessionId, createSession]);

  /* Build a ChatCharacter object from the draft for the right panel */
  const chatCharacter: ChatCharacter = {
    id: characterId,
    name: draft.name || "Nhân vật mới",
    title: draft.title || "Chức vị",
    description: draft.background || undefined,
    imageUrl: isValidUrl(draft.image) ? draft.image : "",
    modelUrl: isValidUrl(draft.modelUrl) ? draft.modelUrl : null,
    contextId: mappedContextId || undefined,
  };

  /* Determine if form can be submitted */
  const canSave = draft.name.trim() && draft.title.trim() && !isPending;

  /* Handle context mapping */
  const handleMapContext = () => {
    if (!selectedContextId || !characterId) return;
    onMapContext(characterId, selectedContextId, {
      onSuccess: () => {
        setMappedContextId(selectedContextId);
        setSessionId(null);
        sessionInitialized.current = false;
      },
    });
  };

  /* Get the name of the mapped context */
  const mappedContextName = React.useMemo(() => {
    if (!mappedContextId) return "";
    const ev = eventOptions.find((e) => e.id === mappedContextId);
    if (!ev) return "";
    return `${ev.title} — ${ev.year < 0 ? `${Math.abs(ev.year)} TCN` : ev.year}`;
  }, [mappedContextId, eventOptions]);

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
            onClick={() => {
              if (isDirty && isEditing) {
                setLeaveDialogOpen(true);
              } else {
                router.push("/staff/characters");
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
              {isValidUrl(draft.image) && (
                <Image
                  src={draft.image}
                  alt={draft.name || "avatar"}
                  fill
                  className="object-cover"
                />
              )}
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight" style={{ color: "var(--content-heading)" }}>
                {mode === "create" && !isCreated
                  ? "Tạo nhân vật mới"
                  : draft.name || "Nhân vật"}
              </h1>
              <p className="text-xs" style={{ color: "var(--content-muted)" }}>
                {mode === "create" && !isCreated
                  ? "Điền thông tin bên trái, xem preview chat bên phải"
                  : draft.title}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isCreated && !isEditing && (
            <Button
              variant="outline"
              size="sm"
              className="bg-transparent border-[var(--card-light-border)] hover:bg-black/5 text-[var(--content-heading)]"
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
          if (initialDraft) setDraft(initialDraft);
          setIsEditing(false);
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
          className="w-[480px] shrink-0 border-r overflow-y-auto"
          style={{ borderColor: "var(--card-light-border)" }}
        >
          <div className="px-6 py-6 space-y-5">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--content-heading)" }}>
              Thông tin nhân vật
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <StaffFormLabel>Tên nhân vật *</StaffFormLabel>
                <StaffFormInput
                  value={draft.name}
                  onChange={(e) => set("name")(e.target.value)}
                  placeholder="VD: Ngô Quyền"
                  disabled={!isEditing}
                />
              </div>
              <div className="grid gap-1.5">
                <StaffFormLabel>Chức vị *</StaffFormLabel>
                <StaffFormInput
                  value={draft.title}
                  onChange={(e) => set("title")(e.target.value)}
                  placeholder="VD: Tiết độ sứ"
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div className="grid gap-3">
              <StaffFormLabel>Ngày sinh</StaffFormLabel>
              <div className="grid grid-cols-[1fr_1fr_1.2fr_auto] gap-2 items-end">
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
                <label className="flex h-10 items-center gap-2 rounded-md border px-3 text-xs font-medium" style={{ borderColor: "var(--card-light-border)", color: "var(--content-heading)" }}>
                  <Checkbox
                    checked={draft.isBornBc}
                    onCheckedChange={(val) => set("isBornBc")(!!val)}
                    disabled={!isEditing}
                  />
                  TCN
                </label>
              </div>
            </div>

            <div className="grid gap-3">
              <StaffFormLabel>Ngày mất</StaffFormLabel>
              <div className="grid grid-cols-[1fr_1fr_1.2fr_auto] gap-2 items-end">
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
                <label className="flex h-10 items-center gap-2 rounded-md border px-3 text-xs font-medium" style={{ borderColor: "var(--card-light-border)", color: "var(--content-heading)" }}>
                  <Checkbox
                    checked={draft.isDeathBc}
                    onCheckedChange={(val) => set("isDeathBc")(!!val)}
                    disabled={!isEditing}
                  />
                  TCN
                </label>
              </div>
            </div>

            <div className="grid gap-1.5">
              <StaffFormLabel>URL hình ảnh</StaffFormLabel>
              <StaffFormInput
                value={draft.image}
                onChange={(e) => set("image")(e.target.value)}
                placeholder="https://..."
                disabled={!isEditing}
              />
            </div>

            <div className="grid gap-1.5">
              <StaffFormLabel>URL mô hình 3D (.glb / .fbx)</StaffFormLabel>
              <StaffFormInput
                value={draft.modelUrl}
                onChange={(e) => set("modelUrl")(e.target.value)}
                placeholder="https://...model.glb"
                disabled={!isEditing}
              />
            </div>

            <div className="grid gap-1.5">
              <StaffFormLabel>Tiểu sử / Bối cảnh</StaffFormLabel>
              <StaffFormTextarea
                value={draft.background}
                onChange={(e) => set("background")(e.target.value)}
                placeholder="Mô tả cuộc đời, vai trò lịch sử..."
                style={{ minHeight: "120px" }}
                disabled={!isEditing}
              />
            </div>

            <div className="grid gap-1.5">
              <StaffFormLabel>Tính cách</StaffFormLabel>
              <StaffFormTextarea
                value={draft.personality}
                onChange={(e) => set("personality")(e.target.value)}
                placeholder="Đặc điểm tính cách, phong cách nói chuyện..."
                style={{ minHeight: "90px" }}
                disabled={!isEditing}
              />
            </div>

            <div
              className="pt-5 mt-2 border-t space-y-3"
              style={{ borderColor: "var(--card-light-border)" }}
            >
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
                      </p>
                      <Button type="button" size="sm" variant="outline" onClick={clearDocumentDraft} disabled={!isEditing}>
                        <PlusIcon className="mr-1.5 h-3.5 w-3.5" />
                        Tài liệu mới
                      </Button>
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
                              key={documentId ?? `character-document-${index}`}
                              className="flex items-start gap-2 rounded-md border p-2"
                              style={{
                                borderColor: selected
                                  ? "rgba(59,130,246,0.45)"
                                  : "var(--card-light-border)",
                                background: selected
                                  ? "rgba(59,130,246,0.08)"
                                  : "rgba(255,255,255,0.35)",
                              }}
                            >
                              <button
                                type="button"
                                className="min-w-0 flex-1 text-left"
                                onClick={() => selectDocument(document)}
                                disabled={!isEditing}
                              >
                                <p className="truncate text-sm font-semibold" style={{ color: "var(--content-heading)" }}>
                                  {document.title || "Tài liệu chưa đặt tên"}
                                </p>
                                <p className="mt-0.5 line-clamp-2 text-xs" style={{ color: "var(--content-muted)" }}>
                                  {document.content || "Chưa có nội dung"}
                                </p>
                              </button>
                              <div className="flex items-center gap-1">
                                {onGetDocumentPdfUrl && (
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
                                    title="Xem PDF"
                                  >
                                    <EyeIcon className="h-4 w-4" />
                                  </Button>
                                )}
                                {onUploadDocumentPdf && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-sm"
                                    className="shrink-0 rounded-full"
                                    disabled={isUploadDocumentPdfPending}
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
                                      if (draft.documentId === documentId) {
                                        clearDocumentDraft();
                                      }
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

                {/* PDF Upload for Create Mode */}
                {mode === "create" && (
                  <div className="rounded-lg border p-3" style={{ borderColor: "var(--card-light-border)" }}>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--content-heading)" }}>
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
                            <iframe
                              src={pdfPreviewUrl}
                              className="w-full h-full"
                              title="PDF Preview"
                              style={{ border: "none" }}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="grid gap-1.5">
                  <StaffFormLabel>Tiêu đề tài liệu</StaffFormLabel>
                  <StaffFormInput
                    value={draft.documentTitle}
                    onChange={(e) => set("documentTitle")(e.target.value)}
                    placeholder="Để trống sẽ dùng tên nhân vật"
                    disabled={!isEditing}
                  />
                </div>
                <div className="grid gap-1.5">
                  <StaffFormLabel>Nội dung tài liệu</StaffFormLabel>
                  <StaffFormTextarea
                    value={draft.documentContent}
                    onChange={(e) => set("documentContent")(e.target.value)}
                    placeholder="Dán plain text tài liệu tham khảo để AI dùng khi chat..."
                    style={{ minHeight: "140px" }}
                    disabled={!isEditing}
                  />
                </div>
            </div>

            <div
              className="flex items-center justify-between gap-3 py-3 px-4 rounded-xl border transition-colors"
              style={{
                borderColor: draft.isPublished
                  ? "rgba(34,197,94,0.35)"
                  : !isEditing || mappedContextId
                    ? "var(--card-light-border)"
                    : "rgba(234,179,8,0.3)",
                background: draft.isPublished
                  ? "rgba(34,197,94,0.06)"
                  : !isEditing || mappedContextId
                    ? "rgba(27,38,50,0.03)"
                    : "rgba(234,179,8,0.05)",
              }}
            >
              <div className="flex-1">
                <p className="text-sm font-semibold" style={{ color: draft.isPublished ? "rgb(22,163,74)" : !isEditing || mappedContextId ? "var(--content-heading)" : "#92400e" }}>
                  {draft.isPublished ? "Đã xuất bản" : "Chưa xuất bản"}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--content-muted)" }}>
                  {!mappedContextId && isEditing
                    ? "⚠ Cần liên kết bối cảnh lịch sử trước khi xuất bản."
                    : draft.isPublished
                      ? "Nhân vật đang hiển thị công khai cho người dùng."
                      : "Bật để hiển thị nhân vật cho người dùng."}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={draft.isPublished}
                onClick={() => {
                  if (!draft.isPublished) {
                    if (!mappedContextId) return;
                    setPublishDialogOpen(true);
                  } else {
                    set("isPublished")(false);
                  }
                }}
                disabled={!isEditing}
                className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: draft.isPublished ? "rgb(34,197,94)" : "rgba(234,179,8,0.4)",
                }}
              >
                <span
                  className="pointer-events-none block h-5 w-5 rounded-full shadow-lg transition-transform"
                  style={{
                    background: "#fff",
                    transform: draft.isPublished ? "translateX(20px)" : "translateX(0)",
                  }}
                />
              </button>
            </div>

            <ConfirmDialog
              open={publishDialogOpen}
              onOpenChange={setPublishDialogOpen}
              title="Xác nhận xuất bản nhân vật?"
              description="Khi xuất bản, nhân vật này sẽ được hiển thị công khai cho người dùng."
              confirmLabel="Đồng ý, xuất bản"
              onConfirm={() => {
                set("isPublished")(true);
                setPublishDialogOpen(false);
              }}
            />

            {isEditing && (
              <div className="flex gap-2 pt-2">
                {isCreated && (
                  <Button
                    variant="outline"
                    className="flex-1 bg-transparent border-[var(--card-light-border)] hover:bg-black/5 text-[var(--content-heading)]"
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
                  onClick={() => onSave(draft)}
                  disabled={!canSave}
                  className={`border-0 bg-[var(--accent-blue)] text-[var(--bg-deep)] font-semibold transition-all duration-200 hover:brightness-90 hover:shadow-sm cursor-pointer ${
                    isCreated ? "flex-1" : "w-full h-10 rounded-xl"
                  }`}
                >
                  <FloppyDiskIcon className="h-4 w-4 mr-2" />
                  {isPending
                    ? "Đang lưu..."
                    : isCreated
                      ? "Lưu thay đổi"
                      : "Tạo nhân vật ngay"}
                </Button>
              </div>
            )}

            {isCreated && (
              <div
                className="mt-8 pt-6 border-t space-y-4"
                style={{ borderColor: "var(--card-light-border)" }}
              >
                <div className="flex items-center gap-2">
                  <LinkIcon className="h-4 w-4" style={{ color: "var(--accent-blue)" }} />
                  <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--content-heading)" }}>
                    Liên kết bối cảnh lịch sử
                  </p>
                </div>

                {mappedContextId && (
                  <div
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl border"
                    style={{
                      borderColor: "rgba(34,197,94,0.3)",
                      background: "rgba(34,197,94,0.06)",
                    }}
                  >
                    <CheckCircleIcon className="h-4 w-4 shrink-0" style={{ color: "rgb(22,163,74)" }} />
                    <p className="text-xs font-medium flex-1 text-green-700">
                      Đã liên kết: {mappedContextName || mappedContextId}
                    </p>
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
                      isMapContextPending ||
                      selectedContextId === mappedContextId
                    }
                    className={`shrink-0 border-0 transition-all duration-200 ${
                      selectedContextId && selectedContextId !== mappedContextId
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
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: "rgba(59,130,246,0.1)" }}
                        >
                          <ScrollIcon className="h-4 w-4" style={{ color: "var(--accent-blue)" }} />
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
                    <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

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
                            onChange={(e) => setQuickCtx((s) => ({ ...s, name: e.target.value }))}
                            placeholder="VD: Chiến thắng Bạch Đằng"
                            className="h-9 text-sm"
                          />
                        </div>

                        <div className="grid gap-1.5">
                          <Label className="text-xs font-medium" style={{ color: "var(--content-heading)" }}>
                            Mô tả <span style={{ color: "var(--accent-danger)" }}>*</span>
                          </Label>
                          <textarea
                            id="qc-description"
                            value={quickCtx.description}
                            onChange={(e) => setQuickCtx((s) => ({ ...s, description: e.target.value }))}
                            placeholder="Bối cảnh lịch sử, ý nghĩa sự kiện..."
                            rows={4}
                            className="w-full resize-none rounded-md border px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-400 transition-colors"
                            style={{
                              borderColor: "var(--card-light-border)",
                              background: "var(--bg-content)",
                              color: "var(--content-text)",
                            }}
                          />
                        </div>

                        <div className="grid gap-1.5">
                          <Label className="text-xs font-medium flex items-center gap-1.5" style={{ color: "var(--content-heading)" }}>
                            <MapPinIcon className="h-3.5 w-3.5" />
                            Địa điểm
                          </Label>
                          <Input
                            id="qc-location"
                            value={quickCtx.location}
                            onChange={(e) => setQuickCtx((s) => ({ ...s, location: e.target.value }))}
                            placeholder="VD: Sông Bạch Đằng, Quảng Ninh"
                            className="h-9 text-sm"
                          />
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
                              onValueChange={(v) => setQuickCtx((s) => ({ ...s, era: v as EventEraBackend }))}
                            >
                              <SelectTrigger className="h-9 text-sm">
                                <SelectValue placeholder="Chọn thời đại" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ANCIENT">Cổ đại</SelectItem>
                                <SelectItem value="MEDIEVAL">Trung đại</SelectItem>
                                <SelectItem value="MODERN">Cận đại</SelectItem>
                                <SelectItem value="CONTEMPORARY">Hiện đại</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="grid gap-1.5">
                            <Label className="text-xs font-medium" style={{ color: "var(--content-heading)" }}>
                              Năm <span style={{ color: "var(--accent-danger)" }}>*</span>
                            </Label>
                            <Input
                              id="qc-year"
                              type="number"
                              value={quickCtx.year}
                              onChange={(e) => setQuickCtx((s) => ({ ...s, year: e.target.value }))}
                              placeholder="VD: 938"
                              className="h-9 text-sm"
                            />
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
                            onChange={(e) => setQuickCtx((s) => ({ ...s, imageUrl: e.target.value }))}
                            placeholder="https://..."
                            className="h-9 text-sm"
                          />
                        </div>

                        <div className="grid gap-1.5">
                          <Label className="text-xs font-medium flex items-center gap-1.5" style={{ color: "var(--content-heading)" }}>
                            <VideoIcon className="h-3.5 w-3.5" />
                            URL video (YouTube)
                          </Label>
                          <Input
                            id="qc-videoUrl"
                            value={quickCtx.videoUrl}
                            onChange={(e) => setQuickCtx((s) => ({ ...s, videoUrl: e.target.value }))}
                            placeholder="https://youtube.com/watch?v=..."
                            className="h-9 text-sm"
                          />
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="h-px" style={{ background: "var(--card-light-border)" }} />

                      {/* Section: Trạng thái */}
                      <div
                        className="flex items-center justify-between gap-3 py-3 px-4 rounded-xl border transition-colors"
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
                          onClick={() => setQuickCtx((s) => ({ ...s, isPublished: !s.isPublished }))}
                          className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none"
                          style={{ background: quickCtx.isPublished ? "rgb(34,197,94)" : "rgba(234,179,8,0.4)" }}
                        >
                          <span
                            className="pointer-events-none block h-5 w-5 rounded-full shadow-lg transition-transform"
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
                      className="px-6 py-4 border-t shrink-0 flex items-center justify-end gap-2"
                      style={{ borderColor: "var(--card-light-border)" }}
                    >
                      <Button
                        variant="outline"
                        className="bg-transparent border-[var(--card-light-border)] hover:bg-black/5"
                        style={{ color: "var(--content-heading)" }}
                        onClick={() => {
                          setQuickCreateOpen(false);
                          setQuickCtx({ name: "", description: "", era: "", year: "", location: "", imageUrl: "", videoUrl: "", isPublished: false });
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
                          createEvent.isPending
                        }
                        className="border-0 bg-[var(--accent-blue)] text-[var(--bg-deep)] transition-all duration-200 hover:brightness-90 hover:shadow-sm cursor-pointer"
                        onClick={() => {
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
                                setQuickCtx({ name: "", description: "", era: "", year: "", location: "", imageUrl: "", videoUrl: "", isPublished: false });
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
            )}
          </div>
        </div>

        {/* ── Right Panel: Chat Preview ── */}
        <div className="flex-1 flex flex-col min-w-0 relative bg-[var(--bg-app)]">
          {isCreated && mappedContextId ? (
            <ChatMain
              character={chatCharacter}
              sessionId={sessionId}
              contextId={mappedContextId}
              onSessionCreated={setSessionId}
            />
          ) : (
            <div className="flex-1 flex flex-col relative items-center justify-center p-12">
              <div className="w-full max-w-2xl aspect-[4/3] relative rounded-3xl overflow-hidden shadow-2xl border border-[var(--card-light-border)]">
                {/* Blurred mock-up */}
                <div className="absolute inset-0 bg-white" style={{ filter: "blur(40px)", opacity: 0.6 }} />
                <div className="absolute inset-0 flex flex-col p-8 space-y-6 opacity-20 bg-gray-50">
                  <div className="h-12 w-48 bg-gray-300 rounded-full" />
                  <div className="h-24 w-2/3 bg-gray-200 rounded-2xl" />
                  <div className="h-24 w-1/2 ml-auto bg-blue-200 rounded-2xl" />
                  <div className="h-24 w-3/4 bg-gray-200 rounded-2xl" />
                </div>

                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center space-y-4 px-6">
                    <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto shadow-xl border border-[var(--card-light-border)]">
                      <ChatCircleDotsIcon className="h-10 w-10" style={{ color: "var(--accent-blue)" }} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold" style={{ color: "var(--content-heading)" }}>
                        Hệ thống đối thoại chưa khởi tạo
                      </h3>
                      <p className="text-sm mt-1 max-w-sm mx-auto" style={{ color: "var(--content-muted)" }}>
                        {!isCreated
                          ? "Hãy hoàn tất thông tin và 'Tạo nhân vật' để bắt đầu trải nghiệm AI."
                          : "Bạn cần liên kết nhân vật với một 'Bối cảnh lịch sử' ở khung bên trái để AI có thể hiểu được bối cảnh trò chuyện."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isCreated && (
            <div
              className="absolute top-6 right-6 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
              style={{
                background: draft.isPublished ? "rgba(34,197,94,0.1)" : "rgba(234,179,8,0.1)",
                color: draft.isPublished ? "rgb(22,163,74)" : "rgb(161,98,7)",
                border: `1px solid ${draft.isPublished ? "rgba(34,197,94,0.2)" : "rgba(234,179,8,0.2)"}`,
                boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                backdropFilter: "blur(8px)",
              }}
            >
              <EyeIcon className="h-4 w-4" />
              {draft.isPublished ? "ĐÃ XUẤT BẢN" : "CHƯA XUẤT BẢN"}
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
    </div>
  );
}
