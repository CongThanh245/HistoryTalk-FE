import { axiosClient } from "@/configs/axios.client";

export type MediaType = "IMAGE_2D" | "VIDEO" | "MODEL_3D";

export interface MediaUploadResult {
  objectPath: string;
  viewUrl: string;
  mediaType: MediaType;
}

type ApiEnvelope<T> = {
  success: boolean;
  message?: string;
  data?: T;
};

/**
 * Character/context media share the same upload-direct/media contract on
 * the backend (POST .../media/upload-direct?mediaType=..., DELETE .../media)
 * — this factory avoids duplicating the request plumbing for each entity.
 */
function buildMediaService(basePath: "characters" | "historical-contexts") {
  return {
    upload: async (
      entityId: string,
      file: File,
      mediaType: MediaType,
      onProgress?: (percent: number) => void,
    ): Promise<MediaUploadResult> => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await axiosClient.post<ApiEnvelope<MediaUploadResult>>(
        `/${basePath}/${entityId}/media/upload-direct`,
        formData,
        {
          params: { mediaType },
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (event) => {
            if (!onProgress || !event.total) return;
            onProgress(Math.round((event.loaded / event.total) * 100));
          },
        },
      );
      if (!res.data.success || !res.data.data) {
        throw new Error(res.data.message ?? "Upload media thất bại");
      }
      return res.data.data;
    },

    // mediaType omitted clears every media slot (image + video + model);
    // pass it to only clear that one slot.
    delete: async (entityId: string, mediaType?: MediaType): Promise<void> => {
      await axiosClient.delete(`/${basePath}/${entityId}/media`, {
        params: mediaType ? { mediaType } : undefined,
      });
    },
  };
}

export const characterMediaService = buildMediaService("characters");
export const contextMediaService = buildMediaService("historical-contexts");
