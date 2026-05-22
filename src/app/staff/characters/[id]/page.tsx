"use client";

import * as React from "react";
import { useParams, useSearchParams } from "next/navigation";
import { StaffCharacterDetailView, type CharacterDraft } from "@/components/staff/staff-character-detail-view";
import { 
  useCharacter, 
  useUpdateCharacter, 
  useMapContextToCharacter 
} from "@/features/characters/hooks";
import { useEvents } from "@/features/events/hooks";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditCharacterPage() {
  const { id } = useParams() as { id: string };
  const searchParams = useSearchParams();
  const initialEditing = searchParams.get("edit") === "true";
  
  const { data: character, isLoading: isLoadingChar } = useCharacter(id);
  const updateCharacter = useUpdateCharacter();
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
      image: draft.image.trim() || undefined,
      personality: draft.personality.trim() || undefined,
      lifespan: draft.lifespan.trim() || undefined,
      isActive: draft.isActive,
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
    lifespan: character.lifespan || "",
    isActive: character.isActive ?? true,
  };

  return (
    <StaffCharacterDetailView
      mode="edit"
      initialDraft={initialDraft}
      initialEditing={initialEditing}
      onSave={handleSave}
      isPending={updateCharacter.isPending}
      eventOptions={eventOptions}
      isLoadingEvents={isLoadingEvents}
      onMapContext={(characterId, contextId) =>
        mapContextToCharacter.mutate({ characterId, contextId })
      }
      isMapContextPending={mapContextToCharacter.isPending}
      initialContextId={character.contextId}
    />
  );
}
