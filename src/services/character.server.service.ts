// services/character.server.service.ts
import { axiosServer } from "@/configs/axios.server";

// Reuse types từ character.service nếu có, hoặc khai báo inline
export interface GetCharactersParams {
  search?: string;
  page?: number;
  limit?: number;
  contextId?: string;
}

export const characterServerService = {
  getAll: async (params?: GetCharactersParams) => {
    const res = await axiosServer.get("/characters", { params });
    return res.data.data;
  },
};
