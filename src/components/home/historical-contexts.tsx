"use client";

import Link from "next/link";
import { useEvents } from "@/features/events/hooks";
import { Landmark, ArrowRight } from "lucide-react";
import Image from "next/image";
import { isValidUrl } from "@/lib/utils/url";
import { ArchiveHeading } from "@/components/commons/archive-heading";

const formatYear = (year: number) => (year > 0 ? String(year) : `${Math.abs(year)} TCN`);

// Skeleton for loading state
function SkeletonCard() {
  return (
    <div className="w-full h-[250px] sm:h-[350px] border-r border-b border-[var(--text-primary)] animate-pulse flex flex-col overflow-hidden bg-[var(--bg-surface)]">
      <div className="h-[130px] sm:h-[190px] w-full bg-[var(--bg-deep)]" />
      <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
        <div className="h-3 w-1/3 bg-[var(--border-default)]" />
        <div className="h-5 w-4/5 bg-[var(--border-default)]" />
        <div className="h-3 w-full bg-[var(--border-default)]" />
      </div>
    </div>
  );
}

export function HistoricalContexts() {
  const { data, isLoading } = useEvents({ page: 1, limit: 8 });
  const events = data?.content ?? [];

  return (
    <section className="mb-8 md:mb-12">
      <ArchiveHeading
        label="Bối cảnh"
        title="Khám phá bối cảnh lịch sử"
        description="Bước vào không gian của từng thời đại"
        action={!isLoading && events.length > 0 ? { href: "/events", text: "Xem tất cả" } : undefined}
      />

      {/* Ruled grid: the container draws the top/left rules, each file its right/bottom ones. */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 border-t border-l border-[var(--text-primary)]">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
          : events.map((event, index) => (
            <Link
              key={event.id}
              href={`/events?event=${event.id}`}
              className="group flex flex-col h-[250px] sm:h-[350px] overflow-hidden border-r border-b border-[var(--text-primary)] bg-[var(--bg-surface)] outline-none no-underline transition-colors duration-200 hover:bg-[var(--text-primary)] focus-visible:bg-[var(--text-primary)]"
            >
              <div className="relative h-[130px] sm:h-[190px] w-full overflow-hidden bg-[var(--bg-deep)] border-b border-[var(--text-primary)]">
                {isValidUrl(event.imageUrl) ? (
                  <Image
                    src={event.imageUrl!}
                    alt={event.title}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="archive-photo object-cover group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)]">
                    <Landmark className="w-10 h-10" />
                  </div>
                )}
                <span className="absolute left-0 top-0 px-2 py-1 text-[10px] font-bold tracking-[0.12em] bg-[var(--text-primary)] text-accent-brass-on-ink">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>

              <div className="flex-1 flex flex-col px-3.5 pt-3 pb-3.5 sm:px-4 sm:pt-4 sm:pb-4">
                <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.14em] text-accent-gold group-hover:text-accent-on-ink">
                  Năm {formatYear(event.year)}
                </p>
                <h3 className="archive-title is-plain mt-1.5 text-[17px] sm:text-[21px] line-clamp-2 group-hover:text-[var(--text-inverse)]">
                  {event.title}
                </h3>
                <p className="mt-auto pt-2 text-[11px] sm:text-xs line-clamp-2 leading-relaxed text-content-muted group-hover:text-[var(--text-inverse)] group-hover:opacity-75">
                  {event.summary || "Khám phá câu chuyện chi tiết về bối cảnh lịch sử này ngay."}
                </p>
              </div>
            </Link>
          ))
        }

        {/* Placeholder if no events */}
        {!isLoading && events.length === 0 && (
          <div className="col-span-full text-center py-12 border-r border-b border-[var(--text-primary)] text-content-muted">
            <p className="text-sm">Chưa có sự kiện nào.</p>
          </div>
        )}
      </div>

      {/* Mobile view all */}
      {!isLoading && events.length > 0 && (
        <div className="flex justify-center mt-5 sm:hidden">
          <Link href="/events" className="archive-link">
            Xem tất cả bối cảnh <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </section>
  );
}
