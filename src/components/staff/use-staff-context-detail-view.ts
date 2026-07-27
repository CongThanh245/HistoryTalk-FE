import * as React from "react";
import { toast } from "sonner";
import {
  hasValidationErrors,
  validateContextDraft,
  type ContextValidationField,
  type ValidationErrors,
} from "@/lib/utils/content-validation";
import type { RagDocument } from "@/services/document.service";
import {
  EMPTY_CONTEXT_DRAFT,
  FORM_TABS,
  TAB_ERROR_FIELDS,
  type ContextDraft,
  type FormTabKey,
  type StaffContextDetailViewProps,
} from "./staff-context-detail-view.types";

const VALIDATED_FIELDS: ContextValidationField[] = [
  "name",
  "description",
  "era",
  "year",
  "location",
  "imageUrl",
  "videoUrl",
];

/**
 * All state, derived values, and handlers for the historical-context detail
 * form — kept separate from `StaffContextDetailView` so that component only
 * has to worry about rendering.
 */
export function useStaffContextDetailView(props: StaffContextDetailViewProps) {
  const {
    mode,
    initialDraft,
    onSave,
    isPending,
    initialEditing,
    documents = [],
    isExtractPdfDocumentPending = false,
  } = props;

  const [draft, setDraft] = React.useState<ContextDraft>(initialDraft || EMPTY_CONTEXT_DRAFT);
  const [isEditing, setIsEditing] = React.useState(mode === "create" || !!initialEditing);
  const [cancelDialogOpen, setCancelDialogOpen] = React.useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = React.useState(false);
  const [errors, setErrors] = React.useState<ValidationErrors<ContextValidationField>>({});
  const [activeTab, setActiveTab] = React.useState<FormTabKey>("basic");

  const tabHasError = React.useCallback(
    (tab: FormTabKey) => TAB_ERROR_FIELDS[tab].some((field) => !!errors[field]),
    [errors],
  );

  /* ── PDF dialog state ── */
  const [uploadDialogOpen, setUploadDialogOpen] = React.useState(false);
  const [uploadTargetDocId, setUploadTargetDocId] = React.useState<string | null>(null);
  const [viewerOpen, setViewerOpen] = React.useState(false);
  const [viewerUrl, setViewerUrl] = React.useState<string | null>(null);
  const [viewerLoading, setViewerLoading] = React.useState(false);

  /* ── PDF file for create mode ── */
  const [pendingPdfFile, setPendingPdfFile] = React.useState<File | null>(null);
  const [pendingPdfFileUrl, setPendingPdfFileUrl] = React.useState<string | null>(null);
  const [pendingPdfPageCount, setPendingPdfPageCount] = React.useState<number | null>(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = React.useState<string | null>(null);
  const [pdfOcrProgress, setPdfOcrProgress] = React.useState<{ page: number; total: number } | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  /* ── Media files (image/video) for create mode ── */
  const [pendingImageFile, setPendingImageFile] = React.useState<File | null>(null);
  const [pendingVideoFile, setPendingVideoFile] = React.useState<File | null>(null);
  const [pendingImagePreviewUrl, setPendingImagePreviewUrl] = React.useState<string | null>(null);
  const [pendingVideoPreviewUrl, setPendingVideoPreviewUrl] = React.useState<string | null>(null);

  const isDirty = React.useMemo(() => {
    if (!initialDraft) return draft.name !== "" || draft.description !== "";

    const keys: (keyof ContextDraft)[] = [
      "name", "description", "era", "year", "location", "imageUrl", "videoUrl",
      "isPublished", "documentId", "documentTitle", "documentContent",
    ];

    return keys.some((key) => (draft[key] ?? "") !== (initialDraft[key] ?? ""));
  }, [draft, initialDraft]);

  const set = (field: keyof ContextDraft) => (val: string | boolean) =>
    setDraft((s) => {
      const next = { ...s, [field]: val };

      if (VALIDATED_FIELDS.includes(field as ContextValidationField)) {
        const nextErrors = validateContextDraft(next);
        const errorField = field as ContextValidationField;
        setErrors((prev) => {
          const updated = { ...prev };
          if (nextErrors[errorField]) {
            updated[errorField] = nextErrors[errorField];
          } else {
            delete updated[errorField];
          }
          return updated;
        });
      }

      return next;
    });

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

  const cancelEditing = () => {
    if (initialDraft) setDraft(initialDraft);
    setIsEditing(false);
  };

  // Skipped while actively editing so an unrelated parent re-render
  // (background refetch, sibling query update, ...) can't stomp unsaved
  // local edits — e.g. a just-toggled publish switch reverting before the
  // user hits Save.
  React.useEffect(() => {
    if (initialDraft && !isEditing) setDraft(initialDraft);
  }, [initialDraft, isEditing]);

  React.useEffect(() => {
    if (skipAutoSelect) setSkipAutoSelect(false);
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
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty && isEditing) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty, isEditing]);

  const isCreated = mode === "edit" || !!draft.id;

  const draftValidationErrors = React.useMemo(() => validateContextDraft(draft), [draft]);
  const hasDraftErrors = hasValidationErrors(draftValidationErrors);
  // Blocked while a PDF pick is still being extracted so Save can't fire
  // before pendingPdfFileUrl/documentContent are actually populated — the
  // pending file would otherwise silently get dropped from the create call.
  const canSave = !hasDraftErrors && !isPending && !isExtractPdfDocumentPending;
  const canPublish = !isEditing || !hasDraftErrors;
  const publishBlockedMessage = "⚠ Cần hoàn tất các trường bắt buộc trước khi xuất bản.";

  const showValidationErrors = (nextErrors: ValidationErrors<ContextValidationField> = draftValidationErrors) => {
    setErrors(nextErrors);
    const firstInvalidTab = FORM_TABS.find((tab) =>
      TAB_ERROR_FIELDS[tab.key].some((field) => !!nextErrors[field]),
    );
    if (firstInvalidTab) setActiveTab(firstInvalidTab.key);
    toast.error("Vui lòng kiểm tra các trường bắt buộc và định dạng năm/URL.");
  };

  // Auto-exit editing mode once a save completes successfully.
  const prevPendingRef = React.useRef(false);
  React.useEffect(() => {
    if (prevPendingRef.current && !isPending) {
      setIsEditing(false);
    }
    prevPendingRef.current = isPending;
  }, [isPending]);

  const handleSaveClick = () => {
    if (hasDraftErrors) {
      showValidationErrors();
      return;
    }
    setErrors({});
    // pendingPdfFile/pendingImageFile/pendingVideoFile live in local hook
    // state (not in `draft`) so their pickers can reset independently of
    // form fields — they have to be merged back in here or the selected
    // files never reach onSave.
    onSave({ ...draft, pendingPdfFile, pendingPdfFileUrl, pendingImageFile, pendingVideoFile });
  };

  return {
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
    canSave,
    canPublish,
    publishBlockedMessage,
    showValidationErrors,
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
    pendingPdfFileUrl,
    setPendingPdfFileUrl,
    pendingPdfPageCount,
    setPendingPdfPageCount,
    pdfPreviewUrl,
    setPdfPreviewUrl,
    pdfOcrProgress,
    setPdfOcrProgress,
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
  };
}
