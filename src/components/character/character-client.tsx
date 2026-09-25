"use client";

import { usePathname, useSearchParams } from "next/navigation";
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
import { parseEra, parsePage } from "@/lib/catalog-url-state";

const PAGE_LIMIT = 10;

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
    staleTime: 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    placeholderData: (prev) => prev,
  });
}

// ── Component ─────────────────────────────────────────────

export function CharactersClient() {
  const { authRequiredDialog, navigateWithAuth } = useAuthRequiredNavigation();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const era = parseEra(searchParams.get("era"));
  const search = searchParams.get("search") ?? "";
  const page = parsePage(searchParams.get("page"));

  const { data, isLoading, isError } = useCharacters(era, search, page);

  const updateUrl = (changes: Record<string, string | null>, replace = false) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    const query = params.toString();
    const url = query ? `${pathname}?${query}` : pathname;
    if (url !== `${window.location.pathname}${window.location.search}`) {
      window.history[replace ? "replaceState" : "pushState"](null, "", url);
    }
  };

  const handleEraChange = (e: EventEra) => {
    updateUrl({ era: e === "all" ? null : e, page: null });
  };
  const handleSearch = (s: string) => {
    updateUrl({ search: s || null, page: null }, true);
  };
  const handleClick = (id: string) => navigateWithAuth(`/chat/${id}`);

  return (
    <>
      {authRequiredDialog}
      <div className="space-y-6 lg:space-y-8">
      {/* Filters */}
      <div className="flex min-w-0 flex-col gap-3">
        <div className="-mx-3 overflow-x-auto px-3 pb-1 sm:mx-0 sm:overflow-visible sm:px-0 sm:pb-0">
          <div className="min-w-max sm:min-w-0">
            <EraFilter active={era} onChange={handleEraChange} />
          </div>
        </div>
        <SearchInput
          value={search}
          onChange={handleSearch}
          placeholder="Tìm nhân vật, triều đại, sự kiện..."
        />
      </div>

      {/* Result count */}
      {!isLoading && data && (
        <p className="text-xs text-content-subtle">
          {data.totalElements} nhân vật
          {search && ` · kết quả cho "${search}"`}
        </p>
      )}

      {/* Error */}
      {isError && (
        <div className="py-10 text-center">
          <p className="text-sm font-medium text-content-heading">
            Không thể tải danh sách nhân vật
          </p>
          <p className="text-xs mt-1 text-content-muted">
            Vui lòng thử lại sau
          </p>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
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
          <p className="text-sm font-medium text-content-heading">
            Không tìm thấy nhân vật nào
          </p>
          <p className="text-xs mt-1 text-content-muted">
            Thử thay đổi bộ lọc hoặc từ khoá tìm kiếm
          </p>
        </div>
      )}

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <CustomPagination
          page={page}
          totalPages={data.totalPages}
          getPageHref={(nextPage) => {
            const params = new URLSearchParams(searchParams.toString());
            if (nextPage === 1) params.delete("page");
            else params.set("page", String(nextPage));
            return params.size ? `${pathname}?${params}` : pathname;
          }}
          onChange={(nextPage) => updateUrl({ page: nextPage === 1 ? null : String(nextPage) })}
        />
      )}
      </div>
    </>
  );
}
