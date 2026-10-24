// components/chat-history/chat-history-empty-state.tsx
// ✅ Không cần "use client" — pure UI

import Link from "next/link";
import { MessagesSquare, SearchX } from "lucide-react";
import { ROUTES } from "@/constants/routes";

interface ChatHistoryEmptyStateProps {
  hasFilter: boolean;
  isNotAuthenticated?: boolean;
}

/** Says why the list is empty and offers the one next step: start a conversation, sign in, or loosen the search. */
export function ChatHistoryEmptyState({
  hasFilter,
  isNotAuthenticated,
}: ChatHistoryEmptyStateProps) {
  const Icon = hasFilter ? SearchX : MessagesSquare;
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-[var(--border-strong)] px-6 py-16 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-full bg-[var(--status-neutral-bg)]">
        <Icon className="h-6 w-6 text-[var(--text-tertiary)]" aria-hidden="true" />
      </div>
      <div>
        <p className="text-lg font-semibold text-content-heading">
          {isNotAuthenticated
            ? "Đăng nhập để xem lịch sử"
            : hasFilter
            ? "Không tìm thấy cuộc trò chuyện nào"
            : "Bạn chưa trò chuyện với nhân vật nào"}
        </p>
        <p className="mx-auto mt-1 max-w-md text-sm text-content-muted">
          {isNotAuthenticated
            ? "Các cuộc trò chuyện của bạn được lưu theo tài khoản."
            : hasFilter
            ? "Thử từ khóa khác, ví dụ tên nhân vật hoặc tên sự kiện."
            : "Chọn một nhân vật lịch sử và đặt câu hỏi. Mọi cuộc trò chuyện sẽ được lưu ở đây để bạn hỏi tiếp lúc khác."}
        </p>
      </div>
      {!hasFilter && (
        <Link href={isNotAuthenticated ? ROUTES.LOGIN : ROUTES.CHARACTERS} className="btn-crimson">
          {isNotAuthenticated ? "Đăng nhập" : "Trò chuyện với nhân vật"}
        </Link>
      )}
    </div>
  );
}
