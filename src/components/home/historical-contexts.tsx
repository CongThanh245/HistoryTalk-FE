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
      className="shrink-0 w-[240px] md:w-[280px] h-[180px] rounded-2xl border animate-pulse flex flex-col overflow-hidden"
      style={{
        background: "var(--card-light-bg)",
        borderColor: "var(--card-light-border)",
      }}
    >
      <div className="h-[80px] w-full" style={{ background: "var(--card-light-border)", opacity: 0.5 }} />
      <div className="p-4 space-y-3">
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
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BankIcon className="w-5 h-5" style={{ color: "var(--accent-gold)" }} />
          <h2 className="text-xl font-bold" style={{ color: "var(--content-heading)" }}>
            Khám phá bối cảnh lịch sử
          </h2>
        </div>
        <Link
          href="/events"
          className="flex items-center gap-1 text-sm font-medium hover:opacity-80 transition-opacity"
          style={{ color: "var(--accent-gold)" }}
        >
          Xem tất cả <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div
        className="flex gap-4 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory hide-scrollbar"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <style dangerouslySetInnerHTML={{ __html: `
          .hide-scrollbar::-webkit-scrollbar { display: none; }
        `}} />
        
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : events.map((event) => (
              <Link
                key={event.id}
                href={`/events`}
                className="shrink-0 w-[240px] md:w-[280px] group snap-start block outline-none ring-0"
                style={{ textDecoration: "none" }}
              >
                <div
                  className="h-[180px] rounded-2xl border flex flex-col overflow-hidden relative"
                  style={{
                    background: "var(--card-light-bg)",
                    borderColor: "var(--card-light-border)",
                    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--accent-gold)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--card-light-border)";
                  }}
                >
                  {/* Background Image / Placeholder */}
                  <div className="h-[80px] relative w-full border-b" style={{ borderColor: "var(--card-light-border)", background: "var(--bg-deep)" }}>
                     {isValidUrl(event.imageUrl) ? (
                        <Image
                          src={event.imageUrl!}
                          alt={event.title}
                          fill
                          className="object-cover opacity-[0.85]"
                        />
                     ) : (
                        <div className="w-full h-full flex items-center justify-center opacity-20">
                           <BankIcon className="w-8 h-8" />
                        </div>
                     )}
                     {/* Gradient overlay */}
                     <div className="absolute inset-0 bg-gradient-to-t from-[var(--card-light-bg)] via-[var(--card-light-bg)]/80 to-transparent" />
                  </div>
                  
                  <div className="p-4 flex-1 flex flex-col relative z-10 -mt-6">
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5 drop-shadow-sm" style={{ color: "var(--accent-gold)" }}>
                      {event.year > 0 ? `Năm ${event.year}` : `Năm ${Math.abs(event.year)} TCN`}
                    </p>
                    <h3 className="text-base font-bold line-clamp-1 mb-1.5" style={{ color: "var(--content-heading)" }}>
                      {event.title}
                    </h3>
                    <p className="text-xs line-clamp-2" style={{ color: "var(--content-muted)", lineHeight: 1.5 }}>
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
             className="w-full text-center py-10 rounded-2xl border border-dashed"
             style={{ borderColor: "var(--card-light-border)", color: "var(--content-muted)" }}
          >
             <p className="text-sm">Chưa có sự kiện nào.</p>
          </div>
        )}
      </div>
    </section>
  );
}
