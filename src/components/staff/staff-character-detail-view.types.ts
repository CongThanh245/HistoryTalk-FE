import type { RagDocument } from "@/services/document.service";
import type { HistoricalEvent } from "@/services/event.service";
import type { CharacterValidationField } from "@/lib/utils/content-validation";

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

export interface StaffCharacterDetailViewProps {
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
    options?: { contextName?: string; onSuccess?: () => void },
  ) => void;
  /** Callback to unmap a context from the character */
  onUnmapContext?: (
    characterId: string,
    contextId: string,
    options?: { onSuccess?: () => void },
  ) => void;
  isMapContextPending?: boolean;
  /** The currently mapped contexts (from character data) */
  initialContexts?: { contextId: string; name: string }[];
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

export type FormTabKey = "basic" | "media" | "content" | "rag" | "context";

export const FORM_TABS: { key: FormTabKey; label: string }[] = [
  { key: "basic", label: "Cơ bản" },
  { key: "media", label: "Media" },
  { key: "content", label: "Nội dung" },
  { key: "rag", label: "Tài liệu" },
  { key: "context", label: "Liên kết bối cảnh" },
];

export const TAB_ERROR_FIELDS: Record<FormTabKey, CharacterValidationField[]> = {
  basic: ["name", "title", "bornDay", "bornMonth", "bornYear", "deathDay", "deathMonth", "deathYear"],
  media: ["image", "modelUrl"],
  content: ["background", "personality"],
  rag: [],
  context: [],
};
