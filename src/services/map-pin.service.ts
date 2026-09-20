import { axiosClient } from "@/configs/axios.client";

export type MapPinOwnerType = "ADMIN" | "USER";
export type MapPinType = "ALLIED_FORCE" | "ENEMY_FORCE";

export interface MapPin {
  pinId: string;
  contextId: string;
  createdBy: string;
  pinOwnerType: MapPinOwnerType;
  label: string;
  description?: string | null;
  pinType?: MapPinType | null;
  latitude: number;
  longitude: number;
  pinYear: number;
  createdAt: string;
  updatedAt?: string | null;
}

export interface CreateMapPinRequest {
  label: string;
  description?: string;
  pinType?: MapPinType;
  latitude: number;
  longitude: number;
  pinYear: number;
}

export const mapPinService = {
  getByContextAndYear: async (
    contextId: string,
    year: number,
  ): Promise<MapPin[]> => {
    const response = await axiosClient.get(
      `/historical-contexts/${contextId}/map-pins`,
      { params: { year } },
    );
    return response.data.data ?? [];
  },

  create: async (
    contextId: string,
    payload: CreateMapPinRequest,
  ): Promise<MapPin> => {
    const response = await axiosClient.post(
      `/historical-contexts/${contextId}/map-pins`,
      payload,
    );
    return response.data.data;
  },

  delete: async (contextId: string, pinId: string): Promise<void> => {
    await axiosClient.delete(
      `/historical-contexts/${contextId}/map-pins/${pinId}`,
    );
  },
};
