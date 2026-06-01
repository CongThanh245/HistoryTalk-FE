"use client";

import { useState } from "react";
import { EraFilter } from "@/components/commons/era-filter";
import { SearchInput } from "@/components/commons/search-input";
import { useQuery } from "@tanstack/react-query";
import {
  characterService,
  type GetCharactersParams,
} from "@/services/character.service";
import { queryKeys } from "@/shared/query-key"; // ← dùng queryKeys chung
import type { EventEra, EventEraBackend } from "@/services/event.service";
import {
  CharacterPageCard,
  CharacterPageCardSkeleton,
} from "../commons/character-card";
import { CustomPagination } from "../commons/pagination";
import { useAuthRequiredNavigation } from "@/features/auth/use-auth-required-navigation";

const PAGE_LIMIT = 8;

// ── Era map: UI lowercase → Backend uppercase ─────────────

const ERA_TO_BACKEND: Partial<Record<EventEra, EventEraBackend>> = {
  ancient: "ANCIENT",
  medieval: "MEDIEVAL",
  modern: "MODERN",
  contemporary: "CONTEMPORARY",
};

// ── Hook ──────────────────────────────────────────────────

function useCharacters(era: EventEra, search: string, page: number) {
  const params: GetCharactersParams = {
    page,
    limit: PAGE_LIMIT,
    ...(era !== "all" && { era: ERA_TO_BACKEND[era] }),
    ...(search.trim() && { search: search.trim() }),
  };

  return useQuery({
    queryKey: queryKeys.characters.list(params), // ← đổi
    queryFn: () => characterService.getAll(params), // ← đổi
    placeholderData: (prev) => prev,
  });
}

// ── Component ─────────────────────────────────────────────

export function CharactersClient() {
  const { authRequiredDialog, navigateWithAuth } = useAuthRequiredNavigation();
  const [era, setEra] = useState<EventEra>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useCharacters(era, search, page);

  const handleEraChange = (e: EventEra) => {
    setEra(e);
    setPage(1);
  };
  const handleSearch = (s: string) => {
    setSearch(s);
    setPage(1);
  };
  const handleClick = (id: string) => navigateWithAuth(`/chat/${id}`);

  return (
    <>
      {authRequiredDialog}
      <div className="space-y-4 md:space-y-5">
      {/* Filters */}
      <div className="flex flex-col gap-3">
        <EraFilter active={era} onChange={handleEraChange} />
        <SearchInput
          value={search}
          onChange={handleSearch}
          placeholder="Tìm nhân vật, triều đại, sự kiện..."
        />
      </div>

      {/* Result count */}
      {!isLoading && data && (
        <p className="text-xs" style={{ color: "var(--content-subtle)" }}>
          {data.totalElements} nhân vật
          {search && ` · kết quả cho "${search}"`}
        </p>
      )}

      {/* Error */}
      {isError && (
        <div className="py-10 text-center">
          <p
            className="text-sm font-medium"
            style={{ color: "var(--content-heading)" }}
          >
            Không thể tải danh sách nhân vật
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--content-muted)" }}>
            Vui lòng thử lại sau
          </p>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        {isLoading
          ? Array.from({ length: PAGE_LIMIT }).map((_, i) => (
              <CharacterPageCardSkeleton key={i} />
            ))
          : data?.content.map((char) => (
              <CharacterPageCard
                key={char.id}
                character={char}
                onClick={handleClick}
              />
            ))}
      </div>

      {/* Empty */}
      {!isLoading && !isError && data?.content.length === 0 && (
        <div className="py-20 text-center">
          <p
            className="text-sm font-medium"
            style={{ color: "var(--content-heading)" }}
          >
            Không tìm thấy nhân vật nào
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--content-muted)" }}>
            Thử thay đổi bộ lọc hoặc từ khoá tìm kiếm
          </p>
        </div>
      )}

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <CustomPagination
          page={page}
          totalPages={data.totalPages}
          onChange={setPage}
        />
      )}
      </div>
    </>
  );
}
