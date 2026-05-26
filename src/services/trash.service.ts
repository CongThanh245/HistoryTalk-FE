import { axiosClient } from "@/configs/axios.client";

export type TrashItemType = "quizzes" | "historical-contexts" | "characters";

export interface TrashItem {
  id: string;
  type: string;
  title: string;
  status: string;
  deletedAt: string;
}

export interface BulkOperationResult {
  requested: number;
  succeeded: number;
  results: { id: string; status: string; message: string }[];
}

export const trashService = {
  // GET /system/trash/{type}
  list: async (type: TrashItemType): Promise<TrashItem[]> => {
    const res = await axiosClient.get(`/system/trash/${type}`);
    return res.data.data ?? [];
  },

  // PATCH /system/trash/{type}/restore
  restore: async (
    type: TrashItemType,
    ids: string[],
  ): Promise<BulkOperationResult> => {
    const res = await axiosClient.patch(`/system/trash/${type}/restore`, { ids });
    return res.data.data;
  },

  // DELETE /system/trash/{type}
  permanentDelete: async (
    type: TrashItemType,
    ids: string[],
  ): Promise<BulkOperationResult> => {
    const res = await axiosClient.delete(`/system/trash/${type}`, {
      data: { ids },
    });
    return res.data.data;
  },
};
