"use client";

import * as React from "react";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronRight, LayoutGrid, List } from "lucide-react";
import { EraFilter } from "@/components/commons/era-filter";
import { SearchInput } from "@/components/commons/search-input";
import { useQuery } from "@tanstack/react-query";
import {
  characterService,
  type Character,
  type GetCharactersParams,
} from "@/services/character.service";
import { queryKeys } from "@/shared/query-key"; // ← dùng queryKeys chung
import type { EventEra, EventEraBackend } from "@/services/event.service";
import { CustomPagination } from "../commons/pagination";
import { useAuthRequiredNavigation } from "@/features/auth/use-auth-required-navigation";
import { parseEra, parsePage } from "@/lib/catalog-url-state";
import { isValidUrl } from "@/lib/utils/url";
import { cn } from "@/lib/utils/cn";

const PAGE_LIMIT = 12;

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

// ── View mode (a per-viewer convenience, so it lives in localStorage) ──

type ViewMode = "grid" | "list";
const VIEW_KEY = "ht-characters-view";

const viewListeners = new Set<() => void>();
const subscribeView = (cb: () => void) => {
  viewListeners.add(cb);
  return () => {
    viewListeners.delete(cb);
  };
};
const readView = (): ViewMode => {
  try {
    return localStorage.getItem(VIEW_KEY) === "list" ? "list" : "grid";
  } catch {
    return "grid";
  }
};

/** Server render and first paint use the grid; the saved choice applies right after hydration. */
function useViewMode() {
  const view = React.useSyncExternalStore(subscribeView, readView, () => "grid" as ViewMode);
  const change = (next: ViewMode) => {
    try {
      localStorage.setItem(VIEW_KEY, next);
    } catch {}
    viewListeners.forEach((cb) => cb());
  };
  return [view, change] as const;
}

// ── Cards ─────────────────────────────────────────────────

/** "1809 – 1865", "? – 43 TCN"; null when neither year is known. */
function lifeYears(c: Character) {
  if (c.bornYear == null && c.deathYear == null) return null;
  const fmt = (y: number | null | undefined, bc: boolean | undefined) => (y == null ? "?" : bc ? `${y} TCN` : String(y));
  return `${fmt(c.bornYear, c.isBornBc)} – ${fmt(c.deathYear, c.isDeathBc)}`;
}

const portraitOf = (c: Character) => (isValidUrl(c.imageUrl) ? c.imageUrl! : isValidUrl(c.avatarUrl) ? c.avatarUrl! : "/card.jpg");

/**
 * Portrait first, then name, life span and title: the face does the recognising.
 * Hover / keyboard focus darkens the portrait and shows the description with the chat action, so readers can decide before opening.
 */
function CharacterTile({ character, onClick, priority }: { character: Character; onClick: (id: string) => void; priority?: boolean }) {
  const years = lifeYears(character);
  return (
    <button type="button" onClick={() => onClick(character.id)} className="group flex min-w-0 flex-col text-left focus-visible:outline-none">
      <span className="relative block aspect-[3/4] w-full overflow-hidden rounded-xl bg-[var(--bg-deep)] ring-1 ring-inset ring-[var(--border-card)] group-focus-visible:ring-2 group-focus-visible:ring-[var(--accent-gold)]">
        <Image
          src={portraitOf(character)}
          alt=""
          fill
          priority={priority}
          sizes="(min-width: 1280px) 22vw, (min-width: 1024px) 30vw, (min-width: 640px) 46vw, 92vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none"
        />
        <span className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/90 via-black/70 to-black/10 p-4 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none">
          {character.description && (
            <span className="line-clamp-6 text-sm leading-relaxed text-white/90">{character.description}</span>
          )}
          <span className="mt-3 inline-flex items-center gap-1 self-start rounded-full bg-[var(--accent-gold)] px-3.5 py-1.5 text-[13px] font-semibold text-white">
            Trò chuyện <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
        </span>
      </span>
      <span className="mt-3 line-clamp-1 text-base font-semibold text-content-heading transition-colors group-hover:text-[var(--accent-gold)]">
        {character.name}
      </span>
      <span className="mt-0.5 line-clamp-1 text-sm text-[var(--text-secondary)]">
        {[character.role || character.title, years ?? character.era].filter(Boolean).join(" · ")}
      </span>
    </button>
  );
}

