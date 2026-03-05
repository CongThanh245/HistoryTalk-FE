"use client";

import { X, MapPin, Calendar } from "lucide-react";
import type { HistoricalEvent, EventCategory } from "@/services/event.service";

const CATEGORY_LABEL: Record<EventCategory, string> = {
  war: "Chiến tranh", politics: "Chính trị", culture: "Văn hoá",
  science: "Khoa học", religion: "Tôn giáo", other: "Khác",
};
const CATEGORY_COLOR: Record<EventCategory, string> = {
  war: "var(--accent-danger)", politics: "var(--accent-gold)",
  culture: "var(--accent-blue)", science: "var(--accent-teal)",
  religion: "var(--accent-bronze)", other: "var(--content-muted)",
};

interface EventDetailDrawerProps {
  event: HistoricalEvent | null;
  onClose: () => void;
}

export function EventDetailDrawer({ event, onClose }: EventDetailDrawerProps) {
  if (!event) return null;

  const color = CATEGORY_COLOR[event.category];
  const yearLabel = event.yearLabel ?? `${Math.abs(event.year)} ${event.year < 0 ? "TCN" : "SCN"}`;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div
        className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md flex flex-col shadow-2xl"
        style={{ background: "var(--card-light-bg)", borderLeft: "1px solid var(--card-light-border)" }}
      >
        <div className="flex items-start justify-between p-6 border-b" style={{ borderColor: "var(--card-light-border)" }}>
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${color}18`, color }}>
                {yearLabel}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: "var(--card-light-border)", color: "var(--content-muted)" }}>
                {CATEGORY_LABEL[event.category]}
              </span>
            </div>
            <h2 className="text-lg font-bold leading-snug" style={{ color: "var(--content-heading)" }}>
              {event.title}
            </h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors cursor-pointer hover:bg-black/5" style={{ color: "var(--content-muted)" }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" style={{ color }} />
              <span className="text-xs font-medium" style={{ color: "var(--content-text)" }}>{yearLabel}</span>
            </div>
            {event.location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" style={{ color: "var(--content-subtle)" }} />
                <span className="text-xs" style={{ color: "var(--content-text)" }}>{event.location}</span>
              </div>
            )}
          </div>

          <div style={{ height: 1, background: "var(--card-light-border)" }} />

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--content-subtle)" }}>Tóm tắt</h4>
            <p className="text-sm leading-relaxed" style={{ color: "var(--content-text)" }}>{event.summary}</p>
          </div>

          {/* TODO: thêm field khi có API — detail, relatedCharacters, images... */}
        </div>

        <div className="p-4 border-t" style={{ borderColor: "var(--card-light-border)" }}>
          <button
            className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 cursor-pointer"
            style={{ background: `${color}18`, border: `1px solid ${color}40`, color }}
          >
            {/* TODO: navigate đến /events/[id] */}
            Khám phá thêm →
          </button>
        </div>
      </div>
    </>
  );
}