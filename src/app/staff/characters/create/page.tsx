"use client";

import { useRouter } from "next/navigation";
import { StaffCharacterDetailView, type CharacterDraft } from "@/components/staff/staff-character-detail-view";
import { useCreateCharacter, useMapContextToCharacter } from "@/features/characters/hooks";
import { useEvents } from "@/features/events/hooks";
import { isValidUrl } from "@/lib/utils/url";

function toNullableNumber(value: string): number | null {
  const trimmed = value.trim();
  return trimmed ? Number(trimmed) : null;
}

export default function CreateCharacterPage() {
  const router = useRouter();

  const createCharacter = useCreateCharacter();
  const mapContextToCharacter = useMapContextToCharacter();
  const { data: eventsData, isLoading: isLoadingEvents } = useEvents({
    page: 1,
    limit: 100,
  });
  const eventOptions = eventsData?.content || [];

  const handleSave = (draft: CharacterDraft) => {
    const payload = {
      name: draft.name.trim(),
      title: draft.title.trim(),
      background: draft.background.trim() || undefined,
      image: isValidUrl(draft.image.trim()) ? draft.image.trim() : undefined,
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

    createCharacter.mutate(payload, {
      onSuccess: (newChar) => {
        // Redirection with ID allows persistence on reload
        router.push(`/staff/characters/${newChar.id}`);
      },
    });
  };

  return (
    <StaffCharacterDetailView
      mode="create"
      onSave={handleSave}
      isPending={createCharacter.isPending}
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
