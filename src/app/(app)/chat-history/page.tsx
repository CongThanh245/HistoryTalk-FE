import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/get-query-client";
import { queryKeys } from "@/shared/query-key";
import { chatHistoryServerService } from "@/services/chat-history.server.service";
import { ChatHistoryShell } from "@/components/chat-history";

export const metadata = {
  title: "Lịch sử trò chuyện",
  description: "Xem lại các cuộc trò chuyện với nhân vật lịch sử",
};

export default async function ChatHistoryPage() {
  const queryClient = getQueryClient();

  try {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.chatHistory.list(),
      queryFn: () => chatHistoryServerService.getHistory(),
    });
  } catch (e) {
    // Prefetch fail → client sẽ tự fetch lại, không crash page
    console.error("[ChatHistoryPage] prefetch failed:", e);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ChatHistoryShell />
    </HydrationBoundary>
  );
}
