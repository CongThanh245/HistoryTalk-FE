// services/event.server.service.ts — CHỈ dùng axiosServer (server-side)
import { axiosServer } from "@/configs/axios.server";
import { GetEventsParams, GetEventsResponse, mapContext } from "./event.service";

export const eventServerService = {
  getAll: async (params?: GetEventsParams): Promise<GetEventsResponse> => {
    const res = await axiosServer.get("/historical-contexts", { params });
    const raw = res.data.data;
    return { ...raw, content: raw.content.map(mapContext) };
  },
};
