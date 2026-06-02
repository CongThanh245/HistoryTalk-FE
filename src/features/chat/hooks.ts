import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { chatService, type ChatHistoryGroup } from "@/services/chat.service";
import { queryKeys } from "@/shared/query-key";
import { toast } from "sonner";

export function useChatSessions(
  contextId: string,
  characterId: string,
  ready = true,
) {
  return useQuery({
    queryKey: queryKeys.chat.sessions(contextId, characterId),
    queryFn: () => chatService.getSessions(contextId, characterId),
    enabled: !!contextId && !!characterId && ready,
    staleTime: 0, // ← luôn fetch lại khi mount để lấy sessions mới nhất
    refetchOnWindowFocus: false, // ← không refetch khi focus tab
    refetchOnMount: true, // ← fetch khi mount để tránh dùng cache cũ
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
      contextId,
      characterId,
    }: {
      contextId: string;
      characterId: string;
    }) => chatService.createSession(contextId, characterId),
    onSuccess: (_, { contextId, characterId }) => {
      qc.invalidateQueries({
        queryKey: queryKeys.chat.sessions(contextId, characterId),
      });
    },
    onError: () => toast.error("Không thể tạo cuộc trò chuyện mới"),
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
      // Invalidate profile to update token count in sidebar
      qc.invalidateQueries({ queryKey: queryKeys.profile.me });
    },
    onError: (error: any) => {
      const serverMessage = error?.response?.data?.message;
      if (
        serverMessage &&
        (serverMessage.includes("hết token") || serverMessage.includes("nạp thêm"))
      ) {
        return;
      }
      toast.error("Không thể gửi tin nhắn");
    },
  });
}

export function useChatHistory() {
  return useQuery({
    queryKey: queryKeys.chat.history,
    queryFn: () => chatService.getHistory(),
    staleTime: 1000 * 60,
  });
}

export function useDeleteSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => chatService.deleteSession(sessionId),
    onMutate: async (sessionId) => {
      // Cancel any outgoing refetches
      await qc.cancelQueries({ queryKey: queryKeys.chat.history });
      
      // Snapshot previous value
      const previousHistory = qc.getQueryData<ChatHistoryGroup[]>(queryKeys.chat.history);
      
      // Optimistically update to new value (remove deleted session)
      if (previousHistory) {
        const newHistory = previousHistory
          .map((group) => ({
            ...group,
            sessions: group.sessions.filter((s: { id: string }) => s.id !== sessionId),
          }))
          .filter((group) => group.sessions.length > 0); // Remove empty groups
        
        qc.setQueryData(queryKeys.chat.history, newHistory);
      }
      
      return { previousHistory };
    },
    onSuccess: async () => {
      // Force refetch để đảm bảo UI đồng bộ
      await qc.refetchQueries({ queryKey: queryKeys.chat.history });
      toast.success("Đã xóa cuộc trò chuyện");
    },
    onError: (err, sessionId, context) => {
      // Rollback on error
      if (context?.previousHistory) {
        qc.setQueryData(queryKeys.chat.history, context.previousHistory);
      }
      toast.error("Không thể xóa cuộc trò chuyện");
    },
  });
}

export function useSoftDeleteSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => chatService.softDeleteSession(sessionId),
    onMutate: async (sessionId) => {
      // Cancel any outgoing refetches
      await qc.cancelQueries({ queryKey: queryKeys.chat.history });
      
      // Snapshot previous value
      const previousHistory = qc.getQueryData<ChatHistoryGroup[]>(queryKeys.chat.history);
      
      // Optimistically update to new value (remove deleted session)
      if (previousHistory) {
        const newHistory = previousHistory
          .map((group) => ({
            ...group,
            sessions: group.sessions.filter((s: { id: string }) => s.id !== sessionId),
          }))
          .filter((group) => group.sessions.length > 0); // Remove empty groups
        
        qc.setQueryData(queryKeys.chat.history, newHistory);
      }
      
      return { previousHistory };
    },
    onSuccess: async (_, sessionId) => {
      // Invalidate và refetch để đảm bảo UI đồng bộ
      await qc.invalidateQueries({ queryKey: ["chat", "sessions"] });
      await qc.refetchQueries({ queryKey: queryKeys.chat.history });
      toast.success("Đã xóa cuộc trò chuyện");
    },
    onError: (err, sessionId, context) => {
      // Rollback on error
      if (context?.previousHistory) {
        qc.setQueryData(queryKeys.chat.history, context.previousHistory);
      }
      toast.error("Không thể xóa cuộc trò chuyện");
    },
  });
}
