// components/chat-history/chat-history-header.tsx
// ✅ Không cần "use client" — pure UI, nhận props tĩnh

import { CalendarIcon } from "@phosphor-icons/react/dist/ssr";
// ⚠️ Import từ /dist/ssr để dùng trong Server Component
// Nếu Phosphor chưa support SSR, wrap trong một client wrapper nhỏ

interface ChatHistoryHeaderProps {
  totalSessions: number;
}

export function ChatHistoryHeader({ totalSessions }: ChatHistoryHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div className="flex items-center gap-3">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ color: "var(--content-heading)" }}
          >
            Lịch sử trò chuyện
          </h1>
          <p
            className="text-sm mt-0.5"
            style={{ color: "var(--content-muted)" }}
          >
            Xem lại các cuộc trò chuyện với nhân vật lịch sử
          </p>
        </div>
      </div>

      <div
        className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
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