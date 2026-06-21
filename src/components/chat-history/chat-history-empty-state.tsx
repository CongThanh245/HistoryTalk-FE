// components/chat-history/chat-history-empty-state.tsx
// ✅ Không cần "use client" — pure UI

import { VisorIcon } from "@phosphor-icons/react/dist/ssr";

interface ChatHistoryEmptyStateProps {
  hasFilter: boolean;
  isNotAuthenticated?: boolean;
}

export function ChatHistoryEmptyState({
  hasFilter,
  isNotAuthenticated,
}: ChatHistoryEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{
          background:
            "linear-gradient(135deg, rgba(201,162,77,0.10) 0%, rgba(163,81,57,0.06) 100%)",
          border: "1px solid rgba(201,162,77,0.15)",
        }}
      >
        <VisorIcon
          className="w-7 h-7"
          style={{ color: "var(--gold-on-light)", opacity: 0.5 }}
        />
      </div>
      <div className="text-center">
        <p
          className="text-base font-semibold"
          style={{ color: "var(--content-heading)" }}
        >
          {isNotAuthenticated
            ? "Lịch sử trống"
            : hasFilter
            ? "Không tìm thấy kết quả"
            : "Chưa có lịch sử trò chuyện"}
        </p>
        <p className="text-sm mt-1" style={{ color: "var(--content-muted)" }}>
          {isNotAuthenticated
            ? "Bạn cần đăng nhập để hiển thị lịch sử trò chuyện"
            : hasFilter
            ? "Thử thay đổi bộ lọc hoặc từ khoá tìm kiếm"
            : "Bắt đầu trò chuyện với nhân vật lịch sử để xem lại ở đây"}
        </p>
      </div>
    </div>
  );
}
