import { axiosClient } from "@/configs/axios.client";
import { isValidUrl } from "@/lib/utils/url";
// import { axiosServer } from "@/configs/axios.server";

// ── Types map với backend ────────────────────────────────

// UI dùng lowercase + "all"
export type EventEra =
  | "all"
  | "ancient"
  | "medieval"
  | "modern"
  | "contemporary";
// Backend dùng uppercase, không có "all"
export type EventEraBackend =
  | "ANCIENT"
  | "MEDIEVAL"
  | "MODERN"
  | "CONTEMPORARY";

// Map với backend HistoricalContext API contract
export interface HistoricalEvent {
  id: string;              // contextId từ backend
  year: number;
  yearLabel?: string;
  title: string;           // name từ backend
  summary: string;         // description từ backend
  location?: string;
  imageUrl?: string | null;
  videoUrl?: string | null;
  era?: EventEraBackend;
  period?: string;
  isActive?: boolean;
  deletedAt?: string | null;
}
export interface CreateEventRequest {
  name: string;
  description: string;
  era: EventEraBackend;
  year: number;
  period?: string;
  location?: string;
  imageUrl?: string | null;
  videoUrl?: string | null;
  isActive?: boolean;
}
export interface UpdateEventRequest extends Partial<CreateEventRequest> {}

export interface GetEventsParams {
  search?: string;
  page?: number;
  limit?: number;
  era?: EventEraBackend; // ANCIENT | MEDIEVAL | MODERN | CONTEMPORARY
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

// ── Map backend → HistoricalEvent ───────────────────────

export function mapContext(raw: any): HistoricalEvent {
  return {
    id: raw.contextId ?? raw.id,
    title: raw.name,
    summary: raw.description,
    year: raw.year ?? 0,
    yearLabel: raw.yearLabel,
    location: raw.location,
    imageUrl: isValidUrl(raw.imageUrl) ? raw.imageUrl : null,
    videoUrl: isValidUrl(raw.videoUrl) ? raw.videoUrl : null,
    era: raw.era as EventEraBackend,
    period: raw.period,
    isActive: raw.isActive ?? true,
    deletedAt: raw.deletedAt ?? null,
  };
}

// ── Service ──────────────────────────────────────────────

export const eventService = {
  // Server-side (prefetch trong Server Component)
  // Client-side (dùng trong hooks)
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
    const res = await axiosClient.post("/historical-contexts", data);
    return mapContext(res.data.data);
  },

  update: async (
    id: string,
    data: UpdateEventRequest,
  ): Promise<HistoricalEvent> => {
    const res = await axiosClient.put(`/historical-contexts/${id}`, data);
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

// ── Era helpers ──────────────────────────────────────────

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
