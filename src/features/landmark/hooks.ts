"use client";

import { useQuery } from "@tanstack/react-query";
import {
  LandmarkContextEvent,
  landmarkService,
  ALL_LANDMARKS,
  MOCK_CONTEXT_EVENTS,
  type GetLandmarksParams,
} from "@/services/landmark.service";
import { characterService } from "@/services/character.service";
import { queryKeys } from "@/shared/query-key";

// GET /landmarks
export function useLandmarks(params?: GetLandmarksParams) {
  return useQuery({
    queryKey: ["landmarks", "list", params ?? {}],
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 0));
      let result = [...ALL_LANDMARKS];
      if (params?.era) result = result.filter((l) => l.era === params.era);
      if (params?.type) result = result.filter((l) => l.type === params.type);
      return result;
    },
    staleTime: Infinity,
  });
}

// GET /landmarks/:id
export function useLandmark(landmarkId: string | null) {
  return useQuery({
    queryKey: ["landmarks", "detail", landmarkId],
    queryFn: () => landmarkService.getById(landmarkId!),
    enabled: !!landmarkId,
  });
}

// GET events linked to a landmark (by contextIds)
export function useLandmarkEvents(contextIds: string[]) {
  return useQuery<LandmarkContextEvent[]>({
    queryKey: ["landmarks", "events", contextIds],
    queryFn: () => landmarkService.getContextsByIds(contextIds),
    enabled: contextIds.length > 0,
  });
}

// GET /characters/context/:contextId — nhân vật của 1 sự kiện
export function useEventCharacters(contextId: string | null) {
  return useQuery({
    queryKey: queryKeys.characters.byContext(contextId ?? ""),
    queryFn: () => characterService.getByContext(contextId!),
    enabled: !!contextId,
  });
}
