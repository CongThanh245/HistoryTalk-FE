"use client";

import { useQuery } from "@tanstack/react-query";
import {
  LandmarkContextEvent,
  landmarkService,
  MOCK_CONTEXT_EVENTS,
  type GetLandmarksParams,
} from "@/services/landmark.service";
import { characterService } from "@/services/character.service";
import { queryKeys } from "@/shared/query-key";

// GET /landmarks
export function useLandmarks(params?: GetLandmarksParams) {
  return useQuery({
    queryKey: ["landmarks", "list", params ?? {}],
    queryFn: () => landmarkService.getAll(params),
    staleTime: 5 * 60 * 1000, // landmark ít thay đổi
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
type ContextEvent = (typeof MOCK_CONTEXT_EVENTS)[string];

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
