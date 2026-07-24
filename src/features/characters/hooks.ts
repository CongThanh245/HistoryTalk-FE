import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  characterService,
  type Character,
  type GetCharactersParams,
  type CreateCharacterRequest,
  type UpdateCharacterRequest,
  type GetCharactersResponse,
} from "@/services/character.service";
import { characterMediaService, type MediaType } from "@/services/media.service";
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
  const qc = useQueryClient();
  return useQuery({
    queryKey: queryKeys.characters.detail(id || ""),
    queryFn: () => characterService.getById(id!),
    enabled: !!id,
    // The character list page (limit 100) already has this exact record in
    // cache by the time the user clicks "Chỉnh sửa" — reuse it so the detail
    // page renders instantly instead of showing a skeleton for the ~2-3s
    // round trip, then silently revalidate in the background.
    initialData: () => {
      if (!id) return undefined;
      const cachedLists = qc.getQueriesData<GetCharactersResponse>({
        queryKey: ["characters", "list"],
      });
      for (const [, data] of cachedLists) {
        const found = data?.content?.find((c) => c.id === id);
        if (found) return found;
      }
      return undefined;
    },
    // The reused list record carries signed image/model URLs that expire
    // after 1h server-side — staleTime 0 forces an immediate background
    // refetch so the detail page swaps in freshly signed URLs right away
    // instead of trusting a possibly-already-expired cached one for up to
    // the global 5-minute default staleTime.
    staleTime: 0,
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

// POST /characters/{id}/media/upload-direct — upload image/video/3D model
export function useUploadCharacterMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      characterId,
      file,
      mediaType,
    }: {
      characterId: string;
      file: File;
      mediaType: MediaType;
    }) => characterMediaService.upload(characterId, file, mediaType),
    onSuccess: (result, { characterId }) => {
      // Write the freshly returned viewUrl straight into cache instead of
      // relying solely on invalidateQueries: at this point (e.g. right
      // after character creation) nothing may be observing these queries
      // yet, so invalidate-only leaves stale (image-less) data in place
      // until an unrelated refetch happens — which is why the image used
      // to only show up after a manual F5.
      const applyUrl = (c: Character): Character => {
        if (result.mediaType === "IMAGE_2D") {
          return { ...c, imageUrl: result.viewUrl, avatarUrl: result.viewUrl };
        }
        if (result.mediaType === "VIDEO") {
          return { ...c, videoUrl: result.viewUrl };
        }
        if (result.mediaType === "MODEL_3D") {
          return { ...c, modelUrl: result.viewUrl };
        }
        return c;
      };
      qc.setQueryData(
        queryKeys.characters.detail(characterId),
        (old: Character | undefined) => (old ? applyUrl(old) : old),
      );
      qc.setQueriesData(
        { queryKey: queryKeys.characters.all },
        (old: unknown) => {
          if (!isCharactersResponse(old)) return old;
          return {
            ...old,
            content: old.content.map((c) => (c.id === characterId ? applyUrl(c) : c)),
          };
        },
      );
      qc.invalidateQueries({ queryKey: queryKeys.characters.detail(characterId) });
      qc.invalidateQueries({ queryKey: queryKeys.characters.all });
      toast.success("Đã tải lên media thành công");
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Tải lên media thất bại"));
    },
  });
}

// DELETE /characters/{id}/media — mediaType omitted clears every slot
export function useDeleteCharacterMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ characterId, mediaType }: { characterId: string; mediaType?: MediaType }) =>
      characterMediaService.delete(characterId, mediaType),
    onSuccess: (_result, { characterId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.characters.detail(characterId) });
      qc.invalidateQueries({ queryKey: queryKeys.characters.all });
      toast.success("Đã xóa media");
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Xóa media thất bại"));
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
