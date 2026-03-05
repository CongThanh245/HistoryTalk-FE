"use client";

import Image from "next/image";
import { MessageSquare } from "lucide-react";
import type { ChatCharacter } from "@/services/chat.service";
import { MOCK_EVENT } from "./chat.mock";

interface ChatRightPanelProps {
  activeCharacter: ChatCharacter;
  onSelectCharacter: (character: ChatCharacter) => void;
}

export function ChatRightPanel({ activeCharacter, onSelectCharacter }: ChatRightPanelProps) {
  const otherCharacters = MOCK_EVENT.characters.filter((c) => c.id !== activeCharacter.id);

  return (
    <div
      className="w-[260px] shrink-0 h-full flex flex-col border-l overflow-hidden"
      style={{ background: "var(--abyssal-blue)", borderColor: "var(--border-default)" }}
    >
      {/* Active character info */}
      <div className="shrink-0">
        {/* Ảnh nhân vật */}
        <div className="relative w-full h-52 overflow-hidden">
          <Image
            src={activeCharacter.imageUrl}
            alt={activeCharacter.name}
            fill
            className="object-cover object-top"
          />
          {/* Gradient */}
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to bottom, transparent 40%, var(--abyssal-blue) 100%)" }}
          />
          {/* Side badge */}
          {activeCharacter.side && (
            <div className="absolute top-3 right-3">
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: "rgba(201,162,77,0.2)", color: "var(--accent-gold)", backdropFilter: "blur(4px)", border: "1px solid rgba(201,162,77,0.3)" }}
              >
                {activeCharacter.side}
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="px-4 pt-1 pb-4 border-b" style={{ borderColor: "var(--border-default)" }}>
          <h3 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
            {activeCharacter.name}
          </h3>
          <p className="text-[11px] mt-0.5 mb-3" style={{ color: "var(--accent-gold-soft)" }}>
            {activeCharacter.title}
          </p>
          <p className="text-[12px] leading-relaxed line-clamp-4" style={{ color: "var(--text-secondary)" }}>
            {activeCharacter.description}
          </p>
        </div>
      </div>

      {/* Other characters */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        <p className="text-[10px] font-bold uppercase tracking-widest px-1 mb-2" style={{ color: "var(--text-secondary)" }}>
          Nhân vật khác
        </p>

        {otherCharacters.length === 0 ? (
          <p className="text-[11px] text-center py-4" style={{ color: "var(--text-secondary)" }}>
            Không có nhân vật nào khác
          </p>
        ) : (
          <div className="space-y-2">
            {otherCharacters.map((char) => (
              <button
                key={char.id}
                onClick={() => onSelectCharacter(char)}
                className="group w-full flex items-center gap-3 p-2.5 rounded-xl border text-left cursor-pointer transition-all duration-150 hover:-translate-y-0.5"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  borderColor: "rgba(255,255,255,0.07)",
                }}
              >
                {/* Avatar */}
                <div className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0">
                  <Image src={char.imageUrl} alt={char.name} fill className="object-cover object-top" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate group-hover:text-[var(--accent-gold)] transition-colors" style={{ color: "var(--text-primary)" }}>
                    {char.name}
                  </p>
                  <p className="text-[10px] truncate mt-0.5" style={{ color: "var(--text-secondary)" }}>
                    {char.title}
                  </p>
                  {char.side && (
                    <span className="text-[9px] font-medium" style={{ color: "var(--accent-gold)", opacity: 0.7 }}>
                      {char.side}
                    </span>
                  )}
                </div>

                <MessageSquare
                  className="w-4 h-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: "var(--accent-gold)" }}
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}