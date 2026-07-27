"use client";

import Link from "next/link";
import { useEvents } from "@/features/events/hooks";
import { Landmark, ArrowRight } from "lucide-react";
import Image from "next/image";
import { isValidUrl } from "@/lib/utils/url";

// Skeleton for loading state
function SkeletonCard() {
  return (
    <div className="w-full h-[230px] sm:h-[320px] rounded-xl sm:rounded-2xl border animate-pulse flex flex-col overflow-hidden bg-card-light-bg border-card-light-border">
      <div className="h-[118px] sm:h-[180px] w-full bg-card-light-border opacity-50" />
      <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
        <div className="h-3 w-1/3 rounded bg-card-light-border" />
        <div className="h-4 w-4/5 rounded bg-card-light-border" />
        <div className="h-3 w-full rounded bg-card-light-border" />
      </div>
    </div>
  );
}

export function HistoricalContexts() {
  const { data, isLoading } = useEvents({ page: 1, limit: 8 });
  const events = data?.content ?? [];

  return (
    <section className="mb-8 md:mb-12">
      {/* Title Header */}
      <div className="flex items-center justify-between mb-5 md:mb-7">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-accent-gold/10 border border-accent-gold/20">
            <Landmark className="w-4.5 h-4.5 text-accent-gold" />
          </div>
          <div>
            <h2 className="font-title text-xl md:text-2xl font-bold text-content-heading leading-tight">
              Khám phá bối cảnh lịch sử
            </h2>
            <p className="text-xs text-content-muted mt-0.5 hidden sm:block">
              Bước vào không gian của từng thời đại
            </p>
          </div>
        </div>
        {!isLoading && events.length > 0 && (
          <Link
            href="/events"
            className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-full border text-sm font-medium transition-all duration-200 text-accent-gold border-accent-gold/30 hover:bg-accent-gold/10 hover:border-accent-gold/50"
          >
            Xem tất cả <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
          : events.map((event) => (
            <Link
              key={event.id}
              href={`/events?event=${event.id}`}
              className="w-full group block outline-none ring-0 no-underline"
            >
              <div className="h-[240px] sm:h-[320px] rounded-2xl border flex flex-col overflow-hidden relative bg-card-light-bg border-card-light-border transition-all duration-300 hover:border-accent-gold/40 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)]">
                {/* Background Image */}
                <div className="h-[130px] sm:h-[190px] relative w-full overflow-hidden bg-bg-deep">
                  {isValidUrl(event.imageUrl) ? (
                    <Image
                      src={event.imageUrl!}
                      alt={event.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center opacity-20">
                      <Landmark className="w-10 h-10" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--card-light-bg)] via-transparent to-transparent opacity-80" />
                </div>

                <div className="p-3.5 sm:p-4 flex-1 flex flex-col relative z-10 -mt-4">
                  <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.15em] mb-1.5 text-accent-gold">
                    {event.year > 0 ? `Năm ${event.year}` : `Năm ${Math.abs(event.year)} TCN`}
                  </p>
                  <h3 className="text-[13px] sm:text-[15px] font-bold line-clamp-2 sm:line-clamp-1 mb-1.5 leading-snug group-hover:text-accent-gold transition-colors duration-200 text-content-heading">
                    {event.title}
                  </h3>
                  <p className="text-[11px] sm:text-xs line-clamp-2 text-content-muted leading-relaxed">
                    {event.summary || "Khám phá câu chuyện chi tiết về bối cảnh lịch sử này ngay."}
                  </p>
                </div>
              </div>
            </Link>
          ))
        }

        {/* Placeholder if no events */}
        {!isLoading && events.length === 0 && (
          <div className="col-span-full text-center py-12 rounded-2xl border border-dashed border-card-light-border text-content-muted">
            <p className="text-sm">Chưa có sự kiện nào.</p>
          </div>
        )}
      </div>

      {/* Mobile view all */}
      {!isLoading && events.length > 0 && (
        <div className="flex justify-center mt-5 sm:hidden">
          <Link
            href="/events"
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-full border text-sm font-medium text-accent-gold border-accent-gold/30"
          >
            Xem tất cả bối cảnh <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </section>
  );
}
