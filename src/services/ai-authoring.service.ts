import { axiosClient } from "@/configs/axios.client";
import type { AiStoryDraft } from "@/features/story/ai-draft";

type ApiEnvelope<T> = { success: boolean; data: T };

export type AiJobStatus = "queued" | "running" | "succeeded" | "failed" | "cancelled";
export type AiJobStage = "retrieving" | "generating" | "validating" | "repairing" | "done";

export interface AiJob<T> {
  jobId: string;
  status: AiJobStatus;
  stage: AiJobStage;
  progress: number;
  result?: T;
  error?: string;
}

export interface StoryRequest {
  contextId: string;
  narratorId?: string | null;
  characterIds?: string[];
  options?: { gradeLevel?: string; targetMinutes?: number; choiceCount?: number; quizCount?: number; tone?: string; notes?: string };
  backgrounds: { id: string; name: string }[];
  previousSteps?: Record<string, unknown>[];
  step?: Record<string, unknown> | null;
  instruction?: string | null;
  count?: number | null;
}

export interface BattlePlanRequest {
  contextId: string;
  options?: { phaseCount?: number; perspective?: string; gradeLevel?: string; notes?: string };
  existingFactions?: { id: string; name: string; color?: string }[];
  existingAnchors?: { id: string; name: string }[];
  storySummary?: string | null;
}

export interface AnchorToLocate { id: string; name: string; hint?: string }
export interface LocatedAnchor { id: string; found: boolean; x?: number; y?: number; confidence?: number }

/** Shown while a draft is written; the AI service reports which stage it is in. */
export const AI_STAGE_LABELS: Record<AiJobStage, string> = {
  retrieving: "Đang đọc tài liệu",
  generating: "Đang viết",
  validating: "Đang kiểm tra",
  repairing: "Đang sửa lỗi",
  done: "Xong",
};

/**
 * AI drafts for authors (content admins and teachers). Long drafts run as jobs on the AI service, so the
 * editor starts one and polls it.
 */
export const aiAuthoringService = {
  /** A whole story takes about half a minute, so it runs as a job. */
  startStory: async (body: StoryRequest): Promise<string> => {
    const res = await axiosClient.post<ApiEnvelope<{ jobId: string }>>("/ai-authoring/story/generate", { ...body, mode: "full", async: true });
    return res.data.data.jobId;
  },

  /** continue, rewrite and quiz answer in a few seconds. */
  generateStoryPart: async (body: StoryRequest & { mode: "continue" | "rewrite" | "quiz" }): Promise<AiStoryDraft> => {
    const res = await axiosClient.post<ApiEnvelope<AiStoryDraft>>("/ai-authoring/story/generate", body, { timeout: 180000 });
    return res.data.data;
  },

  startBattlePlan: async (body: BattlePlanRequest): Promise<string> => {
    const res = await axiosClient.post<ApiEnvelope<{ jobId: string }>>("/ai-authoring/battle-map/plan", { ...body, async: true });
    return res.data.data.jobId;
  },

  getJob: async <T>(jobId: string): Promise<AiJob<T>> => {
    const res = await axiosClient.get<ApiEnvelope<AiJob<T>>>(`/ai-authoring/jobs/${jobId}`);
    return res.data.data;
  },

  cancelJob: async (jobId: string): Promise<void> => {
    await axiosClient.delete(`/ai-authoring/jobs/${jobId}`);
  },

  /** A data: URL (image not uploaded yet) is sent as base64, anything else as a link. */
  locateAnchors: async (imageUrl: string, anchors: AnchorToLocate[]): Promise<LocatedAnchor[]> => {
    const image = imageUrl.startsWith("data:") ? { imageBase64: imageUrl } : { imageUrl };
    const res = await axiosClient.post<ApiEnvelope<{ anchors: LocatedAnchor[] }>>(
      "/ai-authoring/battle-map/locate-anchors",
      { ...image, anchors: anchors.slice(0, 10) },
      { timeout: 180000 },
    );
    return res.data.data.anchors;
  },
};

/** Polls a job until it ends; aborting stops polling (the caller also cancels the job). */
export async function waitForJob<T>(
  jobId: string,
  onProgress: (job: AiJob<T>) => void,
  signal: AbortSignal,
  intervalMs = 2000,
): Promise<AiJob<T>> {
  while (!signal.aborted) {
    const job = await aiAuthoringService.getJob<T>(jobId);
    onProgress(job);
    if (job.status === "succeeded" || job.status === "failed" || job.status === "cancelled") return job;
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
  throw new DOMException("Aborted", "AbortError");
}
