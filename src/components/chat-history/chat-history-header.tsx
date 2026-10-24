import { ArchiveHeading } from "@/components/commons/archive-heading";

interface ChatHistoryHeaderProps {
  /** null while loading (or signed out): the line then says what the page is for instead of a count. */
  totalSessions: number | null;
}

export function ChatHistoryHeader({ totalSessions }: ChatHistoryHeaderProps) {
  return (
    <ArchiveHeading
      as="h1"
      title="Lịch sử trò chuyện"
      description={
        totalSessions
          ? `${totalSessions.toLocaleString("vi-VN")} cuộc trò chuyện với nhân vật lịch sử. Mở lại để hỏi tiếp từ chỗ bạn dừng.`
          : "Xem lại và hỏi tiếp các cuộc trò chuyện với nhân vật lịch sử."
      }
      className="mb-4 md:mb-6"
    />
  );
}
