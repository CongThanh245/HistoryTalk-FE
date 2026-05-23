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

export type EventCategory =
  | "WAR"
  | "POLITICS"
  | "CULTURE"
  | "SCIENCE"
  | "RELIGION"
  | "OTHER";

export type EventCategoryLower =
  | "war"
  | "politics"
  | "culture"
  | "science"
  | "religion"
  | "other";

export interface HistoricalEvent {
  id: string;
  year: number;
  yearLabel?: string;
  title: string;
  summary: string;
  category: EventCategoryLower;
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
  deletedAt?: string | null;
}

export interface CreateEventRequest {
  name: string;
  description: string;
  era: EventEraBackend;
  category?: EventCategory;
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

export interface UpdateEventRequest extends Partial<CreateEventRequest> {}

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

export function mapContext(raw: any): HistoricalEvent {
  return {
    id: raw.contextId,
    title: raw.name,
    summary: raw.description,
    year: raw.year ?? 0,
    yearLabel: raw.yearLabel,
    category: (raw.category?.toLowerCase() as EventCategoryLower | undefined) ?? "other",
    location: raw.location,
    imageUrl: isValidUrl(raw.imageUrl) ? raw.imageUrl : null,
    videoUrl: isValidUrl(raw.videoUrl) ? raw.videoUrl : null,
    era: raw.era as EventEraBackend,
    period: raw.period,
    startYear: raw.startYear,
    endYear: raw.endYear,
    beforeTCN: raw.beforeTCN,
    isDraft: raw.isDraft,
    isActive: raw.isActive ?? true,
    isPublished: raw.isPublished ?? false,
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
  all: { label: "Tat ca", range: [-Infinity, Infinity] },
  ancient: { label: "Co dai", range: [-Infinity, 937] },
  medieval: { label: "Trung dai", range: [938, 1857] },
  modern: { label: "Can dai", range: [1858, 1944] },
  contemporary: { label: "Hien dai", range: [1945, Infinity] },
};

export function getEraFromYear(year: number): Exclude<EventEra, "all"> {
  if (year <= 937) return "ancient";
  if (year <= 1857) return "medieval";
  if (year <= 1944) return "modern";
  return "contemporary";
}
