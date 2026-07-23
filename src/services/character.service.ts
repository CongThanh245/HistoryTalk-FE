import { axiosClient } from "@/configs/axios.client";
import { ERA_CONFIG } from "@/constants/eras";

type RawContextRef = {
  contextId?: string | Record<string, unknown>;
  id?: string;
  name?: string;
  title?: string;
};

// Handles both string ID and populated object (e.g. Mongoose populate returns full doc)
function resolveRefId(val: unknown): string | undefined {
  if (typeof val === "string") return val || undefined;
  if (val && typeof val === "object") {
    const o = val as Record<string, unknown>;
    const id = o.id ?? o._id ?? o.contextId;
    return typeof id === "string" ? id : undefined;
  }
  return undefined;
}

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
  videoUrl?: string | null;
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
  status?: string | null;
  createdBy?: string | { uid?: string; userName?: string } | null;
  createdDate?: string | null;
  updatedDate?: string | null;
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
  contexts?: { contextId: string; name: string }[];
  era?: string;
  role?: string;
  avatarUrl?: string | null;
  modelUrl?: string | null;
  videoUrl?: string | null;
  isActive?: boolean;
  isPublished?: boolean;
  status?: string | null;
  createdBy?: string | { uid?: string; userName?: string } | null;
  createdDate?: string | null;
  updatedDate?: string | null;
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
  isActive?: boolean;
  isPublished?: boolean;
}

export type UpdateCharacterRequest = Partial<CreateCharacterRequest>;

export function mapCharacter(raw: RawCharacter): Character {
  const contextId =
    resolveRefId(raw.context?.contextId) ??
    raw.context?.id ??
    resolveRefId(raw.contextId) ??
    resolveRefId(raw.contextIds?.[0]?.contextId) ??
    resolveRefId(raw.contexts?.[0]?.contextId);
  return {
    backendId: raw._id,
    id: raw.characterId ?? raw.id ?? `char-${Math.random().toString(36).slice(2)}`,
    name: raw.name ?? "",
    title: raw.title ?? "",
    background: raw.background,
    description: raw.background, // map background → description cho UI
    // Backend always resolves these to a directly renderable URL (legacy
    // pasted http(s) link, or a freshly signed URL for private-storage
    // uploads) or null — no client-side URL validation needed here.
    imageUrl: raw.image ?? raw.imageUrl ?? null,
    avatarUrl: raw.image ?? raw.imageUrl ?? null,
    modelUrl: raw.modelUrl ?? null,
    videoUrl: raw.videoUrl ?? null,
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
    contexts: raw.contexts?.map(c => ({ contextId: c.contextId ?? c.id ?? "", name: c.name ?? c.title ?? "" })) ?? [],
    role: raw.role,
    era: mapEraLabel(raw.era),
    isActive: raw.isActive ?? true,
    isPublished: raw.isPublished ?? false,
    status: raw.status ?? null,
    createdBy: raw.createdBy ?? null,
    createdDate: raw.createdDate ?? null,
    updatedDate: raw.updatedDate ?? null,
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
        contextId: resolveRefId(raw.context?.contextId) ?? resolveRefId(raw.contextId) ?? contextId,
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

  unmapContext: async (characterId: string, contextId: string): Promise<void> => {
    await axiosClient.delete(`/characters/${characterId}/contexts/${contextId}`);
  },
};

export function mapEraLabel(backendEra?: string): string {
  if (!backendEra) return "";
  const key = backendEra.toLowerCase();
  return (
    (ERA_CONFIG as Record<string, { label: string }>)[key]?.label ?? backendEra
  );
}
