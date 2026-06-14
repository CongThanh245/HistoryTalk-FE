"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ChatTextIcon } from "@phosphor-icons/react";
import { DarkCard } from "@/components/commons/card";
import { isValidUrl } from "@/lib/utils/url";
import { formatCharacterLifespan } from "@/lib/utils/character-date";

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
  era?: string; // vd: "medieval" hoặc "898–944" tuỳ context
  description?: string;
  bornYear?: number | null;
  bornMonth?: number | null;
  bornDay?: number | null;
  isBornBc?: boolean;
  deathYear?: number | null;
  deathMonth?: number | null;
  deathDay?: number | null;
  isDeathBc?: boolean;
  role?: string; // context trong 1 sự kiện cụ thể
  side?: string; // vd: "Đại Việt"
  avatarUrl?: string | null;
  imageUrl?: string | null;
  events?: CharacterEvent[];
}

// ─────────────────────────────────────────────────────────
// Variant 1: Carousel card — nền tối, dùng trong Carousel3D + CharactersReveal
// ─────────────────────────────────────────────────────────

interface CarouselCardProps {
  character: Character;
  priority?: boolean;
  onClick?: (id: string) => void;
  interaction?: "overlay" | "flip";
  onHoverChange?: (isHovered: boolean) => void;
}

