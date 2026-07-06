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
};

export interface StaffContextDetailViewProps {
  mode: "create" | "edit";
  initialDraft?: ContextDraft;
  onSave: (draft: ContextDraft) => void;
  isPending: boolean;
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
