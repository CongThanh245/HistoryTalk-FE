"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { StaffCharacterDetailView, type CharacterDraft } from "@/components/staff/staff-character-detail-view";
import {
  useCharacter,
  useUpdateCharacter,
  useMapContextToCharacter,
  useUnmapContextFromCharacter,
  useUploadCharacterMedia,
  useDeleteCharacterMedia,
} from "@/features/characters/hooks";
import {
  useCharacterDocuments,
  useCreateCharacterDocument,
  useDeleteCharacterDocument,
  useUpdateCharacterDocument,
  useUploadDocumentPdf,
  useGetDocumentPdfUrl,
  useUploadAndExtractPdf,
} from "@/features/documents/hooks";
import { useEvents } from "@/features/events/hooks";
import { Skeleton } from "@/components/ui/skeleton";
import { isValidUrl } from "@/lib/utils/url";

function toInputValue(value: number | null | undefined): string {
  return value == null ? "" : String(value);
}

function toNullableNumber(value: string): number | null {
  const trimmed = value.trim();
  return trimmed ? Number(trimmed) : null;
}

export default function EditCharacterPage() {
  const { id } = useParams() as { id: string };
  
  const { data: character, isLoading: isLoadingChar } = useCharacter(id);
  const updateCharacter = useUpdateCharacter();
  const characterDocuments = useCharacterDocuments(id);
  const createCharacterDocument = useCreateCharacterDocument();
  const updateCharacterDocument = useUpdateCharacterDocument(id);
  const deleteCharacterDocument = useDeleteCharacterDocument(id);
  const uploadDocumentPdf = useUploadDocumentPdf();
  const getDocumentPdfUrl = useGetDocumentPdfUrl();
  const extractPdf = useUploadAndExtractPdf();
  const mapContextToCharacter = useMapContextToCharacter();
  const unmapContextFromCharacter = useUnmapContextFromCharacter();
  const uploadCharacterMedia = useUploadCharacterMedia();
  const deleteCharacterMedia = useDeleteCharacterMedia();
  
  const { data: eventsData, isLoading: isLoadingEvents } = useEvents({
    page: 1,
    limit: 100,
  });
  const eventOptions = eventsData?.content || [];
  const linkedContextId =
    character?.contextId ??
    eventOptions.find((event) =>
      event.characterIds?.some(
        (linkedCharacter) =>
          linkedCharacter.characterId === character?.id ||
          linkedCharacter.id === character?.backendId ||
          linkedCharacter._id === character?.backendId,
      ),
    )?.id;

  const handleSave = async (draft: CharacterDraft) => {
    const imageUrl = isValidUrl(draft.image.trim()) ? draft.image.trim() : undefined;
    const payload = {
      name: draft.name.trim(),
      title: draft.title.trim(),
      background: draft.background.trim() || undefined,
      image: imageUrl,
      imageUrl,
      modelUrl: isValidUrl(draft.modelUrl.trim()) ? draft.modelUrl.trim() : undefined,
      personality: draft.personality.trim() || undefined,
      bornYear: toNullableNumber(draft.bornYear),
      bornMonth: toNullableNumber(draft.bornMonth),
      bornDay: toNullableNumber(draft.bornDay),
      isBornBc: draft.isBornBc,
      deathYear: toNullableNumber(draft.deathYear),
      deathMonth: toNullableNumber(draft.deathMonth),
      deathDay: toNullableNumber(draft.deathDay),
      isDeathBc: draft.isDeathBc,
      isActive: draft.isActive,
      isPublished: draft.isPublished,
    };

    try {
      await updateCharacter.mutateAsync({ id, data: payload });
    } catch {
      // useUpdateCharacter already shows the API error toast.
    }
  };

  if (isLoadingChar) {
    return (
      <div className="p-8 space-y-4">
        <Skeleton className="h-12 w-1/3" />
        <div className="grid grid-cols-2 gap-8">
          <Skeleton className="h-[600px]" />
          <Skeleton className="h-[600px]" />
        </div>
      </div>
    );
  }

  if (!character) {
    return <div className="p-8 text-center bg-gray-50 h-screen">Không tìm thấy nhân vật.</div>;
  }

  // Pre-mapping draft data
  const initialDraft: CharacterDraft = {
    id: character.id,
    name: character.name || "",
    title: character.title || "",
    background: character.background || "",
    image: character.imageUrl || "",
    modelUrl: character.modelUrl || "",
    videoUrl: character.videoUrl || "",
    personality: character.personality || "",
    bornYear: toInputValue(character.bornYear),
    bornMonth: toInputValue(character.bornMonth),
    bornDay: toInputValue(character.bornDay),
    isBornBc: character.isBornBc ?? false,
    deathYear: toInputValue(character.deathYear),
    deathMonth: toInputValue(character.deathMonth),
    deathDay: toInputValue(character.deathDay),
    isDeathBc: character.isDeathBc ?? false,
    isActive: character.isActive ?? true,
    isPublished: character.isPublished ?? false,
    documentId: undefined,
    documentTitle: "",
    documentContent: "",
  };

  return (
    <StaffCharacterDetailView
      mode="edit"
      initialDraft={initialDraft}
      onSave={handleSave}
      isPending={updateCharacter.isPending}
      documents={characterDocuments.data ?? []}
      isLoadingDocuments={characterDocuments.isLoading}
      onDeleteDocument={(docId) => deleteCharacterDocument.mutate(docId)}
      isDeleteDocumentPending={deleteCharacterDocument.isPending}
      onUploadDocumentPdf={async (docId, file) => {
        await uploadDocumentPdf.mutateAsync({ docId, file });
      }}
      isUploadDocumentPdfPending={uploadDocumentPdf.isPending}
      onGetDocumentPdfUrl={async (docId) => {
        return await getDocumentPdfUrl.mutateAsync(docId);
      }}
      isGetDocumentPdfUrlPending={getDocumentPdfUrl.isPending}
      onUploadMedia={async (characterId, file, mediaType) => {
        await uploadCharacterMedia.mutateAsync({ characterId, file, mediaType });
      }}
      isUploadMediaPending={uploadCharacterMedia.isPending}
      onDeleteMedia={async (characterId, mediaType) => {
        await deleteCharacterMedia.mutateAsync({ characterId, mediaType });
      }}
      isDeleteMediaPending={deleteCharacterMedia.isPending}
      onCreateTextDocument={async ({ title, content }) => {
        await createCharacterDocument.mutateAsync({ characterId: id, title, content, type: "TEXT" });
      }}
      isCreateTextDocumentPending={createCharacterDocument.isPending}
      onExtractPdfDocument={async (file, onProgress, signal) =>
        extractPdf.mutateAsync({ file, entityType: "character", entityId: id, onProgress, signal })
      }
      isExtractPdfDocumentPending={extractPdf.isPending}
      onCreatePdfDocument={async ({ title, content, fileUrl }) => {
        await createCharacterDocument.mutateAsync({ characterId: id, title, content, fileUrl });
      }}
      isCreatePdfDocumentPending={createCharacterDocument.isPending}
      onUpdateDocument={async (docId, data) => {
        await updateCharacterDocument.mutateAsync({ docId, data: { ...data, type: "TEXT" } });
      }}
      isUpdateDocumentPending={updateCharacterDocument.isPending}
      eventOptions={eventOptions}
      isLoadingEvents={isLoadingEvents}
      onMapContext={(characterId, contextId, options) =>
        mapContextToCharacter.mutate(
          { characterId, contextId, contextName: options?.contextName },
          { onSuccess: options?.onSuccess },
        )
      }
      isMapContextPending={mapContextToCharacter.isPending}
      onUnmapContext={(characterId, contextId, options) =>
        unmapContextFromCharacter.mutate(
          { characterId, contextId },
          { onSuccess: options?.onSuccess },
        )
      }
      initialContexts={character.contexts}
    />
  );
}
