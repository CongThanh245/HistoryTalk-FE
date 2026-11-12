import { useQuery, useQueries, useMutation, useQueryClient } from "@tanstack/react-query";
import { characterService, type Character } from "@/services/character.service";
import { eventService, type HistoricalEvent } from "@/services/event.service";
import { trashService, type TrashItemType } from "@/services/trash.service";
import { queryKeys } from "@/shared/query-key";
import { removeContextFromCharacterCaches } from "@/features/characters/context-cache";

function trashQueryKey(type: TrashItemType) {
  if (type === "quizzes") return queryKeys.trash.quizzes;
  if (type === "historical-contexts") return queryKeys.trash.contexts;
  return queryKeys.trash.characters;
}

function invalidateRelated(qc: ReturnType<typeof useQueryClient>, type: TrashItemType) {
  qc.invalidateQueries({ queryKey: trashQueryKey(type) });
  if (type === "quizzes") {
    qc.invalidateQueries({ queryKey: queryKeys.staffQuizzes.all });
    qc.invalidateQueries({ queryKey: queryKeys.quizzes.all });
  } else if (type === "historical-contexts") {
    qc.invalidateQueries({ queryKey: queryKeys.events.all });
  } else {
    qc.invalidateQueries({ queryKey: queryKeys.characters.all });
  }
}

export function useTrashList(type: TrashItemType) {
  return useQuery({
    queryKey: trashQueryKey(type),
    queryFn: () => trashService.list(type),
    staleTime: 1000 * 30,
  });
}

/**
 * The trash list only carries id + name + deletedAt. Staff can still read a trashed item's detail, so load each one
 * (same cache keys as the detail pages) to show what was deleted. Missing entries just render "—".
 */
export function useTrashCharacterDetails(ids: string[]) {
  return useQueries({
    queries: ids.map((id) => ({
      queryKey: queryKeys.characters.detail(id),
      queryFn: () => characterService.getById(id),
      staleTime: 1000 * 60 * 5,
      retry: false,
    })),
    combine: (results) => {
      const map = new Map<string, Character>();
      results.forEach((r, i) => { if (r.data) map.set(ids[i], r.data); });
      return map;
    },
  });
}

export function useTrashContextDetails(ids: string[]) {
  return useQueries({
    queries: ids.map((id) => ({
      queryKey: queryKeys.events.detail(id),
      queryFn: () => eventService.getById(id),
      staleTime: 1000 * 60 * 5,
      retry: false,
    })),
    combine: (results) => {
      const map = new Map<string, HistoricalEvent>();
      results.forEach((r, i) => { if (r.data) map.set(ids[i], r.data); });
      return map;
    },
  });
}

export function useTrashRestore(type: TrashItemType) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => trashService.restore(type, ids),
    onSuccess: () => invalidateRelated(qc, type),
  });
}

export function useTrashPermanentDelete(type: TrashItemType) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => trashService.permanentDelete(type, ids),
    onSuccess: (_, ids) => {
      invalidateRelated(qc, type);
      if (type === "historical-contexts") {
        ids.forEach((id) => removeContextFromCharacterCaches(qc, id));
      }
    },
  });
}
