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
import { LocalCatalogSwitch } from "@/components/saas/local-catalog-switch";
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
      <ArchiveHeading
        as="h1"
        label="Biên niên"
        title="Sự kiện lịch sử"
        description="Hành trình qua các mốc lịch sử quan trọng của dân tộc"
        className="mb-2 border-b-0 pb-0"
      />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <LocalCatalogSwitch kind="CONTEXT">
          <EventsClient />
        </LocalCatalogSwitch>
      </HydrationBoundary>
    </div>
  );
}
