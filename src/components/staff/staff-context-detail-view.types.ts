import type { RagDocument } from "@/services/document.service";
import type { Character } from "@/services/character.service";
import type { EventEraBackend } from "@/services/event.service";
import type { ContextValidationField } from "@/lib/utils/content-validation";

export type ContextDraft = {
  id?: string;
  name: string;
  description: string;
  era: EventEraBackend | "";
  year: string;
  location: string;
  imageUrl: string;
  videoUrl: string;
  isPublished: boolean;
  documentId?: string;
  documentTitle: string;
  documentContent: string;
  pendingPdfFile?: File | null;
  pendingImageFile?: File | null;
  pendingVideoFile?: File | null;
};

export const EMPTY_CONTEXT_DRAFT: ContextDraft = {
  name: "",
  description: "",
  era: "",
  year: "",
  location: "",
  imageUrl: "",
  videoUrl: "",
  isPublished: false,
  documentId: undefined,
  documentTitle: "",
  documentContent: "",
  pendingPdfFile: null,
  pendingImageFile: null,
  pendingVideoFile: null,
};

export interface StaffContextDetailViewProps {
  mode: "create" | "edit";
  initialDraft?: ContextDraft;
  onSave: (draft: ContextDraft) => void;
  isPending: boolean;
  /** Overrides the default "Đang lưu..." save-button label while isPending, e.g. "Đang tải video lên... 42%" */
  pendingLabel?: string | null;
  /** If true, start in editing mode immediately (e.g. navigated from Edit button) */
  initialEditing?: boolean;

  documents?: RagDocument[];
  isLoadingDocuments?: boolean;
  onDeleteDocument?: (docId: string) => void;
  isDeleteDocumentPending?: boolean;
  onUploadDocumentPdf?: (docId: string, file: File) => Promise<void>;
  isUploadDocumentPdfPending?: boolean;
  onGetDocumentPdfUrl?: (docId: string) => Promise<{ url: string; expiresIn: number }>;
  isGetDocumentPdfUrlPending?: boolean;

  /** Upload image/video for an existing context (edit mode only) */
  onUploadMedia?: (
    contextId: string,
    file: File,
    mediaType: "IMAGE_2D" | "VIDEO",
    onProgress?: (percent: number) => void,
  ) => Promise<{ viewUrl: string } | void>;
  isUploadMediaPending?: boolean;
  /** Clear one media slot for an existing context (edit mode only) */
  onDeleteMedia?: (contextId: string, mediaType: "IMAGE_2D" | "VIDEO") => Promise<void>;
  isDeleteMediaPending?: boolean;

  /** Create a brand-new text document, independent of the entity's Save button (edit mode only) */
  onCreateTextDocument?: (data: { title: string; content: string }) => Promise<void>;
  isCreateTextDocumentPending?: boolean;
  /** Create a brand-new PDF document (creates the doc, then uploads the file), independent of Save (edit mode only) */
  onCreatePdfDocument?: (data: { title: string; file: File }) => Promise<void>;
  isCreatePdfDocumentPending?: boolean;

  /** Characters already linked to this context (edit mode only) */
  charactersInContext?: Character[];
  isLoadingCharactersInContext?: boolean;
  /** Controlled search box for linking new characters */
  characterSearch?: string;
  onCharacterSearchChange?: (value: string) => void;
  availableCharacters?: Character[];
  isLoadingCharacterSearch?: boolean;
  onMapCharacter?: (characterId: string) => void;
  isMapCharacterPending?: boolean;
  onUnmapCharacter?: (characterId: string) => void;
  isUnmapCharacterPending?: boolean;
}

export type FormTabKey = "basic" | "media" | "rag" | "characters";

export const FORM_TABS: { key: FormTabKey; label: string }[] = [
  { key: "basic", label: "Cơ bản" },
  { key: "media", label: "Media" },
  { key: "rag", label: "Tài liệu" },
  { key: "characters", label: "Nhân vật" },
];

export const TAB_ERROR_FIELDS: Record<FormTabKey, ContextValidationField[]> = {
  basic: ["name", "era", "year", "description", "location"],
  media: ["imageUrl", "videoUrl"],
  rag: [],
  characters: [],
};
