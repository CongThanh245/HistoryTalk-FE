"use client";
// components/chat-history/chat-history-filters.tsx
// ✅ Client Component — chứa callbacks onChange (cần browser event)
// Nhưng được tách riêng → chỉ phần này re-render khi filter thay đổi

import { EraFilter } from "@/components/commons/era-filter";
import { SearchInput } from "@/components/commons/search-input";
import type { EventEra } from "@/services/event.service";

interface ChatHistoryFiltersProps {
  era: EventEra;
  search: string;
  eraCounts: Partial<Record<EventEra, number>>;
  onEraChange: (era: EventEra) => void;
  onSearchChange: (search: string) => void;
}

export function ChatHistoryFilters({
  era,
  search,
  eraCounts,
  onEraChange,
  onSearchChange,
}: ChatHistoryFiltersProps) {
  return (
    <div className="flex flex-col gap-3 mb-8">
      <EraFilter active={era} onChange={onEraChange} counts={eraCounts} />
      <SearchInput
        value={search}
        onChange={onSearchChange}
        placeholder="Tìm nhân vật, sự kiện, nội dung..."
      />
    </div>
  );
}
