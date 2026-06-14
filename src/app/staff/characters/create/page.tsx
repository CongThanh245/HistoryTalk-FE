"use client";

import { useRouter } from "next/navigation";
import { StaffCharacterDetailView, type CharacterDraft } from "@/components/staff/staff-character-detail-view";
import { useCreateCharacter, useMapContextToCharacter } from "@/features/characters/hooks";
import { useCreateCharacterDocument, useUploadDocumentPdf, useGetDocumentPdfUrl } from "@/features/documents/hooks";
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
  const uploadDocumentPdf = useUploadDocumentPdf();
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
      const documentContent = draft.documentContent.trim();
      const pendingPdfFile = draft.pendingPdfFile;

      // Create document if has content or PDF file
      if (documentContent || pendingPdfFile) {
        try {
          const newDoc = await createCharacterDocument.mutateAsync({
            characterId: newChar.id,
            title: draft.documentTitle.trim() || draft.name.trim(),
            content: documentContent || "PDF Document",
            type: "TEXT",
          });

          // Upload PDF if file was selected
          if (pendingPdfFile && newDoc.id) {
            try {
              await uploadDocumentPdf.mutateAsync({
                docId: newDoc.id,
                file: pendingPdfFile,
              });
              toast.success("Đã upload PDF thành công");
            } catch {
              toast.warning("Tài liệu đã tạo nhưng upload PDF thất bại");
            }
          }
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
      isPending={createCharacter.isPending || createCharacterDocument.isPending}
      eventOptions={eventOptions}
      isLoadingEvents={isLoadingEvents}
      onMapContext={(characterId, contextId, options) =>
        mapContextToCharacter.mutate(
          { characterId, contextId },
          { onSuccess: options?.onSuccess },
        )
      }
      isMapContextPending={mapContextToCharacter.isPending}
    />
  );
}
