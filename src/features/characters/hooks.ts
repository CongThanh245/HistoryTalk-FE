import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  characterService,
  type Character,
  type GetCharactersParams,
  type CreateCharacterRequest,
  type UpdateCharacterRequest,
  type GetCharactersResponse,
} from "@/services/character.service";
import { queryKeys } from "@/shared/query-key";
import { toast } from "sonner";

function isCharactersResponse(value: unknown): value is GetCharactersResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    Array.isArray((value as GetCharactersResponse).content)
  );
}

function getErrorMessage(err: unknown, fallback: string) {
  if (
    typeof err === "object" &&
    err !== null &&
    "response" in err &&
    typeof err.response === "object" &&
    err.response !== null &&
    "data" in err.response &&
    typeof err.response.data === "object" &&
    err.response.data !== null &&
    "message" in err.response.data &&
    typeof err.response.data.message === "string"
  ) {
    return err.response.data.message;
  }

  return fallback;
}

export function useCharacters(
  params?: GetCharactersParams,
  initialData?: GetCharactersResponse,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: queryKeys.characters.list(params),
    queryFn: () => characterService.getAll(params),
    initialData,
    staleTime: 1000 * 60 * 5,
    placeholderData: (prev) => prev,
    enabled: options?.enabled ?? true,
  });
}

export function useCharacter(id?: string) {
  return useQuery({
    queryKey: queryKeys.characters.detail(id || ""),
    queryFn: () => characterService.getById(id!),
    enabled: !!id,
  });
}

export function useCharactersByContext(contextId?: string) {
  return useQuery({
    queryKey: queryKeys.characters.byContext(contextId || ""),
    queryFn: () => characterService.getByContext(contextId!),
    enabled: !!contextId,
  });
}

export function useCreateCharacter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCharacterRequest) => characterService.create(data),
    onSuccess: (newChar) => {
      qc.setQueriesData(
        { queryKey: queryKeys.characters.all },
        (old: unknown) => {
          if (!isCharactersResponse(old)) return old;
          return { ...old, content: [newChar, ...old.content] };
        },
      );
      qc.setQueryData(queryKeys.characters.detail(newChar.id), newChar);
      toast.success("Tạo nhân vật thành công");
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Tạo nhân vật thất bại"));
    },
  });
}

export function useUpdateCharacter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCharacterRequest }) =>
      characterService.update(id, data),
    onSuccess: (updated, { id }) => {
      qc.setQueryData(
        queryKeys.characters.detail(id),
        (old: Character | undefined) => ({
          ...old,
          ...updated,
          contextId: updated.contextId ?? old?.contextId,
        }),
      );
      qc.setQueriesData(
        { queryKey: queryKeys.characters.all },
        (old: unknown) => {
          if (!isCharactersResponse(old)) return old;
          return {
            ...old,
            content: old.content.map((c) =>
              c.id === updated.id
                ? { ...c, ...updated, contextId: updated.contextId ?? c.contextId }
                : c,
            ),
          };
        },
      );
      toast.success("Cập nhật thành công");
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Cập nhật thất bại"));
    },
  });
}

export function useDeleteCharacter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => characterService.softDelete(id),
    onSuccess: (_, id) => {
      qc.setQueriesData(
        { queryKey: queryKeys.characters.all },
        (old: unknown) => {
          if (!isCharactersResponse(old)) return old;
          return {
            ...old,
            content: old.content.filter((character) => character.id !== id),
            totalElements: Math.max(0, old.totalElements - 1),
          };
        },
      );
      qc.invalidateQueries({ queryKey: queryKeys.characters.all });
      qc.invalidateQueries({ queryKey: queryKeys.trash.characters });
      toast.success("Đã chuyển vào thùng rác");
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Xóa thất bại"));
    },
  });
}

export function usePermanentDeleteCharacter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => characterService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.characters.all });
      toast.success("Đã xóa vĩnh viễn nhân vật");
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Xóa vĩnh viễn thất bại"));
    },
  });
}

export function useMapContextToCharacter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      characterId,
      contextId,
    }: {
      characterId: string;
      contextId: string;
      contextName?: string;
    }) => characterService.mapContext(characterId, contextId),
    onSuccess: (_result, { characterId, contextId, contextName }) => {
      const name = contextName ?? "";
      qc.setQueryData(
        queryKeys.characters.detail(characterId),
        (old: Character | undefined) =>
          old ? { ...old, contexts: [...(old.contexts || []), { contextId, name }] } : old,
      );
      qc.setQueriesData(
        { queryKey: queryKeys.characters.all },
        (old: unknown) => {
          if (!isCharactersResponse(old)) return old;
          return {
            ...old,
            content: old.content.map((c) =>
              c.id === characterId ? { ...c, contexts: [...(c.contexts || []), { contextId, name }] } : c,
            ),
          };
        },
      );
      qc.invalidateQueries({ queryKey: queryKeys.characters.byContext(contextId) });
      toast.success("Liên kết bối cảnh thành công");
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Liên kết bối cảnh thất bại"));
    },
  });
}

export function useUnmapContextFromCharacter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ characterId, contextId }: { characterId: string; contextId: string }) =>
      characterService.unmapContext(characterId, contextId),
    onSuccess: (_result, { characterId, contextId }) => {
      qc.setQueryData(
        queryKeys.characters.detail(characterId),
        (old: Character | undefined) =>
          old ? { ...old, contexts: (old.contexts || []).filter(c => c.contextId !== contextId) } : old,
      );
      qc.setQueriesData(
        { queryKey: queryKeys.characters.all },
        (old: unknown) => {
          if (!isCharactersResponse(old)) return old;
          return {
            ...old,
            content: old.content.map((c) =>
              c.id === characterId ? { ...c, contexts: (c.contexts || []).filter(ctx => ctx.contextId !== contextId) } : c,
            ),
          };
        },
      );
      qc.invalidateQueries({ queryKey: queryKeys.characters.byContext(contextId) });
      toast.success("Gỡ liên kết bối cảnh thành công");
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Gỡ liên kết bối cảnh thất bại"));
    },
  });
}
