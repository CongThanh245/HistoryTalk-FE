"use client";

// components/historical-map/EventDetailPanel.tsx
// Panel chi tiết sự kiện + danh sách nhân vật liên quan

import React from "react";
import { ArrowLeft, Users, Calendar, Sword } from "lucide-react";
import { MOCK_CONTEXT_EVENTS } from "@/services/landmark.service";
import { useEventCharacters } from "@/features/landmark/hooks";
import { formatCharacterLifespan } from "@/lib/utils/character-date";

interface EventDetailPanelProps {
  contextId: string;
  onBack: () => void;
}

export function EventDetailPanel({ contextId, onBack }: EventDetailPanelProps) {
  const event = MOCK_CONTEXT_EVENTS[contextId];
  // TODO: thay MOCK_CONTEXT_EVENTS bằng useQuery khi có API GET /historical-contexts/:id
  const { data: characters = [], isLoading } = useEventCharacters(contextId);

  if (!event) return null;

  return (
    <div className="flex flex-col h-full bg-[var(--bg-content)]">
      {/* Back button + header */}
      <div className="flex-shrink-0 p-4 border-b border-card-light-border">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm mb-3 transition-colors hover:opacity-70 text-accent-gold"
        >
          <ArrowLeft size={14} />
          Quay lại
        </button>

        <div className="flex items-center gap-2 mb-2 text-content-muted">
          <Calendar size={13} />
          <span className="text-xs font-medium">
            Năm {event.year < 0 ? `${Math.abs(event.year)} TCN` : event.year}
          </span>
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--accent-gold-active-bg)] text-accent-gold">
            {event.era === "ANCIENT"
              ? "Cổ đại"
              : event.era === "MEDIEVAL"
                ? "Trung đại"
                : event.era === "MODERN"
                  ? "Cận đại"
                  : "Hiện đại"}
          </span>
        </div>

        <h2 className="text-lg font-bold mb-2 text-content-heading">
          {event.name}
        </h2>
        <p className="text-sm leading-relaxed text-content-text">
          {event.description}
        </p>
      </div>

      {/* Characters section */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-3 flex items-center gap-2 border-b border-card-light-border">
          <Users size={14} className="text-accent-gold" />
          <span className="text-sm font-semibold text-content-heading">
            Nhân vật liên quan
          </span>
        </div>

        <div className="p-3">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="flex gap-3 p-3 animate-pulse rounded-xl bg-card-light-bg"
                >
                  <div className="w-12 h-12 rounded-full flex-shrink-0 bg-bg-surface" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-4 rounded bg-bg-surface w-[60%]" />
                    <div className="h-3 rounded bg-bg-surface w-[40%]" />
                  </div>
                </div>
              ))}
            </div>
          ) : characters.length === 0 ? (
            // Fallback khi chưa có API thật
            <div className="text-center py-8 rounded-xl bg-card-light-bg border border-card-light-border">
              <Sword
                size={24}
                className="mx-auto mb-2 opacity-30 text-content-muted"
              />
              <p className="text-sm text-content-muted">
                Dữ liệu nhân vật đang được cập nhật
              </p>
              <p className="text-xs mt-1 text-content-subtle">
                API: GET /characters/context/{contextId}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {characters.map((char) => (
                <div
                  key={char.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-card-light-bg border border-card-light-border"
                >
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-amber-100">
                    {char.avatarUrl ? (
                      <img
                        src={char.avatarUrl}
                        alt={char.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-lg font-bold bg-[var(--accent-gold-active-bg)] text-accent-gold">
                        {char.name[0]}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-content-heading">
                      {char.name}
                    </p>
                    <p className="text-xs text-accent-gold">
                      {char.title}
                    </p>
                    <p className="text-xs mt-0.5 text-content-muted">
                      {formatCharacterLifespan(char)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
