// app/(app)/characters/page.tsx
import { dehydrate } from "@tanstack/react-query";
import { HydrationBoundary } from "@/components/context/hydration-boundary";
import { getQueryClient } from "@/lib/get-query-client";
import { queryKeys } from "@/shared/query-key";
import { CharactersClient } from "@/components/character/character-client";
import { characterServerService } from "@/services/character.server.service";

export const metadata = {
  title: "Nhân vật lịch sử",
  description: "Trò chuyện với những nhân vật đã làm nên lịch sử Việt Nam",
};

export const dynamic = "force-dynamic";

/**
 * Server Component — prefetch danh sách nhân vật mặc định (page 1, limit 8)
 * để HTML đã có data sẵn → tốt cho SEO (public catalog) và giảm LCP.
 * React Query trên client sẽ tự pick up prefetched data, không fetch lại.
 */
export default async function CharactersPage() {
  const queryClient = getQueryClient();

  // Prefetch với params mặc định — khớp với CharactersClient initial state
  const defaultParams = { page: 1, limit: 8 };
  await queryClient.prefetchQuery({
    queryKey: queryKeys.characters.list(defaultParams),
    queryFn: () => characterServerService.getAll(defaultParams),
  });

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-3 py-4 md:px-6 md:py-8">
        <div className="flex items-center gap-3 mb-5 md:mb-8">
          <div>
            <h1
              className="text-xl md:text-2xl font-bold"
              style={{ color: "var(--content-heading)" }}
            >
              Nhân vật lịch sử
            </h1>
            <p
              className="text-xs md:text-sm mt-0.5"
              style={{ color: "var(--content-muted)" }}
            >
              Trò chuyện với những nhân vật đã làm nên lịch sử Việt Nam
            </p>
          </div>
        </div>
        <HydrationBoundary state={dehydrate(queryClient)}>
          <CharactersClient />
        </HydrationBoundary>
      </div>
    </div>
  );
}
