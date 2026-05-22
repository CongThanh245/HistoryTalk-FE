"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { StaffCharacterDetailView } from "@/components/staff/staff-character-detail-view";
import { useCreateCharacter, useMapContextToCharacter } from "@/features/characters/hooks";
import { useEvents } from "@/features/events/hooks";

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
      name: draft.name?.trim(),
      title: draft.title?.trim(),
      background: draft.background?.trim() || undefined,
      image: draft.image?.trim() || undefined,
      personality: draft.personality?.trim() || undefined,
      lifespan: draft.lifespan?.trim() || undefined,
      side: draft.side?.trim() || undefined,
      isDraft: draft.isDraft,
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
      onMapContext={(characterId, contextId) =>
        mapContextToCharacter.mutate({ characterId, contextId })
      }
      isMapContextPending={mapContextToCharacter.isPending}
    />
  );
}
