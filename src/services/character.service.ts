import { axiosClient } from "@/configs/axios.client";
import { isValidUrl } from "@/lib/utils/url";
import { ERA_CONFIG } from "./event.service";

type RawContextRef = {
  contextId?: string;
  id?: string;
};

type RawCharacterEvent = {
  id?: string;
  title?: string;
  year?: number;
};

type RawCharacter = {
  _id?: string;
  characterId?: string;
  id?: string;
  name?: string;
  title?: string;
  background?: string;
  image?: string | null;
  imageUrl?: string | null;
  modelUrl?: string | null;
  personality?: string;
  bornYear?: number | null;
  bornMonth?: number | null;
  bornDay?: number | null;
  isBornBc?: boolean;
  deathYear?: number | null;
  deathMonth?: number | null;
  deathDay?: number | null;
  isDeathBc?: boolean;
  context?: RawContextRef;
  contextId?: string;
  contextIds?: RawContextRef[];
  contexts?: RawContextRef[];
  role?: string;
  era?: string;
  isActive?: boolean;
  isPublished?: boolean;
  deletedAt?: string | null;
  events?: RawCharacterEvent[];
};

export interface Character {
  backendId?: string;
  id: string;
  name: string;
  title: string;
  background?: string;
  description?: string;
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
  side?: string;
  contextId?: string;
  era?: string;
  role?: string;
  avatarUrl?: string | null;
  modelUrl?: string | null;
  isActive?: boolean;
  isPublished?: boolean;
  deletedAt?: string | null;
  events?: { id: string; title: string; year: number }[];
}

export interface GetCharactersParams {
  search?: string;
  page?: number;
  limit?: number;
  era?: string;
}

export interface GetCharactersResponse {
  content: Character[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface CreateCharacterRequest {
  name: string;
  title: string;
  background?: string;
  image?: string | null;
  modelUrl?: string | null;
  personality?: string;
  bornYear?: number | null;
  bornMonth?: number | null;
  bornDay?: number | null;
  isBornBc?: boolean;
  deathYear?: number | null;
  deathMonth?: number | null;
  deathDay?: number | null;
  isDeathBc?: boolean;
  isActive?: boolean;
  isPublished?: boolean;
}

export type UpdateCharacterRequest = Partial<CreateCharacterRequest>;

function mapCharacter(raw: RawCharacter): Character {
  const contextId =
    raw.context?.contextId ??
    raw.context?.id ??
    raw.contextId ??
    raw.contextIds?.[0]?.contextId ??
    raw.contexts?.[0]?.contextId;
  return {
    backendId: raw._id,
    id: raw.characterId ?? raw.id ?? `char-${Math.random().toString(36).slice(2)}`,
    name: raw.name ?? "",
    title: raw.title ?? "",
    background: raw.background,
    description: raw.background, // map background → description cho UI
    imageUrl: isValidUrl(raw.image ?? raw.imageUrl) ? (raw.image ?? raw.imageUrl) : null,
    avatarUrl: isValidUrl(raw.image ?? raw.imageUrl) ? (raw.image ?? raw.imageUrl) : null,
    modelUrl: isValidUrl(raw.modelUrl) ? raw.modelUrl : null,
    personality: raw.personality,
    bornYear: raw.bornYear ?? null,
    bornMonth: raw.bornMonth ?? null,
    bornDay: raw.bornDay ?? null,
    isBornBc: raw.isBornBc ?? false,
    deathYear: raw.deathYear ?? null,
    deathMonth: raw.deathMonth ?? null,
    deathDay: raw.deathDay ?? null,
    isDeathBc: raw.isDeathBc ?? false,
    contextId,
    role: raw.role,
    era: mapEraLabel(raw.era),
    isActive: raw.isActive ?? true,
    isPublished: raw.isPublished ?? false,
    deletedAt: raw.deletedAt ?? null,
    events: raw.events?.map((event) => ({
      id: event.id ?? "",
      title: event.title ?? "",
      year: event.year ?? 0,
    })),
  };
}

export const characterService = {
  getAll: async (
    params?: GetCharactersParams,
  ): Promise<GetCharactersResponse> => {
    const res = await axiosClient.get("/characters", { params });
    const raw = res.data.data;
    return { ...raw, content: raw.content.map(mapCharacter) };
  },

  getByContext: async (contextId: string): Promise<Character[]> => {
    const res = await axiosClient.get(`/characters/context/${contextId}`);
    const rawData = res.data.data;
    const characters = Array.isArray(rawData) ? rawData : rawData?.characters ?? [];
    return characters.map((raw: RawCharacter): Character => {
      // Normalize raw để mapCharacter có thể xử lý đúng
      const normalized = {
        ...raw,
        characterId: raw.characterId ?? raw.id,
        image: raw.image ?? raw.imageUrl,
        contextId: raw.context?.contextId ?? raw.contextId ?? contextId,
      };
      return mapCharacter(normalized);
    });
  },

  create: async (data: CreateCharacterRequest): Promise<Character> => {
    const res = await axiosClient.post("/characters", data);
    return mapCharacter(res.data.data);
  },

  update: async (
    id: string,
    data: UpdateCharacterRequest,
  ): Promise<Character> => {
    const res = await axiosClient.put(`/characters/${id}`, data);
    return mapCharacter(res.data.data);
  },

  delete: async (id: string): Promise<void> => {
    await axiosClient.delete(`/characters/${id}`);
  },

  getById: async (id: string): Promise<Character> => {
    const res = await axiosClient.get(`/characters/${id}`);
    return mapCharacter(res.data.data);
  },

  softDelete: async (id: string): Promise<void> => {
    await axiosClient.patch(`/characters/${id}/soft-delete`);
  },

  mapContext: async (characterId: string, contextId: string): Promise<void> => {
    await axiosClient.post(`/characters/${characterId}/contexts/${contextId}`);
  },
};

export function mapEraLabel(backendEra?: string): string {
  if (!backendEra) return "";
  const key = backendEra.toLowerCase();
  return (
    (ERA_CONFIG as Record<string, { label: string }>)[key]?.label ?? backendEra
  );
}
