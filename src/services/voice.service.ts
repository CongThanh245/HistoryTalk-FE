import { axiosClient } from "@/configs/axios.client";
import { inappropriateMessageFrom } from "@/lib/utils/content-policy";

/** Character voices of the self-hosted TTS server (chat_exam_mode_api_contract.md §6). */
export interface CharacterVoice {
  /** Also the value sent as a character's voiceId. */
  id: string;
  gender: "MALE" | "FEMALE";
  region: "NORTH" | "CENTRAL" | "SOUTH";
  style?: string;
  recommended?: boolean;
  /** Used when a character has no voiceId. */
  isDefault?: boolean;
}

export const VOICE_GENDER_LABELS: Record<CharacterVoice["gender"], string> = {
  MALE: "Nam",
  FEMALE: "Nữ",
};

export const VOICE_REGION_LABELS: Record<CharacterVoice["region"], string> = {
  NORTH: "Miền Bắc",
  CENTRAL: "Miền Trung",
  SOUTH: "Miền Nam",
};

/** Max length of the sentence a person types to preview a voice. */
export const VOICE_PREVIEW_MAX_LENGTH = 300;

/** Errors of the preview endpoint come back as a Blob, since the request asks for audio. */
async function previewErrorMessage(error: unknown): Promise<string> {
  const e = error as { response?: { status?: number; data?: unknown } };
  let message: unknown;
  const data = e?.response?.data;
  if (data instanceof Blob) {
    try {
      message = (JSON.parse(await data.text()) as { message?: unknown }).message;
    } catch {
      message = undefined;
    }
  }
  const blocked = inappropriateMessageFrom(message);
  if (blocked) return blocked;
  if (e?.response?.status && e.response.status >= 500) {
    return "Dịch vụ giọng đọc đang không khả dụng. Vui lòng thử lại sau.";
  }
  return typeof message === "string" && message ? message : "Không nghe thử được giọng này.";
}

export const voiceService = {
  /** CONTENT_ADMIN and TEACHER only. */
  list: async (): Promise<CharacterVoice[]> => {
    const res = await axiosClient.get("/voices");
    return res.data.data ?? [];
  },

  /** WAV audio of the voice reading `text`, or a stock sentence when `text` is empty. */
  preview: async (voiceId: string, text?: string): Promise<Blob> => {
    try {
      const res = await axiosClient.post(
        "/voices/preview",
        { voiceId, ...(text?.trim() ? { text: text.trim() } : {}) },
        { responseType: "blob", timeout: 60000 },
      );
      return res.data as Blob;
    } catch (error) {
      throw new Error(await previewErrorMessage(error));
    }
  },
};
