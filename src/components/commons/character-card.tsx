"use client";

import Image from "next/image";
import { MessageSquare } from "lucide-react";

// ── Types ─────────────────────────────────────────────────

export interface Character {
  id: string;
  name: string;
  title: string;
  era: string;
  role?: string;
  side?: string;
  avatarUrl?: string;
  imageUrl?: string;
}

// ── Variant: Carousel card (dùng trong Carousel3DVertical + CharactersReveal) ─

interface CarouselCardProps {
  character: Character;
  priority?: boolean;
  onClick?: (id: string) => void;
}

export function CharacterCarouselCard({ character, priority = false, onClick }: CarouselCardProps) {
  return (
    <div className="w-full h-full cursor-pointer group" onClick={() => onClick?.(character.id)}>
      <div
        className="w-full h-full rounded-[var(--radius-lg)] overflow-hidden border transition-all duration-300
          group-hover:border-[var(--accent-gold)] group-hover:shadow-[0_10px_40px_rgba(201,162,77,0.2)]"
        style={{
          background: "var(--bg-surface)",
          borderColor: "var(--border-default)",
          boxShadow: "var(--shadow-strong)",
        }}
      >
        {/* Image */}
        <div className="relative w-full h-[65%] overflow-hidden" style={{ background: "var(--bg-elevated)" }}>
          <Image
            src={character.imageUrl ?? "/card.jpg"} // ← dùng card.jpg
            alt={character.name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            priority={priority}
          />
          {/* Era badge */}
          <div
            className="absolute top-3 right-3 px-2 py-1 rounded-md border z-10"
            style={{ background: "rgba(14,26,43,0.8)", backdropFilter: "blur(4px)", borderColor: "var(--border-default)" }}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--accent-gold)" }}>
              {character.era}
            </span>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-surface)] via-transparent to-transparent z-10" />
        </div>

        {/* Info */}
        <div className="p-4 space-y-1 flex-1">
          <h3
            className="text-base font-bold line-clamp-1 transition-colors group-hover:text-[var(--accent-gold)]"
            style={{ color: "var(--text-primary)" }}
          >
            {character.name}
          </h3>
          <p className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
            {character.role ?? character.title}
          </p>
          {character.side && (
            <span
              className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: "rgba(201,162,77,0.15)", color: "var(--accent-gold-soft)" }}
            >
              {character.side}
            </span>
          )}
          <div className="pt-2 flex items-center gap-2">
            <div className="h-px flex-1" style={{ background: "linear-gradient(to right, rgba(201,162,77,0.5), transparent)" }} />
            <span
              className="text-[10px] uppercase font-bold opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0"
              style={{ color: "var(--accent-gold)" }}
            >
              Chat ngay
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Variant: Compact (dùng trong sidebar info của popup) ──

interface CompactCardProps {
  character: Character;
  onClick: (id: string) => void;
}

export function CharacterCompactCard({ character, onClick }: CompactCardProps) {
  return (
    <button
      onClick={() => onClick(character.id)}
      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border text-left
        transition-all duration-150 cursor-pointer group hover:border-[var(--accent-gold)]"
      style={{ background: "var(--card-light-bg)", borderColor: "var(--card-light-border)" }}
    >
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
        style={{
          background: "linear-gradient(135deg, var(--accent-gold) 0%, var(--truffle) 100%)",
          color: "var(--bg-deep)",
        }}
      >
        {character.name.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold truncate" style={{ color: "var(--content-heading)" }}>
          {character.name}
        </p>
        <p className="text-[10px] truncate" style={{ color: "var(--content-muted)" }}>
          {character.role ?? character.title}
        </p>
      </div>
      <MessageSquare
        className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
        style={{ color: "var(--accent-gold)" }}
      />
    </button>
  );
}