"use client";

import { useQuery } from "@tanstack/react-query";
import { roomService } from "@/services/room.service";

export function useRoom(roomId: string | null) {
  return useQuery({
    queryKey: ["rooms", "detail", roomId],
    queryFn: () => roomService.getById(roomId!),
    enabled: !!roomId,
    staleTime: 10 * 60 * 1000,
  });
}

export function useRoomByLandmark(landmarkId: string | null) {
  return useQuery({
    queryKey: ["rooms", "by-landmark", landmarkId],
    queryFn: () => roomService.getByLandmark(landmarkId!),
    enabled: !!landmarkId,
    staleTime: 10 * 60 * 1000,
  });
}
