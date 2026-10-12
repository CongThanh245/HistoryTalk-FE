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
import { ArchiveHeading } from "@/components/commons/archive-heading";
import { OfficialCatalogBanner } from "@/components/saas/official-catalog-banner";
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
  // Deep links (`?event=<id>`, e.g. from the home page) open the detail modal straight away: the server
  // fetches only that event, and the list loads on the client behind the modal. Otherwise the user would
  // wait for the 100-event list and then for the detail, seeing the list flash first.
  // prefetchQuery never throws; a failed fetch just falls back to the client query.
  const eventId = firstParam(urlParams.event);
  if (eventId) {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.events.detail(eventId),
      queryFn: () => eventServerService.getById(eventId),
    });
  } else {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.events.list(params),
      queryFn: () => eventServerService.getAll(params),
    });
  }

  return (
    <div className="space-y-4 py-4 lg:py-5">
      <OfficialCatalogBanner />
      <ArchiveHeading
        as="h1"
        label="Biên niên"
        title="Sự kiện lịch sử"
        description="Hành trình qua các mốc lịch sử quan trọng của dân tộc"
        className="mb-2 border-b-0 pb-0"
      />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <EventsClient />
      </HydrationBoundary>
    </div>
  );
}
