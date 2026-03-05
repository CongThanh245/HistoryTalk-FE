import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// ── Types ────────────────────────────────────────────────

export type EventCategory =
  | "war"
  | "politics"
  | "culture"
  | "science"
  | "religion"
  | "other";

// Thời đại — dùng để filter UI
export type EventEra =
  | "all"      // Tất cả
  | "ancient"  // Cổ đại      (trước năm 938)
  | "medieval" // Trung đại   (938 – 1858)
  | "modern"   // Cận đại     (1858 – 1945)
  | "contemporary"; // Hiện đại (1945 – nay)

export interface HistoricalEvent {
  id: string;
  year: number;        // Năm diễn ra (âm = trước CN)
  yearLabel?: string;  // Hiển thị tuỳ chỉnh, vd: "938 SCN", "200 TCN"
  title: string;
  summary: string;
  category: EventCategory;
  location?: string;
  imageUrl?: string;   // TODO: ảnh thumbnail
}

export interface GetEventsParams {
  page?: number;
  limit?: number;
  era?: EventEra;      // TODO: backend filter theo thời đại
  category?: EventCategory;
  search?: string;
}

export interface GetEventsResponse {
  data: HistoricalEvent[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── Service ──────────────────────────────────────────────

export const eventService = {
  getEvents: async (params?: GetEventsParams): Promise<GetEventsResponse> => {
    const res = await axios.get(`${API_URL}/events`, { params });
    return res.data;
  },

  getEventById: async (id: string): Promise<HistoricalEvent> => {
    const res = await axios.get(`${API_URL}/events/${id}`);
    return res.data;
  },
};

// ── Era helper (dùng ở client khi chưa có API filter) ────

export const ERA_CONFIG: Record<EventEra, { label: string; range: [number, number] }> = {
  all:           { label: "Tất cả",   range: [-Infinity, Infinity] },
  ancient:       { label: "Cổ đại",   range: [-Infinity, 937]      },
  medieval:      { label: "Trung đại", range: [938, 1857]           },
  modern:        { label: "Cận đại",  range: [1858, 1944]          },
  contemporary:  { label: "Hiện đại", range: [1945, Infinity]      },
};

export function getEraFromYear(year: number): Exclude<EventEra, "all"> {
  if (year <= 937)  return "ancient";
  if (year <= 1857) return "medieval";
  if (year <= 1944) return "modern";
  return "contemporary";
}