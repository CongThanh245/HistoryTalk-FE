import { axiosClient } from "@/configs/axios.client";
import { ERA_CONFIG } from "./event.service";

export interface Character {
  id: string;
  name: string;
  title: string;
  background?: string;
  description?: string;
  imageUrl?: string;
  personality?: string;
  lifespan?: string;
  side?: string;
  contextId?: string;
  era?: string;
  role?: string;
  avatarUrl?: string;
  isDraft?: boolean;
  events?: { id: string; title: string; year: number }[];
}

export interface GetCharactersParams {
  search?: string;
  page?: number;
  limit?: number;
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
  image?: string;
  personality?: string;
  lifespan?: string;
  side?: string;
  contextId?: string;
  isDraft?: boolean;
}

export interface UpdateCharacterRequest extends Partial<CreateCharacterRequest> {}

function mapCharacter(raw: any): Character {
  return {
    id: raw.characterId ?? raw.id,
    name: raw.name,
    title: raw.title,
    background: raw.background,
    description: raw.background, // map background → description cho UI
    imageUrl: raw.image ?? raw.imageUrl,
    avatarUrl: raw.image ?? raw.imageUrl,
    personality: raw.personality,
    lifespan: raw.lifespan,
    side: raw.side,
    contextId: raw.contextId ?? raw.context?.contextId,
    role: raw.role,
    era: mapEraLabel(raw.era),
    isDraft: raw.isDraft ?? false,
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
};

export function mapEraLabel(backendEra?: string): string {
  if (!backendEra) return "";
  const key = backendEra.toLowerCase();
  return (
    (ERA_CONFIG as Record<string, { label: string }>)[key]?.label ?? backendEra
  );
}
