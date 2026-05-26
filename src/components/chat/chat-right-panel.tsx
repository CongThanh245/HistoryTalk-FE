"use client";

import Image from "next/image";
import { ChatTextIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import type { ChatCharacter } from "@/services/chat.service";
import { characterService } from "@/services/character.service";
import { queryKeys } from "@/shared/query-key";
import { isValidUrl } from "@/lib/utils/url";

import { cn } from "@/lib/utils/cn";

interface ChatRightPanelProps {
  activeCharacter: ChatCharacter;
  onSelectCharacter: (character: ChatCharacter) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export function ChatRightPanel({
  activeCharacter,
  onSelectCharacter,
  isOpen,
  setIsOpen,
}: ChatRightPanelProps) {
  const { data: characters = [], isLoading } = useQuery({
    queryKey: queryKeys.characters.byContext(activeCharacter.contextId ?? ""),
    queryFn: () => characterService.getByContext(activeCharacter.contextId!),
    enabled: !!activeCharacter.contextId,
    staleTime: 1000 * 60 * 5,
    select: (data) =>
      data.map(
        (c): ChatCharacter => ({
          id: c.id,
          name: c.name,
          title: c.title,
          description: c.background,
          imageUrl: isValidUrl(c.imageUrl) ? c.imageUrl : "/card.jpg",
          modelUrl: c.modelUrl ?? null,
          side: c.side,
          contextId: c.contextId ?? activeCharacter.contextId,
        }),
      ),
  });

  const otherCharacters = characters.filter((c) => c.id !== activeCharacter.id);

  return (
    <>
      {/* Backdrop on mobile */}
      <div
        className={cn(
          "lg:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-[2px] transition-opacity duration-300",
          isOpen ? "opacity-100 visible" : "opacity-0 invisible"
        )}
        onClick={() => setIsOpen(false)}
      />

      <div
        className={cn(
          "shrink-0 h-full flex flex-col transition-transform duration-300 z-50 border-l overflow-hidden",
          "lg:relative absolute right-0 top-0 bottom-0 shadow-2xl lg:shadow-none w-[260px]",
          isOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0",
        )}
        style={{
          background: "var(--abyssal-blue)",
          borderColor: "var(--border-default)",
        }}
      >
        {/* Active character info */}
        <div className="shrink-0">
          <div className="relative w-full h-52 overflow-hidden">
            <Image
              src={isValidUrl(activeCharacter.imageUrl) ? activeCharacter.imageUrl! : "/card.jpg"}
              alt={activeCharacter.name}
              fill
              className="object-cover object-top"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to bottom, transparent 40%, var(--abyssal-blue) 100%)",
              }}
            />
            {activeCharacter.side && (
              <div className="absolute top-3 right-3">
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{
                    background: "rgba(201,162,77,0.2)",
                    color: "var(--accent-gold)",
                    backdropFilter: "blur(4px)",
                    border: "1px solid rgba(201,162,77,0.3)",
                  }}
                >
                  {activeCharacter.side}
                </span>
              </div>
            )}
          </div>

          <div
            className="px-4 pt-1 pb-4 border-b"
            style={{ borderColor: "var(--border-default)" }}
          >
            <h3
              className="text-base font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              {activeCharacter.name}
            </h3>
            <p
              className="text-[11px] mt-0.5 mb-3"
              style={{ color: "var(--accent-gold-soft)" }}
            >
              {activeCharacter.title}
            </p>
            <p
              className="text-[12px] leading-relaxed line-clamp-4"
              style={{ color: "var(--text-secondary)" }}
            >
              {activeCharacter.description}
            </p>
          </div>
        </div>

        {/* Other characters */}
        <div className="flex-1 overflow-y-auto px-3 py-3">
          <p
            className="text-[10px] font-bold uppercase tracking-widest px-1 mb-2"
            style={{ color: "var(--text-secondary)" }}
          >
            Nhân vật khác
          </p>

          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-16 rounded-xl animate-pulse"
                  style={{ background: "rgba(255,255,255,0.05)" }}
                />
              ))}
            </div>
          ) : otherCharacters.length === 0 ? (
            <p
              className="text-[11px] text-center py-4"
              style={{ color: "var(--text-secondary)" }}
            >
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
                  <div className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0">
                    <Image
                      src={isValidUrl(char.imageUrl) ? char.imageUrl! : "/card.jpg"}
                      alt={char.name}
                      fill
                      className="object-cover object-top"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-xs font-semibold truncate group-hover:text-[var(--accent-gold)] transition-colors"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {char.name}
                    </p>
                    <p
                      className="text-[10px] truncate mt-0.5"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {char.title}
                    </p>
                    {char.side && (
                      <span
                        className="text-[9px] font-medium"
                        style={{ color: "var(--accent-gold)", opacity: 0.7 }}
                      >
                        {char.side}
                      </span>
                    )}
                  </div>
                  <ChatTextIcon
                    className="w-4 h-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: "var(--accent-gold)" }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
