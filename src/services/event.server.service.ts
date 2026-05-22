// services/event.server.service.ts — CHỈ dùng axiosServer (server-side)
import { axiosServer } from "@/configs/axios.server";
import {
  GetEventsParams,
  GetEventsResponse,
  HistoricalEvent,
  mapContext,
} from "./event.service";

export const eventServerService = {
  getAll: async (params?: GetEventsParams): Promise<GetEventsResponse> => {
    const res = await axiosServer.get("/historical-contexts", { params });
    const raw = res.data.data;

    const content = raw.content
      .map(mapContext)
      .sort((a: HistoricalEvent, b: HistoricalEvent) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.title.localeCompare(b.title, "vi");
      });

    return { ...raw, content };
  },
  getById: async (contextId: string): Promise<HistoricalEvent> => {
    const res = await axiosServer.get(`/historical-contexts/${contextId}`);
    return mapContext(res.data.data);
  },
};
