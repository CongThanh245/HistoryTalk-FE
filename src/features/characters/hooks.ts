import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  characterService,
  type GetCharactersParams,
  type CreateCharacterRequest,
  type UpdateCharacterRequest,
  type GetCharactersResponse,
} from "@/services/character.service";
import { queryKeys } from "@/shared/query-key";
import { toast } from "sonner";

export function useCharacters(params?: GetCharactersParams) {
  return useQuery({
    queryKey: queryKeys.characters.list(params),
    queryFn: () => characterService.getAll(params),
    staleTime: 1000 * 60 * 5,
    placeholderData: (prev) => prev,
  });
}

export function useCreateCharacter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCharacterRequest) => characterService.create(data),
    onSuccess: (newChar) => {
      qc.setQueryData(
        queryKeys.characters.list({ page: 1, limit: 100 }),
        (old: GetCharactersResponse | undefined) => {
          if (!old) return old;
          return { ...old, content: [newChar, ...old.content] };
        },
      );
      toast.success("Tạo nhân vật thành công");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Tạo nhân vật thất bại");
    },
  });
}

export function useUpdateCharacter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCharacterRequest }) =>
      characterService.update(id, data),
    onSuccess: (updated) => {
      qc.setQueryData(
        queryKeys.characters.list({ page: 1, limit: 100 }),
        (old: GetCharactersResponse | undefined) => {
          if (!old) return old;
          return {
            ...old,
            content: old.content.map((c) =>
              c.id === updated.id ? updated : c,
            ),
          };
        },
      );
      toast.success("Cập nhật thành công");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Cập nhật thất bại");
    },
  });
}

export function useDeleteCharacter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => characterService.softDelete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.characters.all });
      toast.success("Đã chuyển vào thùng rác");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Xóa thất bại");
    },
  });
}
