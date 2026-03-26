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
export default function CharactersPage() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="px-3 py-6 md:px-6 md:py-8">
        <div className="flex items-center gap-3 mb-8">
          <div>
            <h1
              className="text-2xl font-bold"
              style={{ color: "var(--content-heading)" }}
            >
              Nhân vật lịch sử
            </h1>
            <p
              className="text-sm mt-0.5"
              style={{ color: "var(--content-muted)" }}
            >
              Trò chuyện với những nhân vật đã làm nên lịch sử Việt Nam
            </p>
          </div>
        </div>
        <CharactersClient />
      </div>
    </div>
  );
}
