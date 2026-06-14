// services/chat-history.server.service.ts
// ✅ Chỉ dùng trong Server Components — được phép dùng axiosServer
// API trả về đúng format ChatHistoryGroup rồi, không cần map

import { axiosServer } from "@/configs/axios.server";
import { normalizeChatHistoryGroups } from "./chat-history.mapper";
import type { ChatHistoryGroup } from "./chat.service";

export const chatHistoryServerService = {
  getHistory: async (): Promise<ChatHistoryGroup[]> => {
    const res = await axiosServer.get("/chat/history");
    return normalizeChatHistoryGroups(res.data.data);
  },
};
