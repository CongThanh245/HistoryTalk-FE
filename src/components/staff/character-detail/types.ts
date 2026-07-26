import type * as React from "react";
import type { CharacterDraft, FormTabKey } from "../staff-character-detail-view.types";
import type { RagDocument } from "@/services/document.service";
import type { HistoricalEvent, EventEraBackend } from "@/services/event.service";
import type { ChatCharacter } from "@/services/chat.service";
import type { ValidationErrors, CharacterValidationField, ContextValidationField } from "@/lib/utils/content-validation";

export type MediaKind = "IMAGE_2D" | "MODEL_3D" | "VIDEO";

export type SetDraftField = (field: keyof CharacterDraft) => (val: string | boolean) => void;

/* ------------------------------------------------------------------ */
/*  Basic Tab                                                          */
/* ------------------------------------------------------------------ */

export interface BasicTabProps {
  draft: CharacterDraft;
  set: SetDraftField;
  isEditing: boolean;
  errors: ValidationErrors<CharacterValidationField>;
}

/* ------------------------------------------------------------------ */
/*  Media Tab                                                          */
/* ------------------------------------------------------------------ */

export interface MediaTabProps {
  draft: CharacterDraft;
  isEditing: boolean;
  errors: ValidationErrors<CharacterValidationField>;
  isUploadMediaPending: boolean;
  isDeleteMediaPending: boolean;
  pendingImageFile: File | null;
  setPendingImageFile: (file: File | null) => void;
  pendingModelFile: File | null;
  setPendingModelFile: (file: File | null) => void;
  pendingVideoFile: File | null;
  setPendingVideoFile: (file: File | null) => void;
  pendingImagePreviewUrl: string | null;
  setPendingImagePreviewUrl: (url: string | null) => void;
  pendingVideoPreviewUrl: string | null;
  setPendingVideoPreviewUrl: (url: string | null) => void;
  handleMediaPick: (
    file: File,
    mediaType: MediaKind,
    setPendingFile: (file: File | null) => void,
    setPendingPreviewUrl?: (url: string | null) => void,
  ) => Promise<void>;
  handleMediaClear: (
    mediaType: MediaKind,
    pendingFile: File | null,
    setPendingFile: (file: File | null) => void,
    pendingPreviewUrl?: string | null,
    setPendingPreviewUrl?: (url: string | null) => void,
  ) => Promise<void>;
}

/* ------------------------------------------------------------------ */
/*  Content Tab                                                        */
/* ------------------------------------------------------------------ */

export interface ContentTabProps {
  draft: CharacterDraft;
  set: SetDraftField;
  isEditing: boolean;
  errors: ValidationErrors<CharacterValidationField>;
}

/* ------------------------------------------------------------------ */
/*  RAG Tab                                                            */
/* ------------------------------------------------------------------ */

export interface RagTabProps {
  mode: "create" | "edit";
  draft: CharacterDraft;
  set: SetDraftField;
  isEditing: boolean;
  documents: RagDocument[];
  isLoadingDocuments: boolean;
  onDeleteDocument?: (docId: string) => void;
  isDeleteDocumentPending: boolean;
  onUploadDocumentPdf?: (docId: string, file: File) => Promise<void>;
  isUploadDocumentPdfPending: boolean;
  onGetDocumentPdfUrl?: (docId: string) => Promise<{ url: string; expiresIn: number }>;
  isGetDocumentPdfUrlPending: boolean;
  onCreateTextDocument?: (data: { title: string; content: string }) => Promise<void>;
  isCreateTextDocumentPending: boolean;
  onCreatePdfDocument?: (data: { title: string; file: File }) => Promise<void>;
  isCreatePdfDocumentPending: boolean;
  getDocumentId: (document: RagDocument) => string | undefined;
  selectDocument: (document: RagDocument) => void;
  clearDocumentDraft: () => void;
  documentDetailOpen: boolean;
  setDocumentDetailOpen: (open: boolean) => void;
  uploadDialogOpen: boolean;
  setUploadDialogOpen: (open: boolean) => void;
  uploadTargetDocId: string | null;
  setUploadTargetDocId: (id: string | null) => void;
  viewerOpen: boolean;
  setViewerOpen: (open: boolean) => void;
  viewerUrl: string | null;
  setViewerUrl: (url: string | null) => void;
  viewerLoading: boolean;
  setViewerLoading: (loading: boolean) => void;
  pendingPdfFile: File | null;
  setPendingPdfFile: (file: File | null) => void;
  pdfPreviewUrl: string | null;
  setPdfPreviewUrl: (url: string | null) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  selectedDocumentHasPdf: boolean;
}

/* ------------------------------------------------------------------ */
/*  Context Tab                                                        */
/* ------------------------------------------------------------------ */

export interface QuickCtxState {
  name: string;
  description: string;
  era: EventEraBackend | "";
  year: string;
  location: string;
  imageUrl: string;
  videoUrl: string;
  isPublished: boolean;
}

export interface ContextTabProps {
  isCreated: boolean;
  eventOptions: HistoricalEvent[];
  isLoadingEvents: boolean;
  isMapContextPending?: boolean;
  onUnmapContext?: (
    characterId: string,
    contextId: string,
    options?: { onSuccess?: () => void },
  ) => void;
  selectedContextId: string;
  setSelectedContextId: (id: string) => void;
  mappedContexts: { contextId: string; name: string }[];
  handleMapContext: () => void;
  handleRemoveContext: (contextId: string) => void;
  hasDraftErrors: boolean;
  quickCreateOpen: boolean;
  setQuickCreateOpen: (open: boolean) => void;
  quickCtx: QuickCtxState;
  setQuickContextField: <K extends keyof QuickCtxState>(field: K) => (val: QuickCtxState[K]) => void;
  quickErrors: ValidationErrors<ContextValidationField>;
  resetQuickCtx: () => void;
  createEvent: {
    mutate: (
      data: {
        name: string;
        description: string;
        era: EventEraBackend;
        year: number;
        location?: string;
        imageUrl?: string;
        videoUrl?: string;
        isPublished: boolean;
      },
      options?: { onSuccess?: (newCtx: { id: string }) => void },
    ) => void;
    isPending: boolean;
  };
}

/* ------------------------------------------------------------------ */
/*  Chat Preview Panel                                                 */
/* ------------------------------------------------------------------ */

export interface ChatPreviewPanelProps {
  canStartChat: boolean;
  chatCharacter: ChatCharacter;
  activeChatContextId: string;
  sessionId: string | null;
  setSessionId: (id: string | null) => void;
  chatInitializingLabel?: string;
  isCreated: boolean;
  hasPublishErrors: boolean;
}
