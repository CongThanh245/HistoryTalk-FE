import { axiosClient } from "@/configs/axios.client";
import type { EventEra, EventEraBackend } from "@/services/event.service";

// ── Types ─────────────────────────────────────────────────

export interface CharacterEvent {
  id: string;
  title: string;
  year: number;
  era: EventEra;
}

export interface Character {
  id: string;
  name: string;
  title: string;
  description: string;
  imageUrl: string;
  era: EventEra;
  lifespan: string;
  side?: string;
  events: CharacterEvent[];
}

export interface GetCharactersParams {
  page?: number;
  limit?: number;
  era?: EventEraBackend; // ANCIENT | MEDIEVAL | MODERN | CONTEMPORARY
  search?: string;
}

export interface GetCharactersResponse {
  data: Character[];
  total: number;
  page: number;
  totalPages: number;
}

// ── Era mapping ───────────────────────────────────────────

const ERA_MAP: Record<EventEraBackend, EventEra> = {
  ANCIENT: "ancient",
  MEDIEVAL: "medieval",
  MODERN: "modern",
  CONTEMPORARY: "contemporary",
};

function mapEra(raw: string | undefined): EventEra {
  if (!raw) return "ancient";
  return ERA_MAP[raw as EventEraBackend] ?? "ancient";
}

// ── Image fallback ────────────────────────────────────────

function resolveImage(url: string | undefined | null): string {
  if (!url || typeof url !== "string") return "/card.jpg";
  try {
    new URL(url);
    return url;
  } catch {
    return "/card.jpg";
  }
}

// ── Map backend → Character ───────────────────────────────

function mapCharacter(raw: any): Character {
  return {
    id: raw.characterId ?? "thiếu field từ backend",
    name: raw.name ?? "thiếu field từ backend",
    title: raw.title ?? "thiếu field từ backend",
    description: raw.background ?? "thiếu field từ backend", // background → description
    imageUrl: resolveImage(raw.image),
    era: mapEra(raw.era),
    lifespan: raw.lifespan ?? "thiếu field từ backend",
    side: raw.side ?? undefined,
    events: Array.isArray(raw.events)
      ? raw.events.map((ev: any) => ({
          id: ev.id ?? "thiếu field từ backend",
          title: ev.name ?? "thiếu field từ backend", // name → title
          year: ev.year ?? 0,
          era: mapEra(ev.era),
        }))
      : [],
  };
}

// ── Service ──────────────────────────────────────────────

export const characterService = {
  getCharacters: async (
    params: GetCharactersParams,
  ): Promise<GetCharactersResponse> => {
    const res = await axiosClient.get("/characters", { params });
    const raw = res.data.data;

    return {
      data: (raw.content ?? []).map(mapCharacter),
      total: raw.totalElements ?? 0,
      page: raw.currentPage ?? 1,
      totalPages: raw.totalPages ?? 1,
    };
  },

  getCharacterById: async (id: string): Promise<Character> => {
    const res = await axiosClient.get(`/characters/${id}`);
    return mapCharacter(res.data.data);
  },
  getByContext: async (contextId: string): Promise<Character[]> => {
    const res = await axiosClient.get(`/characters/context/${contextId}`);
    return (res.data.data ?? []).map(mapCharacter);
  },
};

// ── Query keys ────────────────────────────────────────────

export const characterQueryKeys = {
  list: (params: GetCharactersParams) =>
    ["characters", "list", params] as const,
  detail: (id: string) => ["characters", "detail", id] as const,
};