function CharacterRow({ character, onClick }: { character: Character; onClick: (id: string) => void }) {
  const years = lifeYears(character);
  return (
    <li>
      <button
        type="button"
        onClick={() => onClick(character.id)}
        className="group flex w-full items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-[var(--bg-elevated)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--accent-gold)]"
      >
        <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-[var(--bg-deep)]">
          <Image src={portraitOf(character)} alt="" fill sizes="56px" className="object-cover object-top" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-[15px] font-semibold text-content-heading group-hover:text-[var(--accent-gold)]">{character.name}</span>
            {years && <span className="text-[13px] tabular-nums text-content-muted">{years}</span>}
          </span>
          <span className="block truncate text-[13px] text-[var(--text-secondary)]">{character.role || character.title}</span>
          {character.description && <span className="hidden truncate text-[13px] text-content-muted md:block">{character.description}</span>}
        </span>
        {character.era && (
          <span className="hidden shrink-0 rounded-full border border-[var(--border-default)] px-2.5 py-0.5 text-xs text-[var(--text-secondary)] sm:inline">
            {character.era}
          </span>
        )}
        <ChevronRight className="h-4 w-4 shrink-0 text-content-subtle transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
      </button>
    </li>
  );
}

function TileSkeleton() {
  return (
    <div className="animate-pulse motion-reduce:animate-none" aria-hidden="true">
      <div className="aspect-[3/4] w-full rounded-xl bg-[var(--bg-deep)]" />
      <div className="mt-3 h-4 w-3/4 rounded-sm bg-[var(--bg-deep)]" />
      <div className="mt-2 h-3 w-1/2 rounded-sm bg-[var(--bg-deep)]" />
    </div>
  );
}

// Same columns as the original catalog, so the 3:4 portraits (art with calligraphy) show whole, uncropped.
const GRID = "grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

const VIEW_OPTIONS = [
  { mode: "grid", icon: LayoutGrid, label: "Dạng lưới" },
  { mode: "list", icon: List, label: "Dạng danh sách" },
] as const;

// ── Component ─────────────────────────────────────────────

export function CharactersClient() {
  const { authRequiredDialog, navigateWithAuth } = useAuthRequiredNavigation();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const era = parseEra(searchParams.get("era"));
  const search = searchParams.get("search") ?? "";
  const page = parsePage(searchParams.get("page"));

  const { data, isLoading, isError } = useCharacters(era, search, page);
  const [view, setView] = useViewMode();

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
      <div className="space-y-6">
        <SearchInput value={search} onChange={handleSearch} placeholder="Tìm nhân vật, triều đại, sự kiện..." size="lg" />

        {/* Era tabs (the active one shows its count) + grid/list toggle */}
        <div className="flex min-w-0 items-end gap-4 border-b border-[var(--border-default)]">
          <div className="-mb-px min-w-0 flex-1 overflow-x-auto">
            <EraFilter active={era} onChange={handleEraChange} counts={data && !isLoading ? { [era]: data.totalElements } : undefined} />
          </div>
          <div role="group" aria-label="Kiểu hiển thị" className="mb-1.5 hidden shrink-0 items-center rounded-lg border border-[var(--border-default)] p-0.5 sm:flex">
            {VIEW_OPTIONS.map(({ mode, icon: Icon, label }) => (
              <button
                key={mode}
                type="button"
                aria-pressed={view === mode}
                aria-label={label}
                title={label}
                onClick={() => setView(mode)}
                className={cn(
                  "grid h-8 w-8 place-items-center rounded-md transition-colors",
                  view === mode ? "bg-[var(--bg-elevated)] text-content-heading shadow-[0_1px_2px_rgba(0,0,0,0.08)]" : "text-content-subtle hover:text-content-heading",
                )}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>

        {search && !isLoading && data && (
          <p className="text-sm text-content-muted">
            {data.totalElements} kết quả cho “{search}”
          </p>
        )}

        {/* Error */}
        {isError && (
          <div className="rounded-xl border border-border-card py-10 text-center">
            <p className="text-base font-semibold text-content-heading">Không thể tải danh sách nhân vật</p>
            <p className="text-sm mt-1 text-content-muted">Vui lòng thử lại sau</p>
          </div>
        )}

        {isLoading ? (
          <div className={GRID}>
            {Array.from({ length: PAGE_LIMIT }).map((_, i) => (
              <TileSkeleton key={i} />
            ))}
          </div>
        ) : data?.content.length ? (
          view === "list" ? (
            <ul className="divide-y divide-[var(--border-default)] overflow-hidden rounded-xl border border-border-card bg-[var(--bg-surface)]">
              {data.content.map((char) => (
                <CharacterRow key={char.id} character={char} onClick={handleClick} />
              ))}
            </ul>
          ) : (
            <div className={GRID}>
              {data.content.map((char, i) => (
                <CharacterTile key={char.id} character={char} onClick={handleClick} priority={i < 4} />
              ))}
            </div>
          )
        ) : null}

        {/* Empty */}
        {!isLoading && !isError && data?.content.length === 0 && (
          <div className="rounded-xl border border-dashed border-[var(--border-strong)] py-16 text-center">
            <p className="text-base font-semibold text-content-heading">Không tìm thấy nhân vật nào</p>
            <p className="text-sm mt-1 text-content-muted">Thử thay đổi bộ lọc hoặc từ khoá tìm kiếm</p>
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
