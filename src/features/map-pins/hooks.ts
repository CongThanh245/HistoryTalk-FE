"use client";

import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth.store";
import {
  mapPinService,
  type CreateMapPinRequest,
  type MapPin,
  type UpdateMapPinRequest,
} from "@/services/map-pin.service";

/**
 * The list holds the viewer's own USER pins next to the ADMIN pins, so the cache is scoped per
 * account ("guest" when signed out): one account's study notes never show for another in the same browser.
 */
const mapPinKey = (contextId: string, year: number, viewer: string) =>
  ["map-pins", contextId, year, viewer] as const;

function useViewerKey() {
  return useAuthStore((state) => state.user?.uid) ?? "guest";
}

/** Toast copy for a pin flow (admin battle pins vs. personal study notes). */
export interface MapPinMessages {
  created?: string;
  deleted?: string;
  createError?: string;
  updateError?: string;
  deleteError?: string;
}

export function useOverviewMapPins(contexts: { id: string; year: number }[]) {
  const viewer = useViewerKey();
  return useQueries({
    queries: contexts.map(({ id, year }) => ({
      queryKey: mapPinKey(id, year, viewer),
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
  const viewer = useViewerKey();
  return useQuery({
    queryKey: mapPinKey(contextId ?? "", year, viewer),
    queryFn: () => mapPinService.getByContextAndYear(contextId!, year),
    enabled: Boolean(contextId),
    staleTime: 30_000,
  });
}

export function useCreateMapPin(contextId: string | null, year: number, messages?: MapPinMessages) {
  const queryClient = useQueryClient();
  const viewer = useViewerKey();
  return useMutation({
    mutationFn: (payload: CreateMapPinRequest) =>
      mapPinService.create(contextId!, payload),
    onSuccess: (createdPin) => {
      queryClient.setQueryData(
        mapPinKey(contextId!, year, viewer),
        (current: unknown) =>
          Array.isArray(current) ? [...current, createdPin] : [createdPin],
      );
      toast.success(messages?.created ?? "Đã thêm điểm trên bản đồ");
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, messages?.createError ?? "Không thể thêm điểm. Vui lòng thử lại.")),
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
export function useUpdateMapPin(contextId: string | null, year: number, messages?: MapPinMessages) {
  const queryClient = useQueryClient();
  const viewer = useViewerKey();
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
        mapPinKey(contextId!, year, viewer),
        (current: unknown) =>
          Array.isArray(current)
            ? current.map((item: MapPin) => (item.pinId === pin.pinId ? updatedPin : item))
            : [updatedPin],
      );
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, messages?.updateError ?? "Không lưu được ghim. Vui lòng thử lại.")),
  });
}

export function useDeleteMapPin(contextId: string | null, year: number, messages?: MapPinMessages) {
  const queryClient = useQueryClient();
  const viewer = useViewerKey();
  return useMutation({
    mutationFn: (pinId: string) => mapPinService.delete(contextId!, pinId),
    onSuccess: (_, pinId) => {
      queryClient.setQueryData(
        mapPinKey(contextId!, year, viewer),
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
      toast.success(messages?.deleted ?? "Đã xóa điểm khỏi bản đồ");
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, messages?.deleteError ?? "Không thể xóa điểm. Vui lòng thử lại.")),
  });
}
