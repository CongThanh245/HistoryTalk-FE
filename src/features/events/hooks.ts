import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  eventService,
  type GetEventsParams,
  type CreateEventRequest,
  type UpdateEventRequest,
  GetEventsResponse,
  EventEra,
  EventEraBackend,
} from "@/services/event.service";
import { queryKeys } from "@/shared/query-key";
import { toast } from "sonner";
import { removeContextFromCharacterCaches } from "@/features/characters/context-cache";
import { contextMediaService, type MediaType } from "@/services/media.service";

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
      // Cập nhật cache ngay, không cần chờ refetch
      qc.setQueryData(
        queryKeys.events.list({ page: 1, limit: 100 }),
        (old: GetEventsResponse | undefined) => {
          if (!old) return old;
          return { ...old, content: [newEvent, ...old.content] };
        },
      );
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Tạo sự kiện thất bại"));
    },
  });
}

export function useUpdateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEventRequest }) =>
      eventService.update(id, data),
    onSuccess: (updatedEvent) => {
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
    staleTime: 1000 * 60 * 5,
    placeholderData: (prev) => prev,
  });
  console.log({ isLoading, isFetching });

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
    }: {
      contextId: string;
      file: File;
      mediaType: MediaType;
    }) => contextMediaService.upload(contextId, file, mediaType),
    onSuccess: (_result, { contextId }) => {
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
