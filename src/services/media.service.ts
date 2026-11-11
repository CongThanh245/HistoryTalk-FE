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

/** [x, y] as a share of the image width and height, y down. */
export type PortraitPoint = [number, number];

export interface PortraitPoints {
  eyeLeft: PortraitPoint;
  eyeRight: PortraitPoint;
  mouth: PortraitPoint;
  chin: PortraitPoint;
}

/**
 * How the call screen shows a character. AUTO: the talking portrait when the 3D
 * model is AI-generated or missing, otherwise the 3D model.
 */
export type PortraitDisplayMode = "AUTO" | "PORTRAIT" | "MODEL_3D";

export interface PortraitSettings {
  mode: PortraitDisplayMode;
  /** How far the mouth opens, 1 = default. */
  mouthOpen: number;
  /** Framing, 1 = head and shoulders; larger is closer. */
  zoom: number;
  /** Face points placed by hand; only used while the image is still imageUrl. */
  points?: PortraitPoints;
  imageUrl?: string;
}

export const DEFAULT_PORTRAIT_SETTINGS: PortraitSettings = { mode: "AUTO", mouthOpen: 1, zoom: 1 };

/** Stored by the backend as a JSON file next to the character's media. */
export const portraitSettingsService = {
  get: async (characterId: string): Promise<PortraitSettings> => {
    const res = await axiosClient.get<ApiEnvelope<Partial<PortraitSettings> | null>>(
      `/characters/${characterId}/media/portrait-settings`,
    );
    return { ...DEFAULT_PORTRAIT_SETTINGS, ...(res.data.data ?? {}) };
  },

  save: async (characterId: string, settings: PortraitSettings): Promise<PortraitSettings> => {
    const res = await axiosClient.put<ApiEnvelope<PortraitSettings>>(
      `/characters/${characterId}/media/portrait-settings`,
      settings,
    );
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message ?? "Không lưu được thiết lập chân dung");
    }
    return { ...DEFAULT_PORTRAIT_SETTINGS, ...res.data.data };
  },
};

export const characterMediaService = buildMediaService("characters");
export const contextMediaService = buildMediaService("historical-contexts");

/**
 * Battle-map background images are public assets not tied to a media slot:
 * POST /media/map-image returns a permanent URL to embed in battleMap.imageUrl.
 */
export const battleMapImageService = {
  upload: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await axiosClient.post<ApiEnvelope<{ url: string }>>(
      "/media/map-image",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    if (!res.data.success || !res.data.data?.url) {
      throw new Error(res.data.message ?? "Tải ảnh lược đồ thất bại");
    }
    return res.data.data.url;
  },
};
