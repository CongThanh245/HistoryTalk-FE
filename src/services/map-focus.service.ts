import { axiosClient } from "@/configs/axios.client";

/**
 * Diem camera ban do cua 1 boi canh (BE: MapFocusController).
 * GET cong khai (staff thay ca focus da tat); POST/PUT/PATCH/DELETE chi staff.
 */
export interface MapFocus {
  focusId: string;
  contextId: string;
  name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  /** 1.0 – 20.0 */
  zoomLevel: number | null;
  orderIndex: number;
  isDefault: boolean;
  isActive: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateMapFocusPayload {
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  zoomLevel?: number;
  isDefault?: boolean;
}

export type UpdateMapFocusPayload = Partial<CreateMapFocusPayload> & { isActive?: boolean };

const base = (contextId: string) => `/historical-contexts/${contextId}/map-focuses`;

export const mapFocusService = {
  list: async (contextId: string): Promise<MapFocus[]> => {
    const res = await axiosClient.get(base(contextId));
    return res.data.data ?? [];
  },
  create: async (contextId: string, payload: CreateMapFocusPayload): Promise<MapFocus> => {
    const res = await axiosClient.post(base(contextId), payload);
    return res.data.data;
  },
  update: async (contextId: string, focusId: string, payload: UpdateMapFocusPayload): Promise<MapFocus> => {
    const res = await axiosClient.put(`${base(contextId)}/${focusId}`, payload);
    return res.data.data;
  },
  reorder: async (contextId: string, focusIds: string[]): Promise<MapFocus[]> => {
    const res = await axiosClient.patch(`${base(contextId)}/reorder`, { focusIds });
    return res.data.data ?? [];
  },
  remove: async (contextId: string, focusId: string): Promise<void> => {
    await axiosClient.delete(`${base(contextId)}/${focusId}`);
  },
};
