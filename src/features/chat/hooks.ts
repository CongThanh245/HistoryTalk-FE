import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { chatService } from "@/services/chat.service";
import { queryKeys } from "@/shared/query-key";
import { toast } from "sonner";

export function useChatSessions(contextId: string, characterId: string) {
  return useQuery({
    queryKey: queryKeys.chat.sessions(contextId, characterId),
    queryFn: () => chatService.getSessions(contextId, characterId),
    enabled: !!contextId && !!characterId,
    staleTime: 1000 * 60,
  });
}

export function useChatMessages(sessionId: string | null) {
  return useQuery({
    queryKey: queryKeys.chat.messages(sessionId ?? ""),
    queryFn: () => chatService.getMessages(sessionId!),
    enabled: !!sessionId,
    staleTime: 0, // messages luôn fresh
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
  return useMutation({
    mutationFn: ({
      sessionId,
      content,
    }: {
      sessionId: string;
      content: string;
    }) => chatService.sendMessage(sessionId, content),
    onError: () => toast.error("Không thể gửi tin nhắn"),
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chat", "history"] });
      toast.success("Đã xóa cuộc trò chuyện");
    },
    onError: () => toast.error("Không thể xóa cuộc trò chuyện"),
  });
}
