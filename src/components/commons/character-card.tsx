"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ChatTextIcon } from "@phosphor-icons/react";
import { DarkCard } from "@/components/commons/card";
import { isValidUrl } from "@/lib/utils/url";

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
  lifespan?: string; // vd: "898–944"
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
}

export function CharacterCarouselCard({
  character,
  priority = false,
  onClick,
}: CarouselCardProps) {
  return (
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
      setDisplayedText("");
      return;
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

function getChatCount(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const count = Math.abs(hash % 160) + 15; // range: 15K - 175K
  return `${count.toFixed(1)}K`;
}

export function CharacterPageCard({ character, onClick }: PageCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const avatarSrc = isValidUrl(character.avatarUrl)
    ? character.avatarUrl!
    : (isValidUrl(character.imageUrl) ? character.imageUrl! : "/ngo-quyen.jpg");

  return (
    <button
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onClick(character.id)}
      className="group relative w-full h-[400px] flex flex-col justify-end text-left rounded-xl border overflow-hidden transition-all duration-300 cursor-pointer hover:-translate-y-1.5"
      style={{
        background: "var(--card-light-bg)",
        borderColor: "var(--card-light-border)",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
      }}
    >
      {/* Background Image & Gradient overlay */}
      <div className="absolute inset-0 w-full h-full z-0">
        <Image
          src={isValidUrl(character.imageUrl) ? character.imageUrl! : "/card.jpg"}
          alt={character.name}
          fill
          className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 300px"
        />
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.4) 55%, transparent 100%)",
          }}
        />
      </div>

      {/* Badges */}
      {character.side && (
        <div className="absolute top-3 right-3 z-10">
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm"
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
      {character.lifespan && (
        <div className="absolute top-3 left-3 z-10">
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-md"
            style={{
              background: "rgba(0,0,0,0.55)",
              color: "#ffffff",
              backdropFilter: "blur(4px)",
            }}
          >
            {character.lifespan}
          </span>
        </div>
      )}

      {/* Normal State Text Content */}
      <div className="relative px-4 pb-5 pt-20 z-20 text-white mt-auto pointer-events-none transition-opacity duration-300 group-hover:opacity-0">
        <h3 className="text-base font-bold leading-snug mb-1 text-white">
          {character.name}
        </h3>
        <div className="flex items-center gap-1.5 text-xs text-neutral-300 font-semibold mb-2">
          <ChatTextIcon className="w-3.5 h-3.5 text-[var(--accent-gold)]" />
          <span>{getChatCount(character.id)}</span>
          <span className="text-neutral-400 font-normal">· {character.title}</span>
        </div>
        {character.description && (
          <p className="text-[11px] leading-relaxed text-neutral-300 line-clamp-2">
            {character.description}
          </p>
        )}
      </div>

      {/* Hover State Overlay */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-300 z-30 flex flex-col p-4 bg-neutral-950/85 backdrop-blur-[4px] text-white">
        {/* Avatar top left */}
        <div className="flex items-start mb-4">
          <div className="relative w-12 h-12 rounded-full border-2 border-white overflow-hidden shadow-md">
            <Image
              src={avatarSrc}
              alt={character.name}
              fill
              className="object-cover"
            />
          </div>
        </div>

        {/* Description text with typewriter effect */}
        <div className="flex-1 text-xs leading-relaxed overflow-y-auto pr-1 text-neutral-200 font-medium">
          <TypewriterText text={character.description ?? ""} isHovered={isHovered} />
        </div>

        {/* Button Trò chuyện ngay */}
        <div className="mt-4">
          <div className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-full text-xs font-bold bg-white text-black hover:bg-neutral-200 transition-colors shadow-lg">
            <ChatTextIcon className="w-4 h-4 fill-current text-black" />
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
  const avatarSrc = isValidUrl(character.avatarUrl) ? character.avatarUrl : (isValidUrl(character.imageUrl) ? character.imageUrl : "/ngo-quyen.jpg");

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
