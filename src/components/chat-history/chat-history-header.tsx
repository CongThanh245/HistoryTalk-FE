
import { Calendar } from "lucide-react";


interface ChatHistoryHeaderProps {
  totalSessions: number;
}

export function ChatHistoryHeader({ totalSessions }: ChatHistoryHeaderProps) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3 md:mb-6">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-xl font-bold md:text-2xl text-content-heading">
            Lịch sử trò chuyện
          </h1>
          <p className="mt-0.5 text-xs md:text-sm text-content-muted">
            Xem lại các cuộc trò chuyện với nhân vật lịch sử
          </p>
        </div>
      </div>

      <div className="shrink-0 items-center gap-2 rounded-full px-2.5 py-1.5 text-xs font-medium hidden sm:flex bg-accent-gold/[0.08] border border-accent-gold/[0.18] text-gold-on-light">
        <Calendar className="w-3.5 h-3.5" />
        {totalSessions} cuộc trò chuyện
      </div>
    </div>
  );
}
