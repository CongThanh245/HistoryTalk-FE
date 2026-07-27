"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { StaffContextDetailView, type ContextDraft } from "@/components/staff/staff-context-detail-view";
import {
  useEventDetail,
  useUpdateEvent,
  useUploadContextMedia,
  useDeleteContextMedia,
} from "@/features/events/hooks";
import {
  useHistoricalDocuments,
  useCreateHistoricalDocument,
  useUpdateHistoricalDocument,
  useDeleteHistoricalDocument,
  useGetDocumentPdfUrl,
  useUploadAndExtractPdf,
} from "@/features/documents/hooks";
import {
  useCharacters,
  useCharactersByContext,
  useMapContextToCharacter,
  useUnmapContextFromCharacter,
} from "@/features/characters/hooks";
import { Skeleton } from "@/components/ui/skeleton";
import type { EventEraBackend } from "@/services/event.service";

export default function EditContextPage() {
  const { id } = useParams() as { id: string };

  const { data: context, isLoading: isLoadingContext } = useEventDetail(id);
  const updateEvent = useUpdateEvent();
  const historicalDocuments = useHistoricalDocuments(id);
  const createHistoricalDocument = useCreateHistoricalDocument();
  const updateHistoricalDocument = useUpdateHistoricalDocument(id);
  const deleteHistoricalDocument = useDeleteHistoricalDocument(id);
  const getDocumentPdfUrl = useGetDocumentPdfUrl();
  const extractPdf = useUploadAndExtractPdf();
  const uploadContextMedia = useUploadContextMedia();
  const deleteContextMedia = useDeleteContextMedia();

  const charactersInContext = useCharactersByContext(id);
  const linkedCharacterIds = React.useMemo(
    () => new Set((charactersInContext.data ?? []).map((c) => c.id)),
    [charactersInContext.data],
  );
  const [characterSearch, setCharacterSearch] = React.useState("");
  const characterSearchResults = useCharacters({ search: characterSearch || undefined, page: 1, limit: 8 });
  const availableCharacters = React.useMemo(
    () => (characterSearchResults.data?.content ?? []).filter((c) => !linkedCharacterIds.has(c.id)),
    [characterSearchResults.data, linkedCharacterIds],
  );
  const mapContextToCharacter = useMapContextToCharacter();
  const unmapContextFromCharacter = useUnmapContextFromCharacter();

  const handleSave = async (draft: ContextDraft) => {
    const payload = {
      name: draft.name.trim(),
      description: draft.description.trim(),
      era: draft.era as EventEraBackend,
      year: Number(draft.year),
      location: draft.location.trim() || undefined,
      imageUrl: draft.imageUrl.trim() || undefined,
      videoUrl: draft.videoUrl.trim() || undefined,
      isPublished: draft.isPublished,
    };

    try {
      await updateEvent.mutateAsync({ id, data: payload });
    } catch {
      // useUpdateEvent already shows the API error toast.
    }
  };

  if (isLoadingContext) {
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

  if (!context) {
    return <div className="p-8 text-center bg-gray-50 h-screen">Không tìm thấy bối cảnh.</div>;
  }

  const initialDraft: ContextDraft = {
    id: context.id,
    name: context.title || "",
    description: context.summary || "",
    era: (context.era ?? "") as EventEraBackend | "",
    year: String(context.year ?? ""),
    location: context.location ?? "",
    imageUrl: context.imageUrl ?? "",
    videoUrl: context.videoUrl ?? "",
    isPublished: context.isPublished ?? false,
    documentId: undefined,
    documentTitle: "",
    documentContent: "",
  };

  return (
    <StaffContextDetailView
      mode="edit"
      initialDraft={initialDraft}
      onSave={handleSave}
      isPending={updateEvent.isPending}
      documents={historicalDocuments.data ?? []}
      isLoadingDocuments={historicalDocuments.isLoading}
      onDeleteDocument={(docId) => deleteHistoricalDocument.mutate(docId)}
      isDeleteDocumentPending={deleteHistoricalDocument.isPending}
      onGetDocumentPdfUrl={async (docId) => getDocumentPdfUrl.mutateAsync(docId)}
      isGetDocumentPdfUrlPending={getDocumentPdfUrl.isPending}
      onUploadMedia={(contextId, file, mediaType, onProgress) =>
        uploadContextMedia.mutateAsync({ contextId, file, mediaType, onProgress })
      }
      isUploadMediaPending={uploadContextMedia.isPending}
      onDeleteMedia={async (contextId, mediaType) => {
        await deleteContextMedia.mutateAsync({ contextId, mediaType });
      }}
      isDeleteMediaPending={deleteContextMedia.isPending}
      onCreateTextDocument={async ({ title, content }) => {
        await createHistoricalDocument.mutateAsync({ contextId: id, title, content, type: "TEXT" });
      }}
      isCreateTextDocumentPending={createHistoricalDocument.isPending}
      onExtractPdfDocument={async (file, onProgress, signal) =>
        extractPdf.mutateAsync({ file, entityType: "context", entityId: id, onProgress, signal })
      }
      isExtractPdfDocumentPending={extractPdf.isPending}
      onCreatePdfDocument={async ({ title, content, fileUrl }) => {
        await createHistoricalDocument.mutateAsync({ contextId: id, title, content, fileUrl });
      }}
      isCreatePdfDocumentPending={createHistoricalDocument.isPending}
      onUpdateDocument={async (docId, data) => {
        await updateHistoricalDocument.mutateAsync({ docId, data: { ...data, type: "TEXT" } });
      }}
      isUpdateDocumentPending={updateHistoricalDocument.isPending}
      charactersInContext={charactersInContext.data ?? []}
      isLoadingCharactersInContext={charactersInContext.isLoading}
      characterSearch={characterSearch}
      onCharacterSearchChange={setCharacterSearch}
      availableCharacters={availableCharacters}
      isLoadingCharacterSearch={characterSearchResults.isLoading}
      onMapCharacter={(characterId) =>
        mapContextToCharacter.mutate({ characterId, contextId: id, contextName: initialDraft.name })
      }
      isMapCharacterPending={mapContextToCharacter.isPending}
      onUnmapCharacter={(characterId) => unmapContextFromCharacter.mutate({ characterId, contextId: id })}
      isUnmapCharacterPending={unmapContextFromCharacter.isPending}
    />
  );
}
