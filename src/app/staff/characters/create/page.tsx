"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { StaffCharacterDetailView } from "@/components/staff/staff-character-detail-view";
import { useCreateCharacter, useMapContextToCharacter } from "@/features/characters/hooks";
import { useEvents } from "@/features/events/hooks";
import { isValidUrl } from "@/lib/utils/url";

export default function CreateCharacterPage() {
  const router = useRouter();
  const [createdCharacterId, setCreatedCharacterId] = React.useState<string | null>(null);

  const createCharacter = useCreateCharacter();
  const mapContextToCharacter = useMapContextToCharacter();
  const { data: eventsData, isLoading: isLoadingEvents } = useEvents({
    page: 1,
    limit: 100,
  });
  const eventOptions = eventsData?.content || [];

  const handleSave = (draft: any) => {
    const payload = {
      name: draft.name.trim(),
      title: draft.title.trim(),
      background: draft.background.trim() || undefined,
      image: isValidUrl(draft.image.trim()) ? draft.image.trim() : undefined,
      personality: draft.personality.trim() || undefined,
      lifespan: draft.lifespan.trim() || undefined,
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
      createdCharacterId={createdCharacterId}
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
