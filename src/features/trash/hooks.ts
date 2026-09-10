import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
