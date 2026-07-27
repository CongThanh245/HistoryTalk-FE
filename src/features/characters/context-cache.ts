import type { QueryClient } from "@tanstack/react-query";
import type { Character, GetCharactersResponse } from "@/services/character.service";
import { queryKeys } from "@/shared/query-key";

function stripContextFromCharacter(character: Character, contextId: string): Character {
  if (!character.contexts?.some((c) => c.contextId === contextId)) return character;
  return {
    ...character,
    contexts: character.contexts.filter((c) => c.contextId !== contextId),
  };
}

// Removes a deleted context from every cached character record (list rows and
// detail views) so the "Quản lý nhân vật" page drops the stale reference
// immediately instead of requiring a refresh.
export function removeContextFromCharacterCaches(qc: QueryClient, contextId: string) {
  qc.setQueriesData({ queryKey: queryKeys.characters.all }, (old: unknown) => {
    if (
      old &&
      typeof old === "object" &&
      Array.isArray((old as GetCharactersResponse).content)
    ) {
      const response = old as GetCharactersResponse;
      return {
        ...response,
        content: response.content.map((c) => stripContextFromCharacter(c, contextId)),
      };
    }
    if (old && typeof old === "object" && "contexts" in old) {
      return stripContextFromCharacter(old as Character, contextId);
    }
    return old;
  });
  qc.invalidateQueries({ queryKey: queryKeys.characters.all });
}
