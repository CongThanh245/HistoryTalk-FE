import { axiosClient } from "@/configs/axios.client";

export type MapPinOwnerType = "ADMIN" | "USER";

export interface MapPin {
  pinId: string;
  contextId: string;
  createdBy: string;
  pinOwnerType: MapPinOwnerType;
  label: string;
  description?: string | null;
  latitude: number;
  longitude: number;
  pinYear: number;
  createdAt: string;
  updatedAt?: string | null;
}

export interface CreateMapPinRequest {
  label: string;
  description?: string;
  latitude: number;
  longitude: number;
  pinYear: number;
}

/** Partial update: fields left out stay unchanged; `description: ""` clears the narration. */
export type UpdateMapPinRequest = Partial<CreateMapPinRequest>;

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

  update: async (
    contextId: string,
    pinId: string,
    payload: UpdateMapPinRequest,
  ): Promise<MapPin> => {
    const response = await axiosClient.put(
      `/historical-contexts/${contextId}/map-pins/${pinId}`,
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
