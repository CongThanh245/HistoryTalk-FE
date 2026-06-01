"use client";

import Link from "next/link";
import { useEvents } from "@/features/events/hooks";
import { BankIcon, ArrowRight } from "@phosphor-icons/react";
import Image from "next/image";
import { isValidUrl } from "@/lib/utils/url";

// Skeleton for loading state
function SkeletonCard() {
  return (
    <div
      className="w-full h-[230px] sm:h-[320px] rounded-xl sm:rounded-2xl border animate-pulse flex flex-col overflow-hidden"
      style={{
        background: "var(--card-light-bg)",
        borderColor: "var(--card-light-border)",
      }}
    >
      <div className="h-[118px] sm:h-[180px] w-full" style={{ background: "var(--card-light-border)", opacity: 0.5 }} />
      <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
        <div className="h-3 w-1/3 rounded" style={{ background: "var(--card-light-border)" }} />
        <div className="h-4 w-4/5 rounded" style={{ background: "var(--card-light-border)" }} />
        <div className="h-3 w-full rounded" style={{ background: "var(--card-light-border)" }} />
      </div>
    </div>
  );
}

export function HistoricalContexts() {
  const { data, isLoading } = useEvents({ page: 1, limit: 8 });
  const events = data?.content ?? [];

  return (
    <section className="mb-6 md:mb-8">
      {/* Title Header */}
      <div className="flex items-center gap-2 mb-3 md:mb-5">
        <BankIcon className="w-4 h-4 md:w-5 md:h-5" style={{ color: "var(--accent-gold)" }} />
        <h2 className="text-lg md:text-xl font-bold" style={{ color: "var(--content-heading)" }}>
          Khám phá bối cảnh lịch sử
        </h2>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
          : events.map((event) => (
            <Link
              key={event.id}
              href={`/events?event=${event.id}`}
              className="w-full group block outline-none ring-0"
              style={{ textDecoration: "none" }}
            >
              <div
                className="h-[230px] sm:h-[320px] rounded-xl sm:rounded-2xl border flex flex-col overflow-hidden relative"
                style={{
                  background: "var(--card-light-bg)",
                  borderColor: "var(--card-light-border)",
                  transition: "border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--accent-gold)";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-soft)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--card-light-border)";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                }}
              >
                {/* Background Image / Placeholder */}
                <div className="h-[118px] sm:h-[180px] relative w-full border-b" style={{ borderColor: "var(--card-light-border)", background: "var(--bg-deep)" }}>
                  {isValidUrl(event.imageUrl) ? (
                    <Image
                      src={event.imageUrl!}
                      alt={event.title}
                      fill
                      className="object-cover opacity-[0.85] transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center opacity-20">
                      <BankIcon className="w-8 h-8" />
                    </div>
                  )}
                  {/* Gradient overlay */}
                  <div className="absolute bottom-0 left-0 right-0 h-[40%] bg-gradient-to-t from-[var(--card-light-bg)] to-transparent" />
                </div>

                <div className="p-3 sm:p-4 flex-1 flex flex-col relative z-10 -mt-2 bg-[var(--card-light-bg)]">
                  <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest mb-1 sm:mb-1.5 drop-shadow-sm" style={{ color: "var(--accent-gold)" }}>
                    {event.year > 0 ? `Năm ${event.year}` : `Năm ${Math.abs(event.year)} TCN`}
                  </p>
                  <h3 className="text-[13px] sm:text-base font-bold line-clamp-2 sm:line-clamp-1 mb-1 sm:mb-1.5 leading-snug group-hover:text-[var(--accent-gold)] transition-colors" style={{ color: "var(--content-heading)" }}>
                    {event.title}
                  </h3>
                  <p className="text-[11px] sm:text-xs line-clamp-2" style={{ color: "var(--content-muted)", lineHeight: 1.45 }}>
                    {event.summary || "Khám phá câu chuyện chi tiết về bối cảnh lịch sử này ngay."}
                  </p>
                </div>
              </div>
            </Link>
          ))
        }

        {/* Placeholder if no events */}
        {!isLoading && events.length === 0 && (
          <div
            className="col-span-full text-center py-10 rounded-2xl border border-dashed"
            style={{ borderColor: "var(--card-light-border)", color: "var(--content-muted)" }}
          >
            <p className="text-sm">Chưa có sự kiện nào.</p>
          </div>
        )}
      </div>

      {/* View all button at bottom */}
      {!isLoading && events.length > 0 && (
        <div className="flex justify-center mt-4 md:mt-6">
          <Link
            href="/events"
            className="flex items-center gap-1.5 px-4 md:px-6 py-2 md:py-2.5 rounded-xl border text-[13px] md:text-sm font-semibold transition-all duration-200"
            style={{
              color: "var(--accent-gold)",
              borderColor: "var(--accent-gold)",
              background: "transparent",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--accent-gold-active-bg)";
              e.currentTarget.style.boxShadow = "var(--shadow-gold)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            Xem tất cả bối cảnh <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </section>
  );
}