export function CharacterCarouselCard({
  character,
  priority = false,
  onClick,
  interaction = "overlay",
  onHoverChange,
}: CarouselCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const avatarSrc = isValidUrl(character.avatarUrl)
    ? character.avatarUrl!
    : (isValidUrl(character.imageUrl) ? character.imageUrl! : undefined);

  const setHovered = (value: boolean) => {
    setIsHovered(value);
    onHoverChange?.(value);
  };

  if (interaction === "flip") {
    return (
      <button
        type="button"
        aria-label={`Trò chuyện với ${character.name}`}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onFocus={() => setHovered(true)}
        onBlur={() => setHovered(false)}
        onClick={() => onClick?.(character.id)}
        className="relative h-full w-full cursor-pointer overflow-hidden rounded-[var(--radius-lg)] text-left"
      >
        <DarkCard
          imageSrc={isValidUrl(character.imageUrl) ? character.imageUrl! : "/card.jpg"}
          imageAlt={character.name}
          imageHeight="65%"
          badge={{ label: character.era ?? "", color: "var(--accent-gold)", bg: "transparent" }}
          priority={priority}
          hoverEffects={false}
        >
          <h3 className="line-clamp-1 text-base font-bold text-[var(--text-primary)]">
            {character.name}
          </h3>
          <p className="mt-0.5 text-xs font-medium text-[var(--text-secondary)]">
            {character.role ?? character.title}
          </p>
        </DarkCard>
      </button>
    );
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onClick?.(character.id)}
      className="group relative w-full h-full rounded-[var(--radius-lg)] overflow-hidden cursor-pointer"
    >
      <DarkCard
        imageSrc={isValidUrl(character.imageUrl) ? character.imageUrl! : "/card.jpg"}
        imageAlt={character.name}
        imageHeight="65%"
        badge={{
          label: character.era ?? "",
          color: "var(--accent-gold)",
          bg: "transparent",
        }}
        priority={priority}
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
            className="inline-block w-fit text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1.5"
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

      {/* Hover State Overlay */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-300 z-30 flex flex-col p-4 bg-neutral-950/85 backdrop-blur-[6px] text-white"
      >
        {/* Avatar top left */}
        <div className="flex items-start mb-4">
          <div className="relative w-12 h-12 rounded-full border-2 border-[var(--accent-gold)] overflow-hidden shadow-md shrink-0">
            {avatarSrc ? (
              <Image
                src={avatarSrc}
                alt={character.name}
                fill
                className="object-cover"
                sizes="48px"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center bg-[var(--accent-gold)] text-sm font-bold text-[var(--bg-deep)]">
                {character.name?.charAt(0) ?? "?"}
              </span>
            )}
          </div>
          <div className="ml-3 min-w-0">
            <h4 className="text-sm font-bold text-white leading-tight truncate">
              {character.name}
            </h4>
            {character.era && (
              <p className="text-[10px] text-[var(--accent-gold-soft)] font-medium mt-0.5 truncate">
                {character.era}
              </p>
            )}
          </div>
        </div>

        {/* Description text with typewriter effect */}
        <div className="flex-1 text-xs leading-relaxed overflow-y-auto pr-1 text-neutral-200 font-medium">
          <TypewriterText text={character.description ?? ""} isHovered={isHovered} />
        </div>

        {/* Button Trò chuyện ngay */}
        <div className="mt-4">
          <div
            className="flex items-center justify-center gap-1.5 w-full py-3 rounded-full text-xs font-extrabold transition-all shadow-lg hover:brightness-110"
            style={{
              background: "linear-gradient(135deg, var(--accent-gold) 0%, var(--accent-gold-soft) 100%)",
              color: "var(--text-inverse)",
              boxShadow: "0 12px 26px var(--accent-gold-glow)",
            }}
          >
            <ChatTextIcon className="w-4 h-4 fill-current" />
            Trò chuyện ngay
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Variant 2: Page card — nền sáng, dùng trong trang /characters
// ─────────────────────────────────────────────────────────

interface PageCardProps {
  character: Character;
  onClick: (id: string) => void;
}

interface TypewriterTextProps {
  text: string;
  isHovered: boolean;
  speed?: number;
}

export function TypewriterText({ text, isHovered, speed = 8 }: TypewriterTextProps) {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    if (!isHovered) {
      const timeoutId = window.setTimeout(() => setDisplayedText(""), 0);
      return () => window.clearTimeout(timeoutId);
    }

    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayedText(text.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, isHovered, speed]);

  return <span>{displayedText}</span>;
}

export function CharacterPageCard({ character, onClick }: PageCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const lifespan = formatCharacterLifespan(character);

  const avatarSrc = isValidUrl(character.avatarUrl)
    ? character.avatarUrl!
    : (isValidUrl(character.imageUrl) ? character.imageUrl! : undefined);

  return (
    <button
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onClick(character.id)}
      className="group relative h-[340px] w-full flex flex-col text-left rounded-xl border overflow-hidden transition-all duration-300 cursor-pointer hover:-translate-y-1.5 sm:h-[370px]"
      style={{
        background: "var(--card-light-bg)",
        borderColor: "var(--card-light-border)",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
      }}
    >
      {/* Image */}
      <div className="relative z-0 h-[70%] w-full overflow-hidden bg-black">
        <Image
          src={isValidUrl(character.imageUrl) ? character.imageUrl! : "/card.jpg"}
          alt=""
          fill
          aria-hidden="true"
          className="object-cover object-center scale-110 blur-xl opacity-70"
          sizes="220px"
        />
        <div className="absolute inset-0 bg-black/18" />
        <Image
          src={isValidUrl(character.imageUrl) ? character.imageUrl! : "/card.jpg"}
          alt={character.name}
          fill
          className="object-contain object-center scale-[1.1] transition-transform duration-500 group-hover:scale-[1.14]"
          sizes="220px"
        />
      </div>

      {/* Badges */}
      {character.side && (
      <div className="absolute top-2.5 sm:top-3 right-2.5 sm:right-3 z-10">
          <span
            className="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm"
            style={{
              background: "rgba(201,162,77,0.3)",
              color: "#ffffff",
              border: "1px solid rgba(201,162,77,0.5)",
            }}
          >
            {character.side}
          </span>
        </div>
      )}
      <div className="absolute top-2.5 sm:top-3 left-2.5 sm:left-3 z-10">
        <span
          className="text-[9px] sm:text-[10px] font-semibold px-2 py-0.5 rounded-md"
          style={{
            background: "rgba(0,0,0,0.55)",
            color: "#ffffff",
            backdropFilter: "blur(4px)",
          }}
        >
          {lifespan}
        </span>
      </div>

      {/* Normal State Text Content */}
      <div className="relative z-20 flex h-[30%] flex-col justify-center bg-black px-3 text-white pointer-events-none transition-all duration-300 group-hover:opacity-0 sm:h-[30%] sm:px-4">
        <h3 className="text-sm sm:text-base font-bold leading-snug mb-1.5 line-clamp-1 text-white drop-shadow-sm">
          {character.name}
        </h3>
        <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold min-w-0 text-white/70">
          <ChatTextIcon className="w-3.5 h-3.5 text-[var(--accent-gold)]" />
          <span className="text-neutral-400 font-normal truncate">{character.title}</span>
        </div>
        {character.description && (
          <p className="mt-1.5 text-[10px] sm:text-[11px] leading-snug text-white/55 line-clamp-2">
            {character.description}
          </p>
        )}
      </div>

      {/* Hover State Overlay */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-300 z-30 flex flex-col p-3 sm:p-4 bg-black/92 text-white">
        {/* Avatar top left */}
        <div className="flex items-start mb-3 sm:mb-4">
          <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-white overflow-hidden shadow-md">
            {avatarSrc ? (
              <Image
                src={avatarSrc}
                alt={character.name}
                fill
                className="object-cover"
                sizes="48px"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center bg-[var(--accent-gold)] text-sm font-bold text-[var(--bg-deep)]">
                {character.name?.charAt(0) ?? "?"}
              </span>
            )}
          </div>
        </div>

        {/* Description text with typewriter effect */}
        <div className="flex-1 text-[11px] sm:text-xs leading-relaxed overflow-y-auto pr-1 text-neutral-200 font-medium">
          <TypewriterText text={character.description ?? ""} isHovered={isHovered} />
        </div>

        {/* Button Trò chuyện ngay */}
        <div className="mt-3 sm:mt-4">
          <div className="flex items-center justify-center gap-1.5 w-full py-2 sm:py-2.5 rounded-full border text-[11px] sm:text-xs font-bold bg-black text-white hover:bg-black transition-colors shadow-lg border-white/18">
            <ChatTextIcon className="w-4 h-4 fill-current text-[var(--accent-gold)]" />
            Trò chuyện ngay
          </div>
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
  const avatarSrc = isValidUrl(character.avatarUrl) ? character.avatarUrl : (isValidUrl(character.imageUrl) ? character.imageUrl : undefined);

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
            sizes="32px"
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

      <ChatTextIcon
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
        className="w-full h-40 sm:h-48"
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
