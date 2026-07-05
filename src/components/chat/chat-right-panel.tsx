"use client";

import Image from "next/image";
import { ChatTextIcon, BankIcon } from "@phosphor-icons/react";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ChatCharacter } from "@/services/chat.service";
import { characterService } from "@/services/character.service";
import { queryKeys } from "@/shared/query-key";
import { isValidUrl } from "@/lib/utils/url";
import { HistoricalContextHoverCard } from "@/components/commons/historical-context-hover-card";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";

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
  const disableSheetAnimationOnDesktop = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth >= 768;
  }, []);
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

  // Content for both desktop and mobile
  const renderContent = () => (
    <div className="flex-1 min-h-0 overflow-y-auto">
      {/* Active character info */}
      <div>
        <div className="relative w-full h-56 overflow-hidden md:h-80">
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
                "linear-gradient(to bottom, transparent 40%, var(--bg-surface) 100%)",
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
            className="text-[11px] mt-0.5 mb-2"
            style={{ color: "var(--accent-gold-soft)" }}
          >
            {activeCharacter.title}
          </p>
          {activeCharacter.contexts && activeCharacter.contexts.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mb-3">
              {activeCharacter.contexts.map((ctx) => (
                <HistoricalContextHoverCard
                  key={ctx.contextId}
                  contextId={ctx.contextId}
                  fallbackLabel={ctx.name}
                >
                  <span
                    className="inline-flex max-w-full items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors cursor-pointer"
                    style={{
                      background: "var(--card-light-hover)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    <BankIcon
                      className="w-3.5 h-3.5 shrink-0"
                      style={{ color: "var(--accent-gold)" }}
                    />
                    <span className="truncate">{ctx.name}</span>
                  </span>
                </HistoricalContextHoverCard>
              ))}
            </div>
          )}
          <p
            className="text-[12px] leading-relaxed line-clamp-4"
            style={{ color: "var(--text-secondary)" }}
          >
            {activeCharacter.description}
          </p>
        </div>
      </div>

      {/* Other characters */}
      <div className="px-3 py-3">
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
                style={{ background: "var(--card-light-hover)" }}
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
                onClick={() => {
                  onSelectCharacter(char);
                  setIsOpen(false); // Close on mobile
                }}
                className="group w-full flex items-center gap-3 p-2.5 rounded-xl border text-left cursor-pointer transition-all duration-150 hover:-translate-y-0.5"
                style={{
                  background: "var(--bg-elevated)",
                  borderColor: "var(--border-default)",
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
  );

  return (
    <>
      {/* Desktop: Sidebar */}
      <div
        className={cn(
          "hidden md:flex shrink-0 h-full flex-col transition-transform duration-300 z-50 border-l overflow-hidden",
          "relative w-[260px]",
          isOpen ? "translate-x-0" : "translate-x-0",
        )}
        style={{
          background: "var(--bg-surface)",
          borderColor: "var(--border-default)",
        }}
      >
        {renderContent()}
      </div>

      {/* Mobile: Bottom Sheet */}
      <div className="md:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetContent 
            side="bottom" 
            disableAnimation={disableSheetAnimationOnDesktop}
            disableOverlayAnimation={disableSheetAnimationOnDesktop}
            className="h-[80vh] p-0 border-t"
            style={{
              background: "var(--bg-surface)",
              borderColor: "var(--border-default)",
            }}
          >
            <SheetTitle className="sr-only">Thông tin nhân vật</SheetTitle>
            <div className="flex flex-col h-full">
              {renderContent()}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}

  
