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
export default function EventsPage() {
  return (
    <div className="px-3 py-6 md:px-6 md:py-8">
      <div className="space-y-8">
        <div className="flex items-center gap-3">
          <div>
            <h1
              className="text-2xl font-bold"
              style={{ color: "var(--content-heading)" }}
            >
              Sự kiện lịch sử
            </h1>
            <p
              className="text-sm mt-0.5"
              style={{ color: "var(--content-muted)" }}
            >
              Hành trình qua các mốc lịch sử quan trọng của dân tộc
            </p>
          </div>
        </div>
        <EventsClient />
      </div>
    </div>
  );
}
