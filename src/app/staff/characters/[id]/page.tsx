"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { StaffCharacterDetailView, type CharacterDraft } from "@/components/staff/staff-character-detail-view";
import { 
  useCharacter, 
  useUpdateCharacter, 
  useMapContextToCharacter 
} from "@/features/characters/hooks";
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
  const mapContextToCharacter = useMapContextToCharacter();
  
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

    updateCharacter.mutate({ id, data: payload });
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
  };

  return (
    <StaffCharacterDetailView
      mode="edit"
      initialDraft={initialDraft}
      onSave={handleSave}
      isPending={updateCharacter.isPending}
      eventOptions={eventOptions}
      isLoadingEvents={isLoadingEvents}
      onMapContext={(characterId, contextId, options) =>
        mapContextToCharacter.mutate(
          { characterId, contextId },
          { onSuccess: options?.onSuccess },
        )
      }
      isMapContextPending={mapContextToCharacter.isPending}
      initialContextId={linkedContextId}
    />
  );
}
