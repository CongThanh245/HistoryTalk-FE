export const runtime = 'nodejs';

// app/(app)/events/page.tsx
import { dehydrate } from "@tanstack/react-query";
import { HydrationBoundary } from "@/components/context/hydration-boundary";
import { getQueryClient } from "@/lib/get-query-client";
import { queryKeys } from "@/shared/query-key";
import { eventServerService } from "@/services/event.server.service";
import { EventsClient } from "@/components/event/event-page";
import { firstParam, parseEra } from "@/lib/catalog-url-state";
import type { EventEraBackend, GetEventsParams } from "@/services/event.service";

import { catalogMetadata } from "@/lib/catalog-metadata";
export async function generateMetadata({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return catalogMetadata("/events", await searchParams);
}

export const dynamic = "force-dynamic";
export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const queryClient = getQueryClient();

  const urlParams = await searchParams;
  const era = parseEra(firstParam(urlParams.era));
  const params: GetEventsParams = {
    page: 1,
    limit: 100,
    ...(era !== "all" && { era: era.toUpperCase() as EventEraBackend }),
  };
  await queryClient.prefetchQuery({
    queryKey: queryKeys.events.list(params),
    queryFn: () => eventServerService.getAll(params),
  });

  return (
    <div className="space-y-4 py-4 lg:py-5">
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
