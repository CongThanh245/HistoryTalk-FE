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
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Tạo sự kiện thất bại");
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
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Cập nhật thất bại");
    },
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => eventService.softDelete(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: queryKeys.events.all });
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

export function usePermanentDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => eventService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.events.all });
      toast.success("Đã xóa vĩnh viễn bối cảnh");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Xóa vĩnh viễn thất bại");
    },
  });
}
