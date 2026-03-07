import { axiosClient } from "@/configs/axios.client";
// import { axiosServer } from "@/configs/axios.server";

// ── Types map với backend ────────────────────────────────

// UI dùng lowercase
export type EventCategoryLower =
  | "war"
  | "politics"
  | "culture"
  | "science"
  | "religion"
  | "other";
// Backend dùng uppercase
export type EventCategory =
  | "WAR"
  | "POLITICS"
  | "CULTURE"
  | "SCIENCE"
  | "RELIGION"
  | "OTHER";

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

// Map với backend response
export interface HistoricalEvent {
  id: string;
  year: number;
  yearLabel?: string;
  title: string;
  summary: string;
  category: EventCategoryLower;
  location?: string;
  imageUrl?: string;
  videoUrl?: string; // ← thêm
  era?: EventEraBackend;
  period?: string;
  startYear?: number;
  endYear?: number;
  beforeTCN?: boolean;
}
export interface CreateEventRequest {
  name: string;
  description: string;
  era: EventEraBackend;
  category: EventCategory;
  year: number;
  startYear?: number;
  endYear?: number;
  beforeTCN?: boolean;
  location?: string;
  imageUrl?: string;
  videoUrl?: string;
}
export interface UpdateEventRequest extends Partial<CreateEventRequest> {}

export interface GetEventsParams {
  search?: string;
  page?: number;
  limit?: number;
  era?: EventEraBackend; // ANCIENT | MEDIEVAL | MODERN | CONTEMPORARY
  category?: EventCategory; // WAR | POLITICS | CULTURE | SCIENCE | RELIGION | OTHER
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
    id: raw.contextId,
    title: raw.name,
    summary: raw.description,
    year: raw.year ?? raw.startYear ?? 0,
    yearLabel: raw.yearLabel,
    category: (raw.category?.toLowerCase() as EventCategoryLower) ?? "other", // ← EventCategoryLower
    location: raw.location,
    imageUrl: isValidUrl(raw.imageUrl) ? raw.imageUrl : undefined,
    videoUrl: isValidUrl(raw.videoUrl) ? raw.videoUrl : undefined, // ← thêm
    era: raw.era as EventEraBackend,
    period: raw.period,
    startYear: raw.startYear,
    endYear: raw.endYear,
    beforeTCN: raw.beforeTCN,
  };
}
function isValidUrl(url: any): boolean {
  if (!url || typeof url !== "string") return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
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
        if (a.startYear !== b.startYear)
          return (a.startYear ?? 0) - (b.startYear ?? 0);
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
