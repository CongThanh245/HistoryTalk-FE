import * as React from "react";
import { toast } from "sonner";
import { isValidUrl } from "@/lib/utils/url";
import {
  hasValidationErrors,
  validateCharacterDraft,
  validateContextDraft,
  type CharacterValidationField,
  type ContextValidationField,
  type ValidationErrors,
} from "@/lib/utils/content-validation";
import { useChatSessions, useCreateSession } from "@/features/chat/hooks";
import { useCreateEvent } from "@/features/events/hooks";
import type { ChatCharacter } from "@/services/chat.service";
import type { EventEraBackend } from "@/services/event.service";
import type { RagDocument } from "@/services/document.service";
import {
  EMPTY_CHARACTER_DRAFT,
  FORM_TABS,
  TAB_ERROR_FIELDS,
  type CharacterDraft,
  type FormTabKey,
  type StaffCharacterDetailViewProps,
} from "./staff-character-detail-view.types";

function getCharacterRelatedValidationFields(
  field: keyof CharacterDraft,
): CharacterValidationField[] {
  if (
    field === "bornDay" ||
    field === "bornMonth" ||
    field === "bornYear" ||
    field === "isBornBc"
  ) {
    return ["bornDay", "bornMonth", "bornYear", "deathYear"];
  }

  if (
    field === "deathDay" ||
    field === "deathMonth" ||
    field === "deathYear" ||
    field === "isDeathBc"
  ) {
    return ["deathDay", "deathMonth", "deathYear"];
  }

  if (
    ["name", "title", "background", "personality", "image", "modelUrl"].includes(
      field,
    )
  ) {
    return [field as CharacterValidationField];
  }

  return [];
}

// Fields that actually shape the AI persona/context used in chat. Changing
// only e.g. isPublished, dates, or context links doesn't warrant throwing
// away the in-progress chat session.
const CHAT_RELEVANT_FIELDS: (keyof CharacterDraft)[] = [
  "name",
  "title",
  "background",
  "personality",
  "image",
  "modelUrl",
  "documentTitle",
  "documentContent",
];

// How long to wait after the last context-link change before actually
// creating a chat session for it. Linking is a ~1-2s round trip per click,
// while creating a session is a much slower ~4-5s call, so without this
// debounce, linking contexts back-to-back would queue up several
// createSession calls that race and flicker the chat panel.
const CONTEXT_SWITCH_DEBOUNCE_MS = 2000;

/**
 * All state, derived values, and handlers for the character detail form —
 * kept separate from `StaffCharacterDetailView` so that component only has
 * to worry about rendering.
 */
