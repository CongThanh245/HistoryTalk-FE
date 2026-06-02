"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { StaffCharacterDetailView, type CharacterDraft } from "@/components/staff/staff-character-detail-view";
import { 
  useCharacter, 
  useUpdateCharacter, 
  useMapContextToCharacter 
} from "@/features/characters/hooks";

export default function CharacterPageClient() {
  const params = useParams();
  const id = params.id as string;
  
  const { data: character } = useCharacter(id);
  const updateCharacter = useUpdateCharacter();
  const mapContext = useMapContextToCharacter();

  if (!character) {
    return <div>Loading...</div>;
  }

  return (
    <StaffCharacterDetailView
      character={character}
      onSave={async (draft: CharacterDraft) => {
        await updateCharacter.mutateAsync({ id, draft });
      }}
      onMapContext={async (contextId: string) => {
        await mapContext.mutateAsync({ characterId: id, contextId });
      }}
    />
  );
}
