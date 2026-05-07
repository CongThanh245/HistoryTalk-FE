import { ChatHistoryShell } from "@/components/chat-history";

export const metadata = {
  title: "Lịch sử trò chuyện",
  description: "Xem lại các cuộc trò chuyện với nhân vật lịch sử",
};
export default function ChatHistoryPage() {
  return <ChatHistoryShell />;
}
