
import { CalendarIcon } from "@phosphor-icons/react/dist/ssr";


interface ChatHistoryHeaderProps {
  totalSessions: number;
}

export function ChatHistoryHeader({ totalSessions }: ChatHistoryHeaderProps) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3 md:mb-6">
      <div className="flex items-center gap-3">
        <div>
          <h1
            className="text-xl font-bold md:text-2xl"
            style={{ color: "var(--content-heading)" }}
          >
            Lịch sử trò chuyện
          </h1>
          <p
            className="mt-0.5 text-xs md:text-sm"
            style={{ color: "var(--content-muted)" }}
          >
            Xem lại các cuộc trò chuyện với nhân vật lịch sử
          </p>
        </div>
      </div>

      <div
        className="shrink-0 items-center gap-2 rounded-full px-2.5 py-1.5 text-xs font-medium hidden sm:flex"
        style={{
          background: "rgba(201,162,77,0.08)",
          border: "1px solid rgba(201,162,77,0.18)",
          color: "var(--gold-on-light)",
        }}
      >
        <CalendarIcon className="w-3.5 h-3.5" />
        {totalSessions} cuộc trò chuyện
      </div>
    </div>
  );
}
