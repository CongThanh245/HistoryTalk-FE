import { axiosClient } from "@/configs/axios.client";
import { isValidUrl } from "@/lib/utils/url";

export type EventEra =
  | "all"
  | "ancient"
  | "medieval"
  | "modern"
  | "contemporary";

export type EventEraBackend =
  | "ANCIENT"
  | "MEDIEVAL"
  | "MODERN"
  | "CONTEMPORARY";

export interface HistoricalEvent {
  id: string;
  year: number;
  yearLabel?: string;
  title: string;
  summary: string;
  location?: string;
  imageUrl?: string | null;
  videoUrl?: string | null;
  era?: EventEraBackend;
  period?: string;
  startYear?: number;
  endYear?: number;
  beforeTCN?: boolean;
  isDraft?: boolean;
  isActive?: boolean;
  isPublished?: boolean;
  characterIds?: {
    _id?: string;
    id?: string;
    characterId?: string;
  }[];
  deletedAt?: string | null;
}

export interface CreateEventRequest {
  name: string;
  description: string;
  era: EventEraBackend;
  year: number;
  startYear?: number;
  endYear?: number;
  beforeTCN?: boolean;
  location?: string;
  imageUrl?: string | null;
  videoUrl?: string | null;
  isActive?: boolean;
  isPublished?: boolean;
}

export type UpdateEventRequest = Partial<CreateEventRequest>;

export interface GetEventsParams {
  search?: string;
  page?: number;
  limit?: number;
  era?: EventEraBackend;
}

export interface GetEventsResponse {
  content: HistoricalEvent[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

type RawHistoricalContext = {
  _id?: string;
  id?: string;
  contextId?: string;
  name?: string;
  title?: string;
  description?: string;
  summary?: string;
  year?: number;
  yearLabel?: string;
  location?: string;
  imageUrl?: string | null;
  image?: string | null;
  thumbnailUrl?: string | null;
  thumbnail?: string | null;
  coverImageUrl?: string | null;
  coverImage?: string | null;
  bannerUrl?: string | null;
  banner?: string | null;
  videoUrl?: string | null;
  era?: string;
  period?: string;
  startYear?: number;
  endYear?: number;
  beforeTCN?: boolean;
  isDraft?: boolean;
  isActive?: boolean;
  isPublished?: boolean;
  characterIds?: HistoricalEvent["characterIds"];
  deletedAt?: string | null;
};

export function mapContext(raw: RawHistoricalContext): HistoricalEvent {
  const imageUrl =
    raw.imageUrl ??
    raw.image ??
    raw.thumbnailUrl ??
    raw.thumbnail ??
    raw.coverImageUrl ??
    raw.coverImage ??
    raw.bannerUrl ??
    raw.banner ??
    null;

  return {
    id: raw.contextId ?? raw.id ?? raw._id ?? "",
    title: raw.name ?? raw.title ?? "",
    summary: raw.description ?? raw.summary ?? "",
    year: raw.year ?? 0,
    yearLabel: raw.yearLabel,
    location: raw.location,
    imageUrl: isValidUrl(imageUrl) ? imageUrl : null,
    videoUrl: isValidUrl(raw.videoUrl) ? raw.videoUrl : null,
    era: raw.era as EventEraBackend,
    period: raw.period,
    startYear: raw.startYear,
    endYear: raw.endYear,
    beforeTCN: raw.beforeTCN,
    isDraft: raw.isDraft,
    isActive: raw.isActive ?? true,
    isPublished: raw.isPublished ?? false,
    characterIds: raw.characterIds ?? [],
    deletedAt: raw.deletedAt ?? null,
  };
}

export const eventService = {
  getAllClient: async (
    params?: GetEventsParams,
  ): Promise<GetEventsResponse> => {
    const res = await axiosClient.get("/historical-contexts", { params });
    const raw = res.data.data;

    const content = raw.content
      .map(mapContext)
      .sort((a: HistoricalEvent, b: HistoricalEvent) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.title.localeCompare(b.title, "vi");
      });

    return { ...raw, content };
  },

  create: async (data: CreateEventRequest): Promise<HistoricalEvent> => {
    const payload = toContractEventPayload(data);
    const res = await axiosClient.post("/historical-contexts", payload);
    return mapContext(res.data.data);
  },

  update: async (
    id: string,
    data: UpdateEventRequest,
  ): Promise<HistoricalEvent> => {
    const payload = toContractEventPayload(data);
    const res = await axiosClient.put(`/historical-contexts/${id}`, payload);
    return mapContext(res.data.data);
  },

  delete: async (id: string): Promise<void> => {
    await axiosClient.delete(`/historical-contexts/${id}`);
  },

  softDelete: async (id: string): Promise<void> => {
    await axiosClient.patch(`/historical-contexts/${id}/soft-delete`);
  },

  getById: async (id: string): Promise<HistoricalEvent> => {
    const res = await axiosClient.get(`/historical-contexts/${id}`);
    return mapContext(res.data.data);
  },
};

function toContractEventPayload(data: UpdateEventRequest) {
  return {
    ...(data.name !== undefined && { name: data.name }),
    ...(data.description !== undefined && { description: data.description }),
    ...(data.era !== undefined && { era: data.era }),
    ...(data.year !== undefined && { year: data.year }),
    ...(data.location !== undefined && { location: data.location }),
    ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
    ...(data.videoUrl !== undefined && { videoUrl: data.videoUrl }),
    ...(data.isActive !== undefined && { isActive: data.isActive }),
    ...(data.isPublished !== undefined && { isPublished: data.isPublished }),
  };
}

export const ERA_CONFIG: Record<
  EventEra,
  { label: string; range: [number, number] }
> = {
  all: { label: "Tất cả", range: [-Infinity, Infinity] },
  ancient: { label: "Cổ đại", range: [-Infinity, 937] },
  medieval: { label: "Trung đại", range: [938, 1857] },
  modern: { label: "Cận đại", range: [1858, 1944] },
  contemporary: { label: "Hiện đại", range: [1945, Infinity] },
};

export function getEraFromYear(year: number): Exclude<EventEra, "all"> {
  if (year <= 937) return "ancient";
  if (year <= 1857) return "medieval";
  if (year <= 1944) return "modern";
  return "contemporary";
}
