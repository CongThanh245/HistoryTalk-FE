
import { Calendar } from "lucide-react";
import { ArchiveHeading } from "@/components/commons/archive-heading";


interface ChatHistoryHeaderProps {
  totalSessions: number;
}

export function ChatHistoryHeader({ totalSessions }: ChatHistoryHeaderProps) {
  return (
    <div className="relative mb-4 md:mb-6">
      <ArchiveHeading
        as="h1"
        label="Lưu trữ"
        title="Lịch sử trò chuyện"
        description="Xem lại các cuộc trò chuyện với nhân vật lịch sử"
        className="mb-0 pr-0 sm:pr-48"
      />

      <div className="absolute right-0 bottom-3 hidden sm:flex shrink-0 items-center gap-2 rounded-[2px] px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.1em] border border-[var(--text-primary)] text-[var(--text-primary)]">
        <Calendar className="w-3.5 h-3.5 text-accent-gold" />
        <span className="font-display text-sm font-extrabold">{totalSessions}</span> cuộc trò chuyện
      </div>
    </div>
  );
}
