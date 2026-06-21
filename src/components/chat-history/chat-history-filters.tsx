"use client";
// components/chat-history/chat-history-filters.tsx
// ✅ Client Component — chứa callbacks onChange (cần browser event)
// Nhưng được tách riêng → chỉ phần này re-render khi filter thay đổi

import { SearchInput } from "@/components/commons/search-input";

interface ChatHistoryFiltersProps {
  search: string;
  onSearchChange: (search: string) => void;
}

export function ChatHistoryFilters({
  search,
  onSearchChange,
}: ChatHistoryFiltersProps) {
  return (
    <div className="mb-4 md:mb-6">
      <SearchInput
        value={search}
        onChange={onSearchChange}
        placeholder="Tìm nhân vật, sự kiện, nội dung..."
      />
    </div>
  );
}
