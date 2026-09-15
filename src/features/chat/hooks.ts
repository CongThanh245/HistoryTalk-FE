import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { chatService, type ChatHistoryGroup } from "@/services/chat.service";
import { queryKeys } from "@/shared/query-key";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth.store";
import { isTokenExhaustionError } from "@/lib/utils/api-error";

export function useChatSessions(
  characterId: string,
  contextId: string,
  ready = true,
) {
  return useQuery({
    queryKey: queryKeys.chat.sessions(characterId, contextId),
    queryFn: () => chatService.getSessions(characterId, contextId),
    enabled: !!characterId && !!contextId && ready,
    staleTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: false,
  });
}

export function useChatMessages(sessionId: string | null) {
  return useQuery({
    queryKey: queryKeys.chat.messages(sessionId ?? ""),
    queryFn: () => chatService.getMessages(sessionId!),
    enabled: !!sessionId,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
}

export function useCreateSession() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      characterId,
      contextId,
    }: {
      characterId: string;
      contextId: string;
    }) => chatService.createSession(characterId, contextId),
    onSuccess: (_, { characterId, contextId }) => {
      qc.invalidateQueries({
        queryKey: queryKeys.chat.sessions(characterId, contextId),
      });
    },
    onError: (error: unknown) => {
      if (isTokenExhaustionError(error)) {
        toast.error("Bạn đã hết token. Vui lòng nạp thêm để tiếp tục chat.", {
          duration: 8000,
        });
        return;
      }

      toast.error("Không thể tạo cuộc trò chuyện mới");
    },
  });
}

export function useSendMessage() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      sessionId,
      content,
    }: {
      sessionId: string;
      content: string;
    }) => chatService.sendMessage(sessionId, content),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.profile.me });
    },
    onError: (error: unknown) => {
      if (isTokenExhaustionError(error)) {
        return;
      }

      toast.error("Không thể gửi tin nhắn");
    },
  });
}

export function useChatHistory() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: queryKeys.chat.history,
    queryFn: () => chatService.getHistory(),
    enabled: isAuthenticated,
    staleTime: 1000 * 60,
  });
}

export function useDeleteSession() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => chatService.deleteSession(sessionId),
    onSuccess: async () => {
      await qc.refetchQueries({ queryKey: queryKeys.chat.history });
      toast.success("Đã xóa cuộc trò chuyện");
    },
    onError: () => {
      toast.error("Không thể xóa cuộc trò chuyện");
    },
  });
}

export function useSoftDeleteSession() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => chatService.softDeleteSession(sessionId),
    onMutate: async (sessionId) => {
      await qc.cancelQueries({ queryKey: queryKeys.chat.history });

      const previousHistory = qc.getQueryData<ChatHistoryGroup[]>(
        queryKeys.chat.history,
      );

      if (previousHistory) {
        const newHistory = previousHistory
          .map((group) => ({
            ...group,
            sessions: (group.sessions ?? []).filter(
              (s: { id: string }) => s.id !== sessionId,
            ),
          }))
          .filter((group) => group.sessions.length > 0);

        qc.setQueryData(queryKeys.chat.history, newHistory);
      }

      return { previousHistory };
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["chat", "sessions"] });
      await qc.refetchQueries({ queryKey: queryKeys.chat.history });
      toast.success("Đã xóa cuộc trò chuyện");
    },
    onError: (_err, _sessionId, context) => {
      if (context?.previousHistory) {
        qc.setQueryData(queryKeys.chat.history, context.previousHistory);
      }

      toast.error("Không thể xóa cuộc trò chuyện");
    },
  });
}
