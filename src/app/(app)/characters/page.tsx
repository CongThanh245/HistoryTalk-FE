export const runtime = 'nodejs';

// app/(app)/characters/page.tsx
import { dehydrate } from "@tanstack/react-query";
import { HydrationBoundary } from "@/components/context/hydration-boundary";
import { getQueryClient } from "@/lib/get-query-client";
import { queryKeys } from "@/shared/query-key";
import { CharactersClient } from "@/components/character/character-client";
import { characterServerService } from "@/services/character.server.service";
import { firstParam, parseEra, parsePage } from "@/lib/catalog-url-state";
import type { EventEraBackend } from "@/services/event.service";
import type { GetCharactersParams } from "@/services/character.service";

import { catalogMetadata } from "@/lib/catalog-metadata";
export async function generateMetadata({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return catalogMetadata("/characters", await searchParams);
}

export const dynamic = "force-dynamic";

/**
 * Server Component — prefetch danh sách nhân vật theo bộ lọc trên URL
 * để HTML đã có data sẵn → tốt cho SEO (public catalog) và giảm LCP.
 * React Query trên client dùng lại dữ liệu đã prefetch nếu query key khớp.
 */
export default async function CharactersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const queryClient = getQueryClient();

  const urlParams = await searchParams;
  const era = parseEra(firstParam(urlParams.era));
  const search = (firstParam(urlParams.search) ?? "").trim();
  const params: GetCharactersParams = {
    page: parsePage(firstParam(urlParams.page)),
    limit: 10,
    ...(era !== "all" && { era: era.toUpperCase() as EventEraBackend }),
    ...(search && { search }),
  };
  await queryClient.prefetchQuery({
    queryKey: queryKeys.characters.list(params),
    queryFn: () => characterServerService.getAll(params),
  });

  return (
    <div className="space-y-6 lg:space-y-8 py-6 lg:py-8">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="font-title text-xl md:text-2xl font-bold text-content-heading">
            Nhân vật lịch sử
          </h1>
          <p className="text-xs md:text-sm mt-0.5 text-content-muted">
            Trò chuyện với những nhân vật đã làm nên lịch sử Việt Nam
          </p>
        </div>
      </div>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <CharactersClient />
      </HydrationBoundary>
    </div>
  );
}
