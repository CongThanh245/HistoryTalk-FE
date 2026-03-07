import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  eventService,
  type GetEventsParams,
  type CreateEventRequest,
  type UpdateEventRequest,
  GetEventsResponse,
} from "@/services/event.service";
import { queryKeys } from "@/shared/query-key";
import { toast } from "sonner";

export function useEvents(params?: GetEventsParams) {
  return useQuery({
    queryKey: queryKeys.events.list(params),
    queryFn: () => {
      console.log(
        "🔥 useEvents fetching with key:",
        queryKeys.events.list(params),
      );
      return eventService.getAllClient(params);
    },
    staleTime: 1000 * 60 * 5,
    placeholderData: (prev) => prev,
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
      toast.success("Tạo sự kiện thành công");
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
      toast.success("Cập nhật thành công");
    },
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => eventService.delete(id),
    onSuccess: (_, id) => {
      qc.setQueryData(
        queryKeys.events.list({ page: 1, limit: 100 }),
        (old: GetEventsResponse | undefined) => {
          if (!old) return old;
          return {
            ...old,
            content: old.content.filter((e) => e.id !== id),
          };
        },
      );
      toast.success("Xóa thành công");
    },
  });
}
