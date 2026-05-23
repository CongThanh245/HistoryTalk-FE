import { axiosClient } from "@/configs/axios.client";
import { isValidUrl } from "@/lib/utils/url";
import { ERA_CONFIG } from "./event.service";

export interface Character {
  id: string;
  characterId?: string;
  name: string;
  title: string;
  background?: string;
  imageUrl?: string | null;
  personality?: string;
  lifespan?: string;
  era?: string;
  isActive?: boolean;
  isDraft?: boolean;
  contextId?: string; // Linked historical context (from nested context.contextId)
  context?: { contextId: string }; // Nested context object from API
  deletedAt?: string | null;
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
  personality?: string;
  lifespan?: string;
  era?: string;
  isActive?: boolean;
}

export interface UpdateCharacterRequest extends Partial<CreateCharacterRequest> { }

function mapCharacter(raw: any): Character {
  const imageUrl = raw.image || raw.imageUrl || null;
  // Handle nested context object from API
  const contextId = raw.context?.contextId || raw.contextId;
  return {
    id: raw.characterId ?? raw.id,
    characterId: raw.characterId,
    name: raw.name,
    title: raw.title,
    background: raw.background,
    imageUrl: isValidUrl(raw.image ?? raw.imageUrl) ? (raw.image ?? raw.imageUrl) : null,
    personality: raw.personality,
    lifespan: raw.lifespan,
    era: mapEraLabel(raw.era),
    isActive: raw.isActive,
    isDraft: raw.isDraft ?? false,
    contextId,
    context: raw.context,
    deletedAt: raw.deletedAt ?? null,
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
    return res.data.data.map((raw: any): Character => {
      // Normalize raw để mapCharacter có thể xử lý đúng
      const normalized = {
        ...raw,
        characterId: raw.characterId ?? raw.id,
        image: raw.image ?? raw.imageUrl,
        contextId: raw.context?.contextId ?? raw.contextId,
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