export function useStaffCharacterDetailView(props: StaffCharacterDetailViewProps) {
  const {
    mode,
    initialDraft,
    onSave,
    isPending,
    eventOptions,
    createdCharacterId,
    onMapContext,
    onUnmapContext,
    initialContexts,
    initialEditing,
    documents = [],
    isExtractPdfDocumentPending = false,
  } = props;

  /* ── State ── */
  const [draft, setDraft] = React.useState<CharacterDraft>(initialDraft || EMPTY_CHARACTER_DRAFT);
  const [isEditing, setIsEditing] = React.useState(mode === "create" || !!initialEditing);
  const [cancelDialogOpen, setCancelDialogOpen] = React.useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = React.useState(false);
  const [errors, setErrors] = React.useState<ValidationErrors<CharacterValidationField>>({});
  const [quickErrors, setQuickErrors] = React.useState<ValidationErrors<ContextValidationField>>({});
  const [activeTab, setActiveTab] = React.useState<FormTabKey>("basic");
  const [documentDetailOpen, setDocumentDetailOpen] = React.useState(false);
  const [isRecreatingSession, setIsRecreatingSession] = React.useState(false);
  const [isSwitchingContext, setIsSwitchingContext] = React.useState(false);

  const tabHasError = React.useCallback(
    (tab: FormTabKey) => TAB_ERROR_FIELDS[tab].some((field) => !!errors[field]),
    [errors],
  );

  /* ── PDF Dialog State ── */
  const [uploadDialogOpen, setUploadDialogOpen] = React.useState(false);
  const [uploadTargetDocId, setUploadTargetDocId] = React.useState<string | null>(null);
  const [viewerOpen, setViewerOpen] = React.useState(false);
  const [viewerUrl, setViewerUrl] = React.useState<string | null>(null);
  const [viewerLoading, setViewerLoading] = React.useState(false);

  /* ── PDF File for Create Mode ── */
  const [pendingPdfFile, setPendingPdfFile] = React.useState<File | null>(null);
  const [pendingPdfFileUrl, setPendingPdfFileUrl] = React.useState<string | null>(null);
  const [pendingPdfPageCount, setPendingPdfPageCount] = React.useState<number | null>(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  /* ── Media files (image/3D model/video) for Create Mode ── */
  const [pendingImageFile, setPendingImageFile] = React.useState<File | null>(null);
  const [pendingModelFile, setPendingModelFile] = React.useState<File | null>(null);
  const [pendingVideoFile, setPendingVideoFile] = React.useState<File | null>(null);
  const [pendingImagePreviewUrl, setPendingImagePreviewUrl] = React.useState<string | null>(null);
  const [pendingVideoPreviewUrl, setPendingVideoPreviewUrl] = React.useState<string | null>(null);

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
      setDraft((s) => {
        const next = { ...s, [field]: val };
        const nextErrors = validateCharacterDraft(next, {
          requirePublishReady: next.isPublished,
        });
        const relatedFields = getCharacterRelatedValidationFields(field);

        if (relatedFields.length > 0) {
          setErrors((prev) => {
            const updated = { ...prev };
            relatedFields.forEach((relatedField) => {
              if (nextErrors[relatedField]) {
                updated[relatedField] = nextErrors[relatedField];
              } else {
                delete updated[relatedField];
              }
            });
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

  /* ── Chat state ── */
  const [sessionId, setSessionId] = React.useState<string | null>(null);

  /* ── Context mapping state ── */
  const [selectedContextId, setSelectedContextId] = React.useState<string>("");
  const [mappedContexts, setMappedContexts] = React.useState<{ contextId: string; name: string }[]>([]);

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

  const setQuickContextField =
    <K extends keyof typeof quickCtx>(field: K) =>
    (val: (typeof quickCtx)[K]) =>
      setQuickCtx((s) => {
        const next = { ...s, [field]: val };
        const nextErrors = validateContextDraft(next);
        setQuickErrors((prev) => {
          const updated = { ...prev };
          const errorField = field as ContextValidationField;
          if (nextErrors[errorField]) {
            updated[errorField] = nextErrors[errorField];
          } else {
            delete updated[errorField];
          }
          return updated;
        });
        return next;
      });

  const resetQuickCtx = () =>
    setQuickCtx({ name: "", description: "", era: "", year: "", location: "", imageUrl: "", videoUrl: "", isPublished: false });

  // Reset state/sync when props change (especially for edit mode). Skipped
  // while actively editing so an unrelated parent re-render (background
  // refetch, sibling query update, ...) can't stomp unsaved local edits —
  // e.g. a just-toggled publish switch reverting before the user hits Save.
  React.useEffect(() => {
    if (initialDraft && !isEditing) {
      setDraft(initialDraft);
    }
  }, [initialDraft, isEditing]);

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
    setMappedContexts(initialContexts ?? []);
  }, [initialContexts]);

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

  /* Whether the character has been persisted (has an id) */
  const isCreated = !!(createdCharacterId || draft.id);
  const characterId = createdCharacterId || draft.id || "";
  // The most recently linked context drives the chat preview: every new
  // "Liên kết" should make the AI respond using that context, so a fresh
  // session is expected each time it changes (see the debounce below for
  // why that doesn't mean "one createSession call per click").
  const chatContextId = mappedContexts[mappedContexts.length - 1]?.contextId || "";
  // Debounced/"settled" version of chatContextId — this is what actually
  // drives session fetch/create. See the effect below.
  const [activeChatContextId, setActiveChatContextId] = React.useState(chatContextId);

  // Fetch or create session when character becomes active
  const { data: sessions, isSuccess: isSessionsSuccess } = useChatSessions(
    characterId,
    activeChatContextId,
    isCreated
  );

  const createSession = useCreateSession();
  const sessionInitialized = React.useRef(false);
  // Guards against slow/out-of-order session-create responses: only the
  // most recently issued request is allowed to write to `sessionId`, so a
  // stale response from an earlier click can't clobber a newer one.
  const sessionRequestIdRef = React.useRef(0);

  // Linking additional contexts back-to-back (~1-2s per click) shouldn't
  // fire one slow (~4-5s) createSession call per click — that races and
  // flickers the chat panel between several soon-discarded sessions. So:
  // the very first time a context becomes available (page load, or the
  // first-ever "Liên kết" click) switches immediately since there's no
  // prior session to preserve. Any later change (switching to yet another
  // linked context) drops the stale session right away (so nobody keeps
  // chatting against a context that's about to be replaced) but only
  // actually settles on — and creates a session for — whichever context
  // the user stops changing for CONTEXT_SWITCH_DEBOUNCE_MS.
  const prevChatContextIdRef = React.useRef(chatContextId);
  const contextSwitchTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(() => {
    const previous = prevChatContextIdRef.current;
    if (previous === chatContextId) return;
    prevChatContextIdRef.current = chatContextId;

    if (contextSwitchTimeoutRef.current) {
      clearTimeout(contextSwitchTimeoutRef.current);
      contextSwitchTimeoutRef.current = null;
    }

    setSessionId(null);
    sessionInitialized.current = false;
    // Invalidates any session-create call still in flight for the context
    // being switched away from, so its late response can't clobber the one
    // we're about to settle on.
    sessionRequestIdRef.current += 1;

    if (!previous) {
      setActiveChatContextId(chatContextId);
      return;
    }

    setIsSwitchingContext(true);
    contextSwitchTimeoutRef.current = setTimeout(() => {
      setActiveChatContextId(chatContextId);
    }, CONTEXT_SWITCH_DEBOUNCE_MS);
  }, [chatContextId]);

  React.useEffect(() => {
    return () => {
      if (contextSwitchTimeoutRef.current) clearTimeout(contextSwitchTimeoutRef.current);
    };
  }, []);

  React.useEffect(() => {
    if (!isCreated) return;
    if (!activeChatContextId) return;
    if (!isSessionsSuccess) return;
    if (sessionInitialized.current) return;
    if (sessionId) return;

    sessionInitialized.current = true;
    const requestId = ++sessionRequestIdRef.current;

    if (sessions && sessions.length > 0) {
      setSessionId(sessions[0].id);
      setIsSwitchingContext(false);
    } else {
      createSession.mutateAsync({
        characterId,
        contextId: activeChatContextId,
      }).then((session) => {
        if (sessionRequestIdRef.current === requestId) {
          setSessionId(session.id);
          setIsSwitchingContext(false);
        }
      }).catch((err) => {
        if (sessionRequestIdRef.current === requestId) {
          setIsSwitchingContext(false);
        }
        console.error(err);
      });
    }
  }, [isCreated, characterId, activeChatContextId, isSessionsSuccess, sessions, sessionId, createSession]);

  // Auto-exit editing mode after save completes successfully. If the
  // character already existed (i.e. this was an edit, not the initial
  // creation) AND the edit actually touched a field that shapes the AI
  // persona (see CHAT_RELEVANT_FIELDS), start a brand-new chat session so
  // the right-panel preview reflects the just-saved character data instead
  // of stale history. The old session is cleared (sessionId -> null)
  // *immediately*, before the new one exists, so the chat UI drops into its
  // existing "initializing" state (input disabled, spinner shown) rather
  // than silently letting the user keep chatting in a session that's about
  // to be discarded and then yanking them into a new, empty one mid-message.
  const prevPendingRef = React.useRef(false);
  const characterExistedBeforeSaveRef = React.useRef(false);
  const chatRelevantChangedRef = React.useRef(false);
  React.useEffect(() => {
    if (isPending && !prevPendingRef.current) {
      characterExistedBeforeSaveRef.current = isCreated;
    }
    if (prevPendingRef.current && !isPending) {
      const nowCreated = !!(createdCharacterId || draft.id);
      if (nowCreated) {
        setIsEditing(false);
        if (
          characterExistedBeforeSaveRef.current &&
          activeChatContextId &&
          chatRelevantChangedRef.current
        ) {
          const requestId = ++sessionRequestIdRef.current;
          const previousSessionId = sessionId;
          setIsRecreatingSession(true);
          setSessionId(null);
          createSession.mutate(
            { characterId, contextId: activeChatContextId },
            {
              onSuccess: (session) => {
                if (sessionRequestIdRef.current === requestId) {
                  setSessionId(session.id);
                  setIsRecreatingSession(false);
                  toast.success("Đã tạo phiên trò chuyện mới để phản ánh thay đổi vừa lưu.");
                }
              },
              onError: () => {
                if (sessionRequestIdRef.current === requestId) {
                  setSessionId(previousSessionId);
                  setIsRecreatingSession(false);
                  toast.error("Không thể tạo phiên trò chuyện mới. Đã khôi phục phiên trò chuyện trước đó.");
                }
              },
            },
          );
        }
      }
    }
    prevPendingRef.current = isPending;
  }, [isPending, createdCharacterId, draft.id, isCreated, activeChatContextId, characterId, createSession, sessionId]);

  const chatInitializingLabel = isRecreatingSession
    ? "Đã lưu thay đổi — đang tạo phiên trò chuyện mới để áp dụng..."
    : isSwitchingContext
      ? "Đang chuyển bối cảnh — sẽ tạo phiên trò chuyện mới..."
      : undefined;

  /* Build a ChatCharacter object from the draft for the right panel */
  const chatCharacter: ChatCharacter = {
    id: characterId,
    name: draft.name || "Nhân vật mới",
    title: draft.title || "Chức vị",
    description: draft.background || undefined,
    imageUrl: isValidUrl(draft.image) ? draft.image : "",
    modelUrl: isValidUrl(draft.modelUrl) ? draft.modelUrl : null,
    contextId: activeChatContextId || undefined,
  };

  const draftValidationErrors = React.useMemo(() => validateCharacterDraft(draft), [draft]);
  const publishValidationErrors = React.useMemo(
    () => validateCharacterDraft(draft, { requirePublishReady: true }),
    [draft],
  );
  const saveValidationErrors = draft.isPublished
    ? publishValidationErrors
    : draftValidationErrors;
  const hasDraftErrors = hasValidationErrors(draftValidationErrors);
  const hasSaveErrors = hasValidationErrors(saveValidationErrors);
  const hasPublishErrors = hasValidationErrors(publishValidationErrors);
  // Blocked while a PDF pick is still being extracted so Save can't fire
  // before pendingPdfFileUrl/documentContent are actually populated — the
  // pending file would otherwise silently get dropped from the create call.
  const canSave = !hasSaveErrors && !isPending && !isExtractPdfDocumentPending;
  const canStartChat = isCreated && mappedContexts.length > 0 && !hasPublishErrors;
  const canPublishCharacter = !isEditing || (!hasPublishErrors && mappedContexts.length > 0);
  const publishBlockedMessage =
    mappedContexts.length === 0
      ? "⚠ Cần liên kết bối cảnh lịch sử trước khi xuất bản."
      : "⚠ Cần hoàn tất các trường bắt buộc trước khi xuất bản.";

  const showValidationErrors = (nextErrors = saveValidationErrors) => {
    setErrors(nextErrors);
    const firstInvalidTab = FORM_TABS.find((tab) =>
      TAB_ERROR_FIELDS[tab.key].some((field) => !!nextErrors[field]),
    );
    if (firstInvalidTab) setActiveTab(firstInvalidTab.key);
    toast.error("Vui lòng kiểm tra các trường bắt buộc và định dạng ngày tháng.");
  };

  const handleSaveClick = () => {
    if (hasSaveErrors) {
      showValidationErrors();
      return;
    }
    // Snapshot now, before onSave resolves: once the save succeeds the
    // `initialDraft` prop is refreshed to match `draft`, so comparing them
    // later (in the isPending-edge effect) would always read "unchanged".
    chatRelevantChangedRef.current = initialDraft
      ? CHAT_RELEVANT_FIELDS.some((key) => (draft[key] ?? "") !== (initialDraft[key] ?? ""))
      : true;
    setErrors({});
    // pendingPdfFile/pendingImageFile/pendingModelFile/pendingVideoFile live
    // in local hook state (not in `draft`) so their pickers can reset
    // independently of form fields — they have to be merged back in here or
    // the selected files never reach onSave.
    onSave({
      ...draft,
      pendingPdfFile,
      pendingPdfFileUrl,
      pendingImageFile,
      pendingModelFile,
      pendingVideoFile,
    });
  };

  /* Handle context mapping */
  const handleMapContext = () => {
    if (hasDraftErrors) {
      showValidationErrors(draftValidationErrors);
      return;
    }
    if (!selectedContextId || !characterId) return;
    const selectedEvent = eventOptions.find(ev => ev.id === selectedContextId);

    onMapContext(characterId, selectedContextId, {
      contextName: selectedEvent?.title,
      onSuccess: () => {
        if (selectedEvent) {
          setMappedContexts(prev => {
            if (prev.some(c => c.contextId === selectedContextId)) return prev;
            return [...prev, { contextId: selectedContextId, name: selectedEvent.title }];
          });
        }
        // Session reset/(debounced) recreation is handled by the
        // chatContextId-watching effect above, keyed off the newly-linked
        // context becoming the last entry in mappedContexts.
        setSelectedContextId("");
      },
    });
  };

  const handleRemoveContext = (contextIdToRemove: string) => {
    if (!characterId || !onUnmapContext) return;
    onUnmapContext(characterId, contextIdToRemove, {
      onSuccess: () => {
        setMappedContexts(prev => prev.filter(c => c.contextId !== contextIdToRemove));
      }
    });
  };

  return {
    // draft + editing
    draft,
    isEditing,
    setIsEditing,
    isDirty,
    set,
    cancelEditing,

    // dialogs
    cancelDialogOpen,
    setCancelDialogOpen,
    leaveDialogOpen,
    setLeaveDialogOpen,

    // validation
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

    // documents / RAG
    documentDetailOpen,
    setDocumentDetailOpen,
    getDocumentId,
    selectDocument,
    clearDocumentDraft,

    // PDF dialogs
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
    fileInputRef,

    // media (image/3D model/video) pending files — create mode only
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

    // identity / chat
    isCreated,
    characterId,
    sessionId,
    setSessionId,
    activeChatContextId,
    chatCharacter,
    chatInitializingLabel,
    canStartChat,

    // context linking
    selectedContextId,
    setSelectedContextId,
    mappedContexts,
    handleMapContext,
    handleRemoveContext,

    // quick-create context
    quickCreateOpen,
    setQuickCreateOpen,
    quickCtx,
    setQuickContextField,
    quickErrors,
    resetQuickCtx,
    createEvent,
  };
}
