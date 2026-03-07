import { useQuery } from "@tanstack/react-query";
import { eventService, type GetEventsParams } from "@/services/event.service";
import { queryKeys } from "@/shared/query-key";

export function useEvents(params?: GetEventsParams) {
  return useQuery({
    queryKey: queryKeys.events.list(params),
    queryFn: () => eventService.getAllClient(params),
  });
}