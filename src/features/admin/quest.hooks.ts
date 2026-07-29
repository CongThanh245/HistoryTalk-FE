// src/features/admin/quest.hooks.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  adminQuestService,
  type AdminQuest,
  type AdminQuestType,
  type UpdateQuestPayload,
} from "@/services/admin.quest.service";

export type { AdminQuest, AdminQuestType, UpdateQuestPayload };

const QUEST_KEYS = {
  all: ["admin", "quests"] as const,
};

function getErrorMessage(err: unknown, fallback: string): string {
  const error = err as { response?: { data?: { message?: string } }; message?: string } | null;
  return error?.response?.data?.message ?? error?.message ?? fallback;
}

/** Toàn bộ quest definitions, kể cả đang tắt */
export function useAdminQuests() {
  return useQuery({
    queryKey: QUEST_KEYS.all,
    queryFn: adminQuestService.listQuests,
    staleTime: 1000 * 30,
  });
}

export function useAdminUpdateQuest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateQuestPayload }) =>
      adminQuestService.updateQuest(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUEST_KEYS.all });
      toast.success("Cập nhật nhiệm vụ thành công");
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Cập nhật nhiệm vụ thất bại"));
    },
  });
}
