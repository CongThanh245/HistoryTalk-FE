// components/chat-history/chat-history-empty-state.tsx
// ✅ Không cần "use client" — pure UI

import { Glasses } from "lucide-react";

interface ChatHistoryEmptyStateProps {
  hasFilter: boolean;
  isNotAuthenticated?: boolean;
}

export function ChatHistoryEmptyState({
  hasFilter,
  isNotAuthenticated,
}: ChatHistoryEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 border-y border-[var(--border-strong)]">
      <div className="w-16 h-16 rounded-[2px] flex items-center justify-center bg-[var(--bg-surface)] border border-[var(--text-primary)]">
        <Glasses className="w-7 h-7 text-[var(--text-tertiary)]" />
      </div>
      <div className="text-center">
        <p className="archive-title is-plain text-xl">
          {isNotAuthenticated
            ? "Lịch sử trống"
            : hasFilter
            ? "Không tìm thấy kết quả"
            : "Chưa có lịch sử trò chuyện"}
        </p>
        <p className="text-sm mt-1 text-content-muted">
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
