export const runtime = 'edge';

// app/(app)/events/page.tsx
import { dehydrate } from "@tanstack/react-query";
import { HydrationBoundary } from "@/components/context/hydration-boundary";
import { getQueryClient } from "@/lib/get-query-client";
import { queryKeys } from "@/shared/query-key";
import { eventServerService } from "@/services/event.server.service";
import { EventsClient } from "@/components/event/event-page";

export const metadata = {
  title: "Sự kiện lịch sử",
  description: "Hành trình qua các mốc lịch sử quan trọng của dân tộc",
};

export const dynamic = "force-dynamic";
export default async function EventsPage() {
  const queryClient = getQueryClient();

  const defaultParams = { page: 1, limit: 100 };
  await queryClient.prefetchQuery({
    queryKey: queryKeys.events.list(defaultParams),
    queryFn: () => eventServerService.getAll(defaultParams),
  });

  return (
    <div className="space-y-6 lg:space-y-8 py-6 lg:py-8">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="font-title text-xl md:text-2xl font-bold text-content-heading">
            Sự kiện lịch sử
          </h1>
          <p className="text-xs md:text-sm mt-0.5 text-content-muted">
            Hành trình qua các mốc lịch sử quan trọng của dân tộc
          </p>
        </div>
      </div>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <EventsClient />
      </HydrationBoundary>
    </div>
  );
}
