"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { EraFilter }    from "@/components/commons/era-filter";
import { SearchInput }  from "@/components/commons/search-input";
import {
  characterQueryKeys,
  MOCK_CHARACTERS,
  MOCK_PAGE_LIMIT,
  type GetCharactersResponse,
} from "@/services/character.service";
import type { EventEra } from "@/services/event.service";
import { ERA_CONFIG } from "@/services/event.service";
import { CharacterPageCard, CharacterPageCardSkeleton } from "../commons/character-card";
import { CustomPagination } from "../commons/pagination";

// ── Mock query ────────────────────────────────────────────
// TODO: xoá khi có API, dùng characterService.getCharacters(params)

function useMockCharacters(era: EventEra, search: string, page: number): {
  data: GetCharactersResponse | undefined;
  isLoading: boolean;
} {
  return useQuery({
    queryKey: characterQueryKeys.list({ era, search, page }),
    queryFn: (): GetCharactersResponse => {
      let result = MOCK_CHARACTERS;

      if (era !== "all") {
        const [lo, hi] = ERA_CONFIG[era].range;
        result = result.filter((c) => {
          // dùng era field trực tiếp
          const [cLo, cHi] = ERA_CONFIG[c.era].range;
          return cLo >= lo && cHi <= hi;
        });
      }

      if (search.trim()) {
        const q = search.toLowerCase();
        result = result.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.title.toLowerCase().includes(q) ||
            c.description.toLowerCase().includes(q) ||
            c.events.some((e) => e.title.toLowerCase().includes(q))
        );
      }

      const total      = result.length;
      const totalPages = Math.max(1, Math.ceil(total / MOCK_PAGE_LIMIT));
      const safePage   = Math.min(page, totalPages);
      const data       = result.slice((safePage - 1) * MOCK_PAGE_LIMIT, safePage * MOCK_PAGE_LIMIT);

      return { data, total, page: safePage, totalPages };
    },
    placeholderData: (prev) => prev,
  });
}

// ── Era counts ────────────────────────────────────────────

function useEraCounts() {
  const counts: Partial<Record<EventEra, number>> = { all: MOCK_CHARACTERS.length };
  MOCK_CHARACTERS.forEach((c) => {
    counts[c.era] = (counts[c.era] ?? 0) + 1;
  });
  return counts;
}

// ── Component ─────────────────────────────────────────────

export function CharactersClient() {
  const router   = useRouter();
  const [era,    setEra]    = useState<EventEra>("all");
  const [search, setSearch] = useState("");
  const [page,   setPage]   = useState(1);

  const { data, isLoading } = useMockCharacters(era, search, page);
  const eraCounts           = useEraCounts();

  const handleEraChange = (e: EventEra) => { setEra(e); setPage(1); };
  const handleSearch    = (s: string)   => { setSearch(s); setPage(1); };
  const handleClick     = (id: string)  => router.push(`/chat/${id}`);

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="flex flex-col gap-3">
        <EraFilter active={era} onChange={handleEraChange} counts={eraCounts} />
        <SearchInput
          value={search}
          onChange={handleSearch}
          placeholder="Tìm nhân vật, triều đại, sự kiện..."
        />
      </div>

      {/* Result count */}
      {!isLoading && data && (
        <p className="text-xs" style={{ color: "var(--content-subtle)" }}>
          {data.total} nhân vật
          {search && ` · kết quả cho "${search}"`}
        </p>
      )}

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {isLoading
          ? Array.from({ length: MOCK_PAGE_LIMIT }).map((_, i) => (
              <CharacterPageCardSkeleton key={i} />
            ))
          : data?.data.map((char) => (
              <CharacterPageCard key={char.id} character={char} onClick={handleClick} />
            ))}
      </div>

      {/* Empty */}
      {!isLoading && data?.data.length === 0 && (
        <div className="py-20 text-center">
          <p className="text-sm font-medium" style={{ color: "var(--content-heading)" }}>
            Không tìm thấy nhân vật nào
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--content-muted)" }}>
            Thử thay đổi bộ lọc hoặc từ khoá tìm kiếm
          </p>
        </div>
      )}

      {/* Pagination — tái sử dụng từ events */}
      {data && data.totalPages > 1 && (
        <CustomPagination page={page} totalPages={data.totalPages} onChange={setPage} />
      )}
    </div>
  );
}