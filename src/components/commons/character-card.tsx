"use client";

import Image from "next/image";
import { MessageSquare, Swords } from "lucide-react";
import { DarkCard } from "@/components/commons/card";

// ── Type dùng chung cho TẤT CẢ nơi dùng Character ────────
// Thay thế cả character-card.tsx lẫn character.service.ts

export interface CharacterEvent {
  id: string;
  title: string;
  year: number;
}

export interface Character {
  id: string;
  name: string;
  title: string; // vd: "Tiết độ sứ Tĩnh Hải quân"
  era: string; // vd: "medieval" hoặc "898–944" tuỳ context
  description?: string;
  lifespan?: string; // vd: "898–944"
  role?: string; // context trong 1 sự kiện cụ thể
  side?: string; // vd: "Đại Việt"
  avatarUrl?: string;
  imageUrl?: string;
  events?: CharacterEvent[];
}

// ─────────────────────────────────────────────────────────
// Variant 1: Carousel card — nền tối, dùng trong Carousel3D + CharactersReveal
// ─────────────────────────────────────────────────────────

interface CarouselCardProps {
  character: Character;
  priority?: boolean;
  onClick?: (id: string) => void;
}

export function CharacterCarouselCard({
  character,
  priority = false,
  onClick,
}: CarouselCardProps) {
  return (
    <DarkCard
      imageSrc={character.imageUrl ?? "/card.jpg"}
      imageAlt={character.name}
      imageHeight="65%"
      badge={{
        label: character.era,
        color: "var(--accent-gold)",
        bg: "transparent",
      }}
      priority={priority}
      onClick={() => onClick?.(character.id)}
    >
      <h3
        className="text-base font-bold line-clamp-1 transition-colors group-hover:text-[var(--accent-gold)]"
        style={{ color: "var(--text-primary)" }}
      >
        {character.name}
      </h3>
      <p
        className="text-xs font-medium mt-0.5"
        style={{ color: "var(--text-secondary)" }}
      >
        {character.role ?? character.title}
      </p>
      {character.side && (
        <span
          className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1.5"
          style={{
            background: "rgba(201,162,77,0.15)",
            color: "var(--accent-gold-soft)",
          }}
        >
          {character.side}
        </span>
      )}
      <div className="mt-auto pt-3 flex items-center gap-2">
        <div
          className="h-px flex-1"
          style={{
            background:
              "linear-gradient(to right, rgba(201,162,77,0.5), transparent)",
          }}
        />
        <span
          className="text-[10px] uppercase font-bold opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0"
          style={{ color: "var(--accent-gold)" }}
        >
          Chat ngay
        </span>
      </div>
    </DarkCard>
  );
}

// ─────────────────────────────────────────────────────────
// Variant 2: Page card — nền sáng, dùng trong trang /characters
// ─────────────────────────────────────────────────────────

interface PageCardProps {
  character: Character;
  onClick: (id: string) => void;
}

