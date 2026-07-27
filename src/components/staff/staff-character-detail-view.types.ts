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
  videoUrl: string;
  documentId?: string;
  documentTitle: string;
  documentContent: string;
  /** Picked PDF file for create mode — display only (name/size/local preview). */
  pendingPdfFile?: File | null;
  /** Supabase storage path returned by upload-and-extract once pendingPdfFile has been extracted. */
  pendingPdfFileUrl?: string | null;
  pendingPdfPageCount?: number | null;
  pendingImageFile?: File | null;
  pendingModelFile?: File | null;
  pendingVideoFile?: File | null;
};

export const EMPTY_CHARACTER_DRAFT: CharacterDraft = {
  name: "",
  title: "",
  background: "",
  image: "",
  modelUrl: "",
  videoUrl: "",
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
  pendingPdfFileUrl: null,
  pendingPdfPageCount: null,
  pendingImageFile: null,
  pendingModelFile: null,
  pendingVideoFile: null,
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
  /** Upload image/3D model/video for an existing character (edit mode only) */
  onUploadMedia?: (characterId: string, file: File, mediaType: "IMAGE_2D" | "MODEL_3D" | "VIDEO") => Promise<void>;
  isUploadMediaPending?: boolean;
  /** Clear one media slot for an existing character (edit mode only) */
  onDeleteMedia?: (characterId: string, mediaType: "IMAGE_2D" | "MODEL_3D" | "VIDEO") => Promise<void>;
  isDeleteMediaPending?: boolean;
  /** Create a brand-new text document, independent of the entity's Save button (edit mode only) */
  onCreateTextDocument?: (data: { title: string; content: string }) => Promise<void>;
  isCreateTextDocumentPending?: boolean;
  /** Upload a PDF and extract its text before the document exists — used by both the create-mode PDF picker and the edit-mode "new document" panel. onProgress reports OCR page X/Y for scanned PDFs. signal lets a "Hủy" button cancel a long-running extraction. */
  onExtractPdfDocument?: (
    file: File,
    onProgress?: (page: number, total: number) => void,
    signal?: AbortSignal,
  ) => Promise<{ fileUrl: string; rawText: string; pageCount: number }>;
  isExtractPdfDocumentPending?: boolean;
  /** Create a brand-new PDF document in one call, using content + fileUrl already produced by onExtractPdfDocument (edit mode only) */
  onCreatePdfDocument?: (data: { title: string; content: string; fileUrl: string }) => Promise<void>;
  isCreatePdfDocumentPending?: boolean;
  /** Update an existing document's title/content independently of the entity's Save button (edit mode only) */
  onUpdateDocument?: (docId: string, data: { title: string; content: string }) => Promise<void>;
  isUpdateDocumentPending?: boolean;
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
