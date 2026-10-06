"use client";

import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  mapPinService,
  type CreateMapPinRequest,
  type MapPin,
  type UpdateMapPinRequest,
} from "@/services/map-pin.service";

const mapPinKey = (contextId: string, year: number) =>
  ["map-pins", contextId, year] as const;

export function useOverviewMapPins(contexts: { id: string; year: number }[]) {
  return useQueries({
    queries: contexts.map(({ id, year }) => ({
      queryKey: mapPinKey(id, year),
      queryFn: () => mapPinService.getByContextAndYear(id, year),
      staleTime: 30_000,
    })),
  });
}

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

function isMethodNotAllowed(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    (error as { response?: { status?: number } }).response?.status === 405
  );
}

/**
 * Edits a pin in place (PUT). Until the backend exposes PUT (it answers 405), falls back to
 * creating a copy with the changes and only then deleting the old pin, so a failure never loses it.
 */
export function useUpdateMapPin(contextId: string | null, year: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ pin, changes }: { pin: MapPin; changes: UpdateMapPinRequest }) => {
      try {
        return await mapPinService.update(contextId!, pin.pinId, changes);
      } catch (error) {
        if (!isMethodNotAllowed(error)) throw error;
        const created = await mapPinService.create(contextId!, {
          label: changes.label ?? pin.label,
          description: (changes.description ?? pin.description ?? "") || undefined,
          latitude: changes.latitude ?? pin.latitude,
          longitude: changes.longitude ?? pin.longitude,
          pinYear: changes.pinYear ?? pin.pinYear,
        });
        await mapPinService.delete(contextId!, pin.pinId);
        return created;
      }
    },
    onSuccess: (updatedPin, { pin }) => {
      queryClient.setQueryData(
        mapPinKey(contextId!, year),
        (current: unknown) =>
          Array.isArray(current)
            ? current.map((item: MapPin) => (item.pinId === pin.pinId ? updatedPin : item))
            : [updatedPin],
      );
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, "Không lưu được ghim. Vui lòng thử lại.")),
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
