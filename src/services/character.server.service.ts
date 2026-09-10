// services/character.server.service.ts
import { axiosServer } from "@/configs/axios.server";
import {
  mapEraLabel,
  type GetCharactersParams,
  type GetCharactersResponse,
} from "@/services/character.service";

type RawServerEvent = {
  id?: string;
  name?: string;
  title?: string;
  year?: number;
};

type RawServerContextRef = {
  contextId?: string;
  id?: string;
  name?: string;
  title?: string;
};

type RawServerCharacter = {
  characterId?: string;
  id?: string;
  name?: string;
  title?: string;
  background?: string;
  image?: string | null;
  imageUrl?: string | null;
  personality?: string;
  bornYear?: number | null;
  bornMonth?: number | null;
  bornDay?: number | null;
  isBornBc?: boolean;
  deathYear?: number | null;
  deathMonth?: number | null;
  deathDay?: number | null;
  isDeathBc?: boolean;
  side?: string | null;
  contextId?: string | null;
  context?: { contextId?: string | null };
  contexts?: RawServerContextRef[];
  role?: string | null;
  era?: string | null;
  isDraft?: boolean;
  deletedAt?: string | null;
  events?: RawServerEvent[];
};

function mapCharacterServer(raw: RawServerCharacter) {
  return {
    id: raw.characterId ?? raw.id ?? `char-${Math.random().toString(36).slice(2)}`,
    name: raw.name ?? "",
    title: raw.title ?? "",
    background: raw.background,
    description: raw.background,
    imageUrl: raw.image ?? raw.imageUrl ?? null,
    avatarUrl: raw.image ?? raw.imageUrl ?? null,
    personality: raw.personality,
    bornYear: raw.bornYear ?? null,
    bornMonth: raw.bornMonth ?? null,
    bornDay: raw.bornDay ?? null,
    isBornBc: raw.isBornBc ?? false,
    deathYear: raw.deathYear ?? null,
    deathMonth: raw.deathMonth ?? null,
    deathDay: raw.deathDay ?? null,
    isDeathBc: raw.isDeathBc ?? false,
    side: raw.side ?? null,
    contextId: raw.contextId ?? raw.context?.contextId ?? null,
    contexts: (raw.contexts ?? []).map((c) => ({
      contextId: c.contextId ?? c.id ?? "",
      name: c.name ?? c.title ?? "",
    })),
    role: raw.role ?? null,
    era: mapEraLabel(raw.era ?? undefined),
    isDraft: raw.isDraft ?? false,
    deletedAt: raw.deletedAt ?? null,
    events: (raw.events ?? []).map((ev) => ({
      id: ev.id ?? "",
      title: ev.name ?? ev.title ?? "",
      year: ev.year ?? 0,
    })),
  };
}

export const characterServerService = {
  getAll: async (params?: GetCharactersParams): Promise<GetCharactersResponse> => {
    const res = await axiosServer.get("/characters", { params });
    const raw = res.data.data;
    return {
      ...raw,
      content: raw.content.map(mapCharacterServer),
    };
  },
};

