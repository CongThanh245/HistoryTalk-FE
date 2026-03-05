"use client";

import { MessageSquare } from "lucide-react";
import { DarkCard, Card } from "@/components/commons/card";
import Image from "next/image";

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

// ── Carousel card — nền tối, dùng DarkCard ───────────────

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

// ── Compact card — dùng trong sidebar popup ───────────────

interface CompactCardProps {
  character: Character;
  onClick: (id: string) => void;
}

export function CharacterCompactCard({ character, onClick }: CompactCardProps) {
  // Kiểm tra an toàn: nếu không có character hoặc không có id thì hiện tên trống
  if (!character) return null;

  // Đảm bảo src luôn là một string hợp lệ hoặc null
  const avatarSrc =
    character.avatarUrl || (character.id ? `/ngo-quyen.jpg` : null);

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
        style={{
          background: "var(--accent-gold)",
          color: "var(--bg-deep)",
        }}
      >
        {/* Chỉ render Image nếu avatarSrc thực sự tồn tại */}
        {avatarSrc ? (
          <Image
            src={avatarSrc}
            alt={character.name || "Avatar"}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-110"
            // Thêm cái này để xử lý nếu file ảnh không tồn tại trong thư mục public
            onError={(e) => {
              // Nếu ảnh lỗi (404), ẩn ảnh đi để hiện chữ cái đầu
              (e.target as any).style.display = "none";
            }}
            style={{zIndex: 1}}
          />
        ) : null}

        {/* Chữ cái đầu sẽ luôn nằm dưới ảnh, nếu ảnh lỗi hoặc không có sẽ lộ ra */}
        <span className="relative z-0">{character.name?.charAt(0) || "?"}</span>
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
