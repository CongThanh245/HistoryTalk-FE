"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { MessageSquareText, Landmark, History } from "lucide-react";
import { DarkCard } from "@/components/commons/card";
import { isValidUrl } from "@/lib/utils/url";
import { formatCharacterLifespan } from "@/lib/utils/character-date";
import { HistoricalContextHoverCard } from "@/components/commons/historical-context-hover-card";

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
  contexts?: { contextId: string; name: string }[]; // bối cảnh lịch sử nhân vật thuộc về
}

const chatCtaClassName =
  "flex w-full items-center justify-center gap-2 rounded-[2px] border border-accent-gold bg-accent-gold font-bold uppercase tracking-[0.08em] text-white transition-colors duration-200 group-hover:border-[var(--accent-bronze)] group-hover:bg-[var(--accent-bronze)] group-active:translate-y-px";

const chatCtaIconClassName =
  "flex size-7 items-center justify-center rounded-[2px] bg-[rgba(0,0,0,0.18)] text-white";

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
        className="relative h-full w-full cursor-pointer overflow-hidden rounded-[2px] border border-[var(--text-primary)] text-left transition-colors duration-300 hover:border-accent-gold focus-visible:border-accent-gold"
      >
        <DarkCard
          imageSrc={isValidUrl(character.imageUrl) ? character.imageUrl! : "/card.jpg"}
          imageAlt={character.name}
          imageHeight="68%"
          badge={{ label: character.era ?? "", color: "var(--accent-gold)", bg: "transparent" }}
          priority={priority}
          hoverEffects={false}
        >
          <h3 className="archive-title is-plain line-clamp-1 text-[17px] sm:text-xl">
            {character.name}
          </h3>
          <p className="mt-0.5 line-clamp-1 text-[11px] font-medium text-text-secondary sm:text-xs">
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
      className="group relative w-full h-full rounded-[2px] border border-[var(--text-primary)] overflow-hidden cursor-pointer transition-colors duration-300 hover:border-accent-gold"
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
          className="archive-title is-plain text-xl line-clamp-1 transition-colors group-hover:text-accent-gold"
        >
          {character.name}
        </h3>
        <p
          className="text-xs font-medium mt-0.5 text-text-secondary"
        >
          {character.role ?? character.title}
        </p>
        {character.side && (
          <span
            className="inline-block w-fit text-[10px] font-bold uppercase tracking-[0.1em] px-2 py-0.5 rounded-[2px] mt-1.5 bg-accent-gold-active text-[var(--gold-on-light)]"
          >
            {character.side}
          </span>
        )}
        <div className="mt-auto pt-3 flex items-center gap-2">
          <div
            className="h-px flex-1 bg-[var(--border-strong)]"
          />
          <span
            className="text-[10px] uppercase tracking-[0.1em] font-bold text-accent-gold opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0"
          >
            Chat ngay
          </span>
        </div>
      </DarkCard>

      {/* Hover State Overlay */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-300 z-30 flex flex-col p-4 bg-text-primary/95 text-text-inverse"
      >
        {/* Avatar top left */}
        <div className="flex items-start mb-4">
          <div className="relative w-12 h-12 rounded-full border-2 border-accent-gold overflow-hidden shrink-0">
            {avatarSrc ? (
              <Image
                src={avatarSrc}
                alt={character.name}
                fill
                className="object-cover"
                sizes="48px"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center bg-accent-gold text-sm font-bold text-white">
                {character.name?.charAt(0) ?? "?"}
              </span>
            )}
          </div>
          <div className="ml-3 min-w-0">
            <h4 className="archive-title is-plain text-lg text-text-inverse leading-tight truncate">
              {character.name}
            </h4>
            {character.era && (
              <p className="text-[10px] uppercase tracking-[0.1em] text-accent-on-ink font-bold mt-0.5 truncate">
                {character.era}
              </p>
            )}
          </div>
        </div>

        {/* Description text with typewriter effect */}
        <div className="flex-1 text-xs leading-relaxed overflow-y-auto pr-1 text-text-inverse/85 font-medium">
          <TypewriterText text={character.description ?? ""} isHovered={isHovered} />
        </div>

        {/* Button Trò chuyện ngay */}
        <div className="mt-4">
          <div
            className={`${chatCtaClassName} py-2.5 pr-4 pl-2.5 text-xs`}
          >
            <span className={chatCtaIconClassName}>
              <MessageSquareText className="h-4 w-4 fill-current" />
            </span>
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
  const [imageBroken, setImageBroken] = useState(false);
  const lifespan = formatCharacterLifespan(character);
  const contextLabel = character.contexts
    ?.map((c) => c.name)
    .filter(Boolean)
    .join(" • ");

  const avatarSrc = isValidUrl(character.avatarUrl)
    ? character.avatarUrl!
    : (isValidUrl(character.imageUrl) ? character.imageUrl! : undefined);
  const cardImageSrc =
    !imageBroken && isValidUrl(character.imageUrl) ? character.imageUrl! : "/card.jpg";

  return (
    <button
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onClick(character.id)}
      className="group relative w-full flex flex-col text-left rounded-[2px] border border-[var(--text-primary)] bg-card-bg overflow-hidden transition-colors duration-300 cursor-pointer hover:border-accent-gold focus-visible:border-accent-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)]"
    >
      {/* Image */}
      <div className="relative z-0 aspect-3/4 w-full shrink-0 overflow-hidden bg-[var(--bg-deep)]">
        <Image
          src={cardImageSrc}
          alt=""
          fill
          aria-hidden="true"
          className="object-cover object-top scale-110 blur-xl opacity-70"
          sizes="(max-width: 419px) 100vw, (max-width: 767px) 50vw, (max-width: 1279px) 33vw, 25vw"
        />
        <div className="absolute inset-0 bg-black/18" />
        <Image
          src={cardImageSrc}
          alt={character.name}
          fill
          className="archive-photo object-cover object-top transition-transform duration-500 group-hover:scale-[1.04]"
          sizes="(max-width: 419px) 100vw, (max-width: 767px) 50vw, (max-width: 1279px) 33vw, 25vw"
          onError={() => setImageBroken(true)}
        />
      </div>

      {/* Badges */}
      {character.side && (
      <div className="absolute top-2.5 sm:top-3 right-2.5 sm:right-3 z-10">
          <span
            className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.1em] px-2 py-0.5 rounded-[2px] bg-accent-gold text-white border border-accent-gold"
          >
            {character.side}
          </span>
        </div>
      )}
      {/* Normal State Text Content */}
      <div className="relative z-20 flex flex-col justify-center border-t border-text-primary bg-text-primary px-2.5 py-2.5 text-text-inverse pointer-events-none transition-all duration-300 md:group-hover:opacity-0 sm:px-3.5 sm:py-3">
        <h3 className="archive-title is-plain text-[17px] mb-1 line-clamp-1 text-text-inverse">
          {character.name}
        </h3>
        <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.1em] leading-none text-accent-on-ink sm:text-[10px]">
          {lifespan}
        </p>
        <div className="flex items-center gap-1.5 text-[11px] font-semibold min-w-0 text-text-inverse/70">
          <MessageSquareText className="w-3.5 h-3.5 text-accent-on-ink" />
          <span className="text-text-inverse/85 font-normal truncate">{character.title}</span>
        </div>
        {contextLabel && (
          <div className="mt-1 flex items-center gap-1.5 text-[10px] font-medium min-w-0 text-text-inverse/60">
            <Landmark className="w-3 h-3 text-accent-on-ink shrink-0" />
            <span className="truncate">{contextLabel}</span>
          </div>
        )}
        {character.description && (
          <p className="mt-1 text-[10px] leading-snug text-text-inverse/80 line-clamp-3 sm:line-clamp-3">
            {character.description}
          </p>
        )}
      </div>

      {/* Hover State Overlay */}
      <div className="absolute inset-0 z-30 hidden flex-col bg-text-primary/95 p-3 text-text-inverse opacity-0 transition-all duration-300 group-focus-visible:flex group-focus-visible:opacity-100 md:flex md:group-hover:opacity-100 sm:p-4">
        {/* Avatar + name top left */}
        <div className="flex items-center gap-2.5 mb-2.5 sm:mb-3">
          <div className="relative w-11 h-11 shrink-0 rounded-full border-2 border-text-inverse overflow-hidden sm:w-12 sm:h-12">
            {avatarSrc ? (
              <Image
                src={avatarSrc}
                alt={character.name}
                fill
                className="object-cover"
                sizes="48px"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center bg-accent-gold text-base font-bold text-white">
                {character.name?.charAt(0) ?? "?"}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <h4 className="archive-title is-plain text-lg text-text-inverse leading-tight truncate sm:text-xl">
              {character.name}
            </h4>
            <p className="text-[11px] text-text-inverse/60 truncate sm:text-xs">
              {character.role ?? character.title}
            </p>
          </div>
        </div>

        {/* Detail chips: thời gian sống, phe phái, bối cảnh lịch sử */}
        {(lifespan || character.side || contextLabel) && (
          <div className="flex flex-wrap items-center gap-1 mb-2.5 sm:mb-3">
            {lifespan && (
              <span className="inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-[2px] bg-text-inverse/10 text-accent-on-ink sm:text-[10px]">
                <History className="w-2.5 h-2.5 shrink-0" />
                {lifespan}
              </span>
            )}
            {character.side && (
              <span className="inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-[2px] bg-text-inverse/10 text-text-inverse/80 sm:text-[10px]">
                {character.side}
              </span>
            )}
            {character.contexts?.map((ctx) => (
              <HistoricalContextHoverCard
                key={ctx.contextId}
                contextId={ctx.contextId}
                fallbackLabel={ctx.name}
              >
                <span className="inline-flex max-w-full items-center gap-1 rounded-[2px] bg-text-inverse/10 px-1.5 py-0.5 text-[9px] font-semibold text-text-inverse/80 transition-colors hover:bg-text-inverse/20 hover:text-accent-on-ink sm:text-[10px]">
                  <Landmark className="w-2.5 h-2.5 shrink-0" />
                  <span className="truncate">{ctx.name}</span>
                </span>
              </HistoricalContextHoverCard>
            ))}
          </div>
        )}

        {/* Description text with typewriter effect */}
        <div className="flex-1 text-xs leading-relaxed overflow-y-auto pr-1 text-text-inverse/85 font-medium sm:text-sm">
          <TypewriterText text={character.description ?? ""} isHovered={isHovered} />
        </div>

        {/* Button Trò chuyện ngay */}
        <div className="mt-3 sm:mt-4">
          <div
            className={`${chatCtaClassName} py-1.5 pr-3 pl-1.5 text-xs sm:py-2 sm:pr-4 sm:pl-2 sm:text-sm`}
          >
            <span className={chatCtaIconClassName}>
              <MessageSquareText className="h-4 w-4 fill-current" />
            </span>
            Trò chuyện ngay
          </div>
        </div>
      </div>

      <div className="absolute bottom-2 right-2 z-30 flex h-8 w-8 items-center justify-center rounded-[2px] border border-accent-gold bg-accent-gold text-white sm:h-10 sm:w-10 md:hidden">
        <MessageSquareText className="h-[18px] w-[18px] fill-current text-white" />
        <span className="sr-only">Trò chuyện ngay</span>
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
      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[2px] border border-[var(--border-strong)] bg-card-bg text-left
        transition-colors duration-150 cursor-pointer group hover:border-[var(--text-primary)]"
    >
      <div
        className="w-8 h-8 rounded-[2px] flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden relative bg-accent-gold text-white"
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
          className="archive-title is-plain text-sm truncate"
        >
          {character.name}
        </p>
        <p
          className="text-[10px] truncate text-content-muted"
        >
          {character.role ?? character.title}
        </p>
      </div>

      <MessageSquareText
        className="w-3.5 h-3.5 text-accent-gold opacity-0 group-hover:opacity-100 transition-all shrink-0"
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
      className="w-full rounded-[2px] border border-card-border bg-card-bg overflow-hidden animate-pulse"
    >
      <div className="aspect-3/4 w-full bg-card-border" />
      <div className="px-2.5 py-3 space-y-2 sm:px-4 sm:pt-3 sm:pb-4">
        <div className="h-4 w-2/3 rounded bg-card-border" />
        <div className="h-3 w-1/2 rounded bg-card-border" />
        <div className="h-3 w-full rounded bg-card-border" />
        <div className="h-3 w-5/6 rounded bg-card-border" />
        <div className="h-px w-full bg-card-border" />
        <div className="h-3 w-1/3 rounded bg-card-border" />
        <div className="h-3 w-4/5 rounded bg-card-border" />
      </div>
    </div>
  );
}
