"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Landmark, ChevronRight } from "lucide-react";
import { useEventDetail, useEvents } from "@/features/events/hooks";
import { isValidUrl } from "@/lib/utils/url";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

interface HistoricalContextHoverCardProps {
  contextId: string;
  fallbackLabel: string;
  children: React.ReactNode;
}

export function HistoricalContextHoverCard({
  contextId,
  fallbackLabel,
  children,
}: HistoricalContextHoverCardProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { data: eventList } = useEvents({ page: 1, limit: 100 });
  const listedEvent = eventList?.content.find((item) => item.id === contextId);
  const { data: detailEvent, isLoading: detailLoading } = useEventDetail(
    open && !listedEvent ? contextId : undefined,
  );
  const event = listedEvent ?? detailEvent;
  const isLoading = !listedEvent && detailLoading;

  const handleNavigate = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    router.push(`/events?event=${contextId}`);
  };

  return (
    <HoverCard open={open} onOpenChange={setOpen} openDelay={150} closeDelay={100}>
      <HoverCardTrigger asChild onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        {children}
      </HoverCardTrigger>
      <HoverCardContent
        className="cursor-pointer overflow-hidden"
        onClick={handleNavigate}
      >
        <div className="relative h-28 w-full overflow-hidden border-b border-[var(--text-primary)] bg-[var(--bg-deep)]">
          {isValidUrl(event?.imageUrl) ? (
            <Image
              src={event!.imageUrl!}
              alt={event?.title ?? fallbackLabel}
              fill
              className="object-cover"
              sizes="288px"
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center bg-card-border"
            >
              <Landmark
                className="h-8 w-8 opacity-40 text-content-text"
              />
            </div>
          )}
        </div>
        <div className="p-3">
          <h4
            className="archive-title is-plain line-clamp-1 text-[17px]"
          >
            {event?.title ?? fallbackLabel}
          </h4>
          {isLoading ? (
            <div className="mt-2 space-y-1.5">
              <div
                className="h-2.5 w-full animate-pulse rounded-[2px] bg-card-border"
              />
              <div
                className="h-2.5 w-4/5 animate-pulse rounded-[2px] bg-card-border"
              />
            </div>
          ) : (
            event?.summary && (
              <p
                className="mt-1 line-clamp-2 text-xs leading-relaxed text-content-text"
              >
                {event.summary}
              </p>
            )
          )}
          <div
            className="mt-2.5 flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.1em] text-accent-gold"
          >
            Xem thêm
            <ChevronRight className="h-3 w-3" />
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
