import { axiosClient } from "@/configs/axios.client";
// import { axiosServer } from "@/configs/axios.server";

// ── Types map với backend ────────────────────────────────

export type EventCategory =
  | "war"
  | "politics"
  | "culture"
  | "science"
  | "religion"
  | "other";

export type EventEra =
  | "all"
  | "ancient"
  | "medieval"
  | "modern"
  | "contemporary";

// Map với backend response
export interface HistoricalEvent {
  id: string; // ← contextId từ backend
  year: number;
  yearLabel?: string;
  title: string; // ← name từ backend
  summary: string; // ← description từ backend
  category: EventCategory;
  location?: string;
  imageUrl?: string;
  era?: string;
  period?: string;
  startYear?: number;
  endYear?: number;
  beforeTCN?: boolean;
}

export interface GetEventsParams {
  search?: string;
  page?: number;
  size?: number;
  era?: EventEra; // thêm dòng này
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
    category: (raw.category?.toLowerCase() as EventCategory) ?? "other",
    location: raw.location,
    imageUrl: raw.imageUrl,
    era: raw.era,
    period: raw.period,
    startYear: raw.startYear,
    endYear: raw.endYear,
    beforeTCN: raw.beforeTCN,
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
    return { ...raw, content: raw.content.map(mapContext) };
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
