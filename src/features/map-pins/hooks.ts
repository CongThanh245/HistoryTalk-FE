"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  mapPinService,
  type CreateMapPinRequest,
} from "@/services/map-pin.service";

const mapPinKey = (contextId: string, year: number) =>
  ["map-pins", contextId, year] as const;

function getErrorMessage(error: unknown, fallback: string) {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error
  ) {
    const response = (error as {
      response?: { data?: { message?: string } };
    }).response;
    return response?.data?.message ?? fallback;
  }
  return fallback;
}

export function useMapPins(contextId: string | null, year: number) {
  return useQuery({
    queryKey: mapPinKey(contextId ?? "", year),
    queryFn: () => mapPinService.getByContextAndYear(contextId!, year),
    enabled: Boolean(contextId),
    staleTime: 30_000,
  });
}

export function useCreateMapPin(contextId: string | null, year: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateMapPinRequest) =>
      mapPinService.create(contextId!, payload),
    onSuccess: (createdPin) => {
      queryClient.setQueryData(
        mapPinKey(contextId!, year),
        (current: unknown) =>
          Array.isArray(current) ? [...current, createdPin] : [createdPin],
      );
      toast.success("Đã thêm điểm trên bản đồ");
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, "Không thể thêm điểm. Vui lòng thử lại.")),
  });
}

export function useDeleteMapPin(contextId: string | null, year: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (pinId: string) => mapPinService.delete(contextId!, pinId),
    onSuccess: (_, pinId) => {
      queryClient.setQueryData(
        mapPinKey(contextId!, year),
        (current: unknown) =>
          Array.isArray(current)
            ? current.filter(
                (pin) =>
                  typeof pin === "object" &&
                  pin !== null &&
                  "pinId" in pin &&
                  pin.pinId !== pinId,
              )
            : [],
      );
      toast.success("Đã xóa điểm khỏi bản đồ");
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, "Không thể xóa điểm. Vui lòng thử lại.")),
  });
}
