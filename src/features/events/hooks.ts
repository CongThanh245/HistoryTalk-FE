import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  eventService,
  type GetEventsParams,
  type CreateEventRequest,
  type UpdateEventRequest,
  type HistoricalEvent,
  GetEventsResponse,
  EventEra,
  EventEraBackend,
} from "@/services/event.service";
import { queryKeys } from "@/shared/query-key";
import { toast } from "sonner";
import { removeContextFromCharacterCaches } from "@/features/characters/context-cache";
import { contextMediaService, type MediaType } from "@/services/media.service";

function isEventsResponse(value: unknown): value is GetEventsResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    Array.isArray((value as GetEventsResponse).content)
  );
}

function prependEventToList(old: unknown, newEvent: HistoricalEvent): unknown {
  if (!isEventsResponse(old)) return old;
  if (old.content.some((event) => event.id === newEvent.id)) return old;

  return {
    ...old,
    content: [newEvent, ...old.content].sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.title.localeCompare(b.title, "vi");
    }),
    totalElements: old.totalElements + 1,
  };
}

function applyContextMediaUrl(
  event: HistoricalEvent,
  mediaType: MediaType,
  viewUrl?: string,
): HistoricalEvent {
  if (!viewUrl) return event;
  if (mediaType === "IMAGE_2D") return { ...event, imageUrl: viewUrl };
  if (mediaType === "VIDEO") return { ...event, videoUrl: viewUrl };
  return event;
}

function getErrorMessage(err: unknown, fallback: string) {
  if (
    typeof err === "object" &&
    err !== null &&
    "response" in err &&
    typeof err.response === "object" &&
    err.response !== null &&
    "data" in err.response &&
    typeof err.response.data === "object" &&
    err.response.data !== null &&
    "message" in err.response.data &&
    typeof err.response.data.message === "string"
  ) {
    return err.response.data.message;
  }

  return fallback;
}

export function useEvents(params?: GetEventsParams) {
  return useQuery({
    queryKey: queryKeys.events.list(params),
    queryFn: () => {
      return eventService.getAllClient(params);
    },
    staleTime: 1000 * 60 * 5,
    refetchOnMount: true,
    placeholderData: (prev) => prev,
  });
}
export function useEventDetail(id?: string) {
  return useQuery({
    queryKey: queryKeys.events.detail(id || ""),
    queryFn: () => eventService.getById(id!),
    enabled: !!id,
  });
}
export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateEventRequest) => eventService.create(data),
    onSuccess: (newEvent) => {
      qc.setQueryData(queryKeys.events.detail(newEvent.id), newEvent);
      qc.setQueriesData(
        { queryKey: ["events", "list"] },
        (old: unknown) => prependEventToList(old, newEvent),
      );
      qc.invalidateQueries({ queryKey: ["events", "list"] });
      toast.success("Đã tạo bối cảnh thành công");
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Tạo bối cảnh thất bại"));
    },
  });
}

export function useUpdateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEventRequest }) =>
      eventService.update(id, data),
    onSuccess: (updatedEvent) => {
      qc.setQueryData(queryKeys.events.detail(updatedEvent.id), updatedEvent);
      qc.setQueryData(
        queryKeys.events.list({ page: 1, limit: 100 }),
        (old: GetEventsResponse | undefined) => {
          if (!old) return old;
          return {
            ...old,
            content: old.content.map((e) =>
              e.id === updatedEvent.id ? updatedEvent : e,
            ),
          };
        },
      );
      qc.invalidateQueries({ queryKey: ["events", "list"] });
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Cập nhật thất bại"));
    },
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => eventService.softDelete(id),
    onSuccess: (_, id) => {
      qc.setQueriesData(
        { queryKey: queryKeys.events.all },
        (old: GetEventsResponse | undefined) => {
          if (!old?.content) return old;
          return {
            ...old,
            content: old.content.filter((event) => event.id !== id),
            totalElements: Math.max(0, old.totalElements - 1),
          };
        },
      );
      qc.invalidateQueries({ queryKey: queryKeys.events.all });
      qc.invalidateQueries({ queryKey: queryKeys.trash.contexts });
      removeContextFromCharacterCaches(qc, id);
      toast.success("Đã chuyển vào thùng rác");
    },
  });
}
export function useTimelineEvents(era: EventEra) {
  const params: GetEventsParams = {
    page: 1,
    limit: 100,
    ...(era !== "all" && { era: era.toUpperCase() as EventEraBackend }),
  };

  const { data, isLoading, isFetching, isPlaceholderData } = useQuery({
    queryKey: queryKeys.events.list(params),
    queryFn: () => eventService.getAllClient(params),
    staleTime: 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    placeholderData: (prev) => prev,
  });
  return {
    events: data?.content ?? [],
    showSkeleton: isLoading || (isFetching && isPlaceholderData),
  };
}

// POST /historical-contexts/{id}/media/upload-direct — upload image/video
export function useUploadContextMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      contextId,
      file,
      mediaType,
      onProgress,
    }: {
      contextId: string;
      file: File;
      mediaType: MediaType;
      onProgress?: (percent: number) => void;
    }) => contextMediaService.upload(contextId, file, mediaType, onProgress),
    onSuccess: (result, { contextId, mediaType }) => {
      qc.setQueryData(
        queryKeys.events.detail(contextId),
        (old: HistoricalEvent | undefined) =>
          old ? applyContextMediaUrl(old, mediaType, result.viewUrl) : old,
      );
      qc.setQueriesData({ queryKey: queryKeys.events.all }, (old: unknown) => {
        if (!isEventsResponse(old)) return old;
        return {
          ...old,
          content: old.content.map((event) =>
            event.id === contextId
              ? applyContextMediaUrl(event, mediaType, result.viewUrl)
              : event,
          ),
        };
      });
      qc.invalidateQueries({ queryKey: queryKeys.events.detail(contextId) });
      qc.invalidateQueries({ queryKey: queryKeys.events.all });
      toast.success("Đã tải lên media thành công");
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Tải lên media thất bại"));
    },
  });
}

// DELETE /historical-contexts/{id}/media — mediaType omitted clears every slot
export function useDeleteContextMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ contextId, mediaType }: { contextId: string; mediaType?: MediaType }) =>
      contextMediaService.delete(contextId, mediaType),
    onSuccess: (_result, { contextId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.events.detail(contextId) });
      qc.invalidateQueries({ queryKey: queryKeys.events.all });
      toast.success("Đã xóa media");
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Xóa media thất bại"));
    },
  });
}

export function usePermanentDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => eventService.delete(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: queryKeys.events.all });
      removeContextFromCharacterCaches(qc, id);
      toast.success("Đã xóa vĩnh viễn bối cảnh");
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Xóa vĩnh viễn thất bại"));
    },
  });
}