export function CharacterPageCard({ character, onClick }: PageCardProps) {
  return (
    <button
      onClick={() => onClick(character.id)}
      className="group relative w-full text-left rounded-xl border overflow-hidden transition-all duration-200 cursor-pointer hover:-translate-y-1"
      style={{
        background: "var(--card-light-bg)",
        borderColor: "var(--card-light-border)",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      }}
    >
      {/* Hover border glow */}
      <div
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10"
        style={{ boxShadow: "inset 0 0 0 1px rgba(201,162,77,0.35)" }}
      />

      {/* Ảnh */}
      <div className="relative w-full h-48 overflow-hidden">
        <Image
          src={character.imageUrl ?? "/card.jpg"}
          alt={character.name}
          fill
          className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 300px"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, transparent 45%, var(--card-light-bg) 100%)",
          }}
        />
        {character.side && (
          <div className="absolute top-3 right-3 z-10">
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm"
              style={{
                background: "rgba(201,162,77,0.18)",
                color: "var(--gold-on-light)",
                border: "1px solid rgba(201,162,77,0.3)",
              }}
            >
              {character.side}
            </span>
          </div>
        )}
        {character.lifespan && (
          <div className="absolute bottom-3 left-3 z-10">
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-md"
              style={{
                background: "rgba(255,255,255,0.85)",
                color: "var(--content-muted)",
                backdropFilter: "blur(4px)",
              }}
            >
              {character.lifespan}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-4 pt-3 pb-4">
        <h3
          className="text-sm font-bold leading-snug mb-0.5 transition-colors group-hover:text-[var(--gold-on-light)]"
          style={{ color: "var(--content-heading)" }}
        >
          {character.name}
        </h3>
        <p
          className="text-[11px] mb-2.5"
          style={{ color: "var(--gold-on-light)" }}
        >
          {character.title}
        </p>

        {character.description && (
          <p
            className="text-xs leading-relaxed line-clamp-2 mb-3"
            style={{ color: "var(--content-muted)" }}
          >
            {character.description}
          </p>
        )}

        {/* Events */}
        {character.events && character.events.length > 0 && (
          <>
            <div
              className="h-px mb-3"
              style={{ background: "var(--card-light-border)" }}
            />
            <div className="space-y-1 mb-3">
              <p
                className="text-[10px] font-bold uppercase tracking-wider mb-1.5"
                style={{ color: "var(--content-subtle)" }}
              >
                Bối cảnh lịch sử
              </p>
              {character.events.slice(0, 2).map((ev) => (
                <div key={ev.id} className="flex items-center gap-1.5">
                  <Swords
                    className="w-3 h-3 shrink-0"
                    style={{ color: "var(--content-subtle)" }}
                  />
                  <span
                    className="text-[11px] truncate"
                    style={{ color: "var(--content-text)" }}
                  >
                    {ev.title}
                  </span>
                  <span
                    className="text-[10px] shrink-0"
                    style={{ color: "var(--content-subtle)" }}
                  >
                    {ev.year < 0 ? `${Math.abs(ev.year)} TCN` : ev.year}
                  </span>
                </div>
              ))}
              {character.events.length > 2 && (
                <p
                  className="text-[10px]"
                  style={{ color: "var(--content-subtle)" }}
                >
                  +{character.events.length - 2} sự kiện khác
                </p>
              )}
            </div>
          </>
        )}

        {/* CTA */}
        <div
          className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg text-xs font-semibold opacity-0 group-hover:opacity-100 transition-all duration-150"
          style={{
            background:
              "linear-gradient(135deg, rgba(201,162,77,0.10) 0%, rgba(163,81,57,0.06) 100%)",
            border: "1px solid rgba(201,162,77,0.2)",
            color: "var(--gold-on-light)",
          }}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Trò chuyện ngay
        </div>
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────
// Variant 3: Compact card — sidebar popup, right panel chat
// ─────────────────────────────────────────────────────────

interface CompactCardProps {
  character: Character;
  onClick: (id: string) => void;
}

export function CharacterCompactCard({ character, onClick }: CompactCardProps) {
  if (!character) return null;
  const avatarSrc = character.avatarUrl ?? character.imageUrl ?? "/ngo-quyen.jpg";

  return (
    <button
      onClick={() => onClick(character.id)}
      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border text-left
        transition-all duration-150 cursor-pointer group hover:border-[var(--accent-gold)]"
      style={{
        background: "var(--card-light-bg)",
        borderColor: "var(--card-light-border)",
      }}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden relative"
        style={{ background: "var(--accent-gold)", color: "var(--bg-deep)" }}
      >
        {avatarSrc && (
          <Image
            src={avatarSrc}
            alt={character.name ?? "Avatar"}
            fill
            className="object-cover z-10"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        )}
        <span className="relative z-0">{character.name?.charAt(0) ?? "?"}</span>
      </div>

      <div className="flex-1 min-w-0">
        <p
          className="text-xs font-semibold truncate"
          style={{ color: "var(--content-heading)" }}
        >
          {character.name}
        </p>
        <p
          className="text-[10px] truncate"
          style={{ color: "var(--content-muted)" }}
        >
          {character.role ?? character.title}
        </p>
      </div>

      <MessageSquare
        className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all shrink-0"
        style={{ color: "var(--accent-gold)" }}
      />
    </button>
  );
}

// ─────────────────────────────────────────────────────────
// Skeleton — dùng khi loading trang /characters
// ─────────────────────────────────────────────────────────

export function CharacterPageCardSkeleton() {
  return (
    <div
      className="w-full rounded-xl border overflow-hidden animate-pulse"
      style={{
        background: "var(--card-light-bg)",
        borderColor: "var(--card-light-border)",
      }}
    >
      <div
        className="w-full h-48"
        style={{ background: "var(--card-light-border)" }}
      />
      <div className="px-4 pt-3 pb-4 space-y-2">
        <div
          className="h-4 w-2/3 rounded"
          style={{ background: "var(--card-light-border)" }}
        />
        <div
          className="h-3 w-1/2 rounded"
          style={{ background: "var(--card-light-border)" }}
        />
        <div
          className="h-3 w-full rounded"
          style={{ background: "var(--card-light-border)" }}
        />
        <div
          className="h-3 w-5/6 rounded"
          style={{ background: "var(--card-light-border)" }}
        />
        <div
          className="h-px w-full"
          style={{ background: "var(--card-light-border)" }}
        />
        <div
          className="h-3 w-1/3 rounded"
          style={{ background: "var(--card-light-border)" }}
        />
        <div
          className="h-3 w-4/5 rounded"
          style={{ background: "var(--card-light-border)" }}
        />
      </div>
    </div>
  );
}
