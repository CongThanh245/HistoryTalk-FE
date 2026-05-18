// services/character.server.service.ts
import { axiosServer } from "@/configs/axios.server";
import {
  type GetCharactersParams,
  type GetCharactersResponse,
} from "@/services/character.service";

function mapCharacterServer(raw: any) {
  return {
    id: raw.characterId ?? raw.id ?? `char-${Math.random().toString(36).slice(2)}`,
    name: raw.name,
    title: raw.title,
    background: raw.background,
    description: raw.background,
    imageUrl: raw.image ?? raw.imageUrl ?? null,
    avatarUrl: raw.image ?? raw.imageUrl ?? null,
    personality: raw.personality,
    lifespan: raw.lifespan,
    side: raw.side ?? null,
    contextId: raw.contextId ?? raw.context?.contextId ?? null,
    role: raw.role ?? null,
    era: raw.era ?? null,
    isDraft: raw.isDraft ?? false,
    deletedAt: raw.deletedAt ?? null,
    events: (raw.events ?? []).map((ev: any) => ({
      id: ev.id,
      title: ev.name ?? ev.title ?? "",
      year: ev.year,
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

