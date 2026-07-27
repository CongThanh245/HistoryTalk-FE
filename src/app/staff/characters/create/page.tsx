"use client";

import { useRouter } from "next/navigation";
import { StaffCharacterDetailView, type CharacterDraft } from "@/components/staff/staff-character-detail-view";
import {
  useCreateCharacter,
  useMapContextToCharacter,
  useUploadCharacterMedia,
} from "@/features/characters/hooks";
import { useCreateCharacterDocument, useUploadAndExtractPdf } from "@/features/documents/hooks";
import { useEvents } from "@/features/events/hooks";
import { isValidUrl } from "@/lib/utils/url";
import { toast } from "sonner";

function toNullableNumber(value: string): number | null {
  const trimmed = value.trim();
  return trimmed ? Number(trimmed) : null;
}

export default function CreateCharacterPage() {
  const router = useRouter();

  const createCharacter = useCreateCharacter();
  const createCharacterDocument = useCreateCharacterDocument();
  const extractPdf = useUploadAndExtractPdf();
  const uploadCharacterMedia = useUploadCharacterMedia();
  const mapContextToCharacter = useMapContextToCharacter();
  const { data: eventsData, isLoading: isLoadingEvents } = useEvents({
    page: 1,
    limit: 100,
  });
  const eventOptions = eventsData?.content || [];

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
      const newChar = await createCharacter.mutateAsync(payload);

      // Upload any media picked before the character existed
      const pendingMedia: { file: File; mediaType: "IMAGE_2D" | "MODEL_3D" | "VIDEO" }[] = [
        ...(draft.pendingImageFile ? [{ file: draft.pendingImageFile, mediaType: "IMAGE_2D" as const }] : []),
        ...(draft.pendingModelFile ? [{ file: draft.pendingModelFile, mediaType: "MODEL_3D" as const }] : []),
        ...(draft.pendingVideoFile ? [{ file: draft.pendingVideoFile, mediaType: "VIDEO" as const }] : []),
      ];
      for (const { file, mediaType } of pendingMedia) {
        try {
          await uploadCharacterMedia.mutateAsync({ characterId: newChar.id, file, mediaType });
        } catch {
          toast.warning("Nhân vật đã tạo, nhưng tải lên media chưa thành công");
        }
      }

      const documentContent = draft.documentContent.trim();

      // documentContent already carries extracted PDF text when a file was
      // picked (see handlePdfFilePick in StaffCharacterDetailView) — the
      // fileUrl from that extraction rides along in pendingPdfFileUrl, so
      // the document is created in one call, content + file together.
      if (documentContent) {
        try {
          await createCharacterDocument.mutateAsync({
            characterId: newChar.id,
            title: draft.documentTitle.trim() || draft.name.trim(),
            content: documentContent,
            fileUrl: draft.pendingPdfFileUrl || undefined,
          });
        } catch {
          toast.warning("Nhân vật đã tạo, nhưng import tài liệu chưa thành công");
        }
      }

      // Redirection with ID allows persistence on reload
      router.push(`/staff/characters/${newChar.id}`);
    } catch {
      // useCreateCharacter already shows the API error toast.
    }
  };

  return (
    <StaffCharacterDetailView
      mode="create"
      onSave={handleSave}
      isPending={createCharacter.isPending || createCharacterDocument.isPending || uploadCharacterMedia.isPending}
      eventOptions={eventOptions}
      isLoadingEvents={isLoadingEvents}
      onExtractPdfDocument={async (file, onProgress, signal) =>
        extractPdf.mutateAsync({ file, entityType: "character", onProgress, signal })
      }
      isExtractPdfDocumentPending={extractPdf.isPending}
      onMapContext={(characterId, contextId, options) =>
        mapContextToCharacter.mutate(
          { characterId, contextId, contextName: options?.contextName },
          { onSuccess: options?.onSuccess },
        )
      }
      isMapContextPending={mapContextToCharacter.isPending}
    />
  );
}
