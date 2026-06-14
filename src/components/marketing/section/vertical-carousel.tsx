"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import {
  CaretLeftIcon,
  CaretRightIcon,
  ChatTextIcon,
  XIcon,
} from "@phosphor-icons/react";
import gsap from "gsap";
import {
  CharacterCarouselCard,
  type Character,
} from "@/components/commons/character-card";
import { useCharacters } from "@/features/characters/hooks";
import { useAuthRequiredNavigation } from "@/features/auth/use-auth-required-navigation";
import { isValidUrl } from "@/lib/utils/url";

const SKELETON_COUNT = 5;

type ExpandedCharacter = {
  character: Character;
  sourceRect: DOMRect;
};

function getCardOffset(index: number, selectedIndex: number, count: number) {
  let offset = index - selectedIndex;
  if (offset > count / 2) offset -= count;
  if (offset < -count / 2) offset += count;
  return offset;
}

function getHorizontalGap() {
  if (typeof window === "undefined") return 205;
  if (window.innerWidth < 640) return 105;
  if (window.innerWidth < 768) return 145;
  if (window.innerWidth < 1024) return 185;
  return 225;
}

export function Carousel3DVertical({
  initialCharacters = [],
}: {
  initialCharacters?: Character[];
}) {
  const { authRequiredDialog, navigateWithAuth } = useAuthRequiredNavigation();
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const expandedCardRef = useRef<HTMLDivElement>(null);
  const spotlightRef = useRef<HTMLSpanElement>(null);
  const isClosingRef = useRef(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [gap, setGap] = useState(getHorizontalGap);
  const [expandedCharacter, setExpandedCharacter] =
    useState<ExpandedCharacter | null>(null);

  const { data, isLoading } = useCharacters(
    { page: 1, limit: 6 },
    initialCharacters.length
      ? {
          content: initialCharacters,
          totalElements: initialCharacters.length,
          totalPages: 1,
          currentPage: 1,
          pageSize: initialCharacters.length,
          hasNext: false,
          hasPrevious: false,
        }
      : undefined,
  );

  const figures: Character[] = data?.content ?? [];
  const cardCount = figures.length;
  const activeIndex = cardCount > 0 ? selectedIndex % cardCount : 0;

  useEffect(() => {
    const updateGap = () => setGap(getHorizontalGap());
    window.addEventListener("resize", updateGap);
    return () => window.removeEventListener("resize", updateGap);
  }, []);

  useEffect(() => {
    cardsRef.current.forEach((card, index) => {
      if (!card || cardCount === 0) return;

      const offset = getCardOffset(index, activeIndex, cardCount);
      const distance = Math.abs(offset);
      const isSelected = offset === 0;

      gsap.to(card, {
        x: offset * gap,
        y: distance * 16,
        z: isSelected ? 100 : -distance * 90,
        scale: isSelected ? 1 : Math.max(0.58, 0.82 - distance * 0.1),
        opacity: distance > 2 ? 0 : isSelected ? 1 : 0.48,
        filter: isSelected
          ? "grayscale(0%) blur(0px) brightness(1)"
          : `grayscale(100%) blur(${Math.min(distance * 1.4, 3)}px) brightness(0.52)`,
        zIndex: isSelected ? 50 : 30 - distance,
        duration: 0.7,
        ease: "power3.inOut",
        pointerEvents: distance > 2 ? "none" : "auto",
      });
    });
  }, [activeIndex, cardCount, gap]);

  const selectPrevious = () => {
    if (cardCount > 0) {
      setSelectedIndex((current) => (current - 1 + cardCount) % cardCount);
    }
  };

  const selectNext = () => {
    if (cardCount > 0) {
      setSelectedIndex((current) => (current + 1) % cardCount);
    }
  };

  const handleCardClick = (index: number) => {
    if (index === activeIndex) {
      openCharacter(index);
      return;
    }
    setSelectedIndex(index);
  };

  const openCharacter = (index: number) => {
    if (index !== activeIndex || expandedCharacter) return;

    const source = cardsRef.current[index];
    const character = figures[index];
    if (source && character) {
      isClosingRef.current = false;
      setExpandedCharacter({
        character,
        sourceRect: source.getBoundingClientRect(),
      });
    }
  };

  const closeCharacter = () => {
    if (isClosingRef.current) return;
    const card = expandedCardRef.current;
    if (!card || !expandedCharacter) {
      setExpandedCharacter(null);
      return;
    }

    isClosingRef.current = true;
    const rect = expandedCharacter.sourceRect;
    gsap.to(card, {
      x: rect.left + rect.width / 2 - window.innerWidth / 2,
      y: rect.top + rect.height / 2 - window.innerHeight / 2,
      scale: rect.width / card.offsetWidth,
      rotateY: -180,
      opacity: 0,
      duration: 0.58,
      ease: "power3.inOut",
      onComplete: () => {
        setExpandedCharacter(null);
        isClosingRef.current = false;
      },
    });
  };

  const moveSpotlight = (event: React.PointerEvent<HTMLDivElement>) => {
    const card = expandedCardRef.current;
    const spotlight = spotlightRef.current;
    if (!card || !spotlight) return;

    const rect = card.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const rotateX = ((y / rect.height) - 0.5) * -3;
    const rotateY = ((x / rect.width) - 0.5) * 3;

    gsap.to(spotlight, {
      x,
      y,
      opacity: 1,
      duration: 0.18,
      ease: "power2.out",
      overwrite: true,
    });
    gsap.to(card, {
      rotateX,
      rotateY,
      duration: 0.3,
      ease: "power2.out",
      overwrite: "auto",
    });
  };

  const resetSpotlight = () => {
    if (spotlightRef.current) {
      gsap.to(spotlightRef.current, {
        opacity: 0.25,
        duration: 0.45,
        ease: "power2.out",
      });
    }
    if (expandedCardRef.current) {
      gsap.to(expandedCardRef.current, {
        rotateX: 0,
        rotateY: 0,
        duration: 0.45,
        ease: "power2.out",
      });
    }
  };

  useLayoutEffect(() => {
    const card = expandedCardRef.current;
    if (!card || !expandedCharacter) return;

    const rect = expandedCharacter.sourceRect;
    gsap.fromTo(
      card,
      {
        x: rect.left + rect.width / 2 - window.innerWidth / 2,
        y: rect.top + rect.height / 2 - window.innerHeight / 2,
        scale: rect.width / card.offsetWidth,
        rotateY: 180,
        opacity: 0.25,
      },
      {
        x: 0,
        y: 0,
        scale: 1,
        rotateY: 0,
        opacity: 1,
        duration: 0.78,
        ease: "power3.out",
      },
    );
  }, [expandedCharacter]);

  return (
    <>
      {authRequiredDialog}
      {expandedCharacter &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center overflow-hidden">
            <button
              type="button"
              aria-label="Đóng chi tiết nhân vật"
              onClick={closeCharacter}
              className="pointer-events-auto absolute inset-0 bg-black/65 backdrop-blur-[5px] [animation:character-backdrop-in_500ms_ease-out_both]"
            />
            <div className="absolute h-[min(90vw,680px)] w-[min(90vw,680px)] rounded-full bg-[var(--accent-gold)]/15 blur-[100px] [animation:character-aura_2.8s_ease-in-out_infinite]" />
            <div
              ref={expandedCardRef}
              onPointerMove={moveSpotlight}
              onPointerLeave={resetSpotlight}
              className="pointer-events-auto relative h-[460px] w-[320px] max-w-[84vw] overflow-hidden rounded-[30px] border border-[var(--accent-gold)]/55 bg-neutral-950 p-6 text-left text-white shadow-[0_40px_120px_rgba(0,0,0,0.8),0_0_70px_var(--accent-gold-glow)] [transform-style:preserve-3d] sm:h-[520px] sm:w-[370px]"
            >
              <button
                type="button"
                aria-label="Đóng"
                onClick={closeCharacter}
                className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/45 text-white/75 backdrop-blur-md transition-colors hover:border-[var(--accent-gold)] hover:text-[var(--accent-gold)]"
              >
                <XIcon className="h-4 w-4" weight="bold" />
              </button>
              <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(235,196,91,0.26),transparent_36%)]" />
              <span
                ref={spotlightRef}
                className="pointer-events-none absolute left-0 top-0 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-25 blur-2xl"
                style={{
                  background:
                    "radial-gradient(circle, rgba(255,255,255,0.46) 0%, rgba(235,196,91,0.22) 28%, transparent 68%)",
                }}
              />

              <span className="relative flex items-center gap-4 [animation:character-detail-in_500ms_350ms_ease-out_both]">
                <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-[var(--accent-gold)] shadow-[0_0_28px_var(--accent-gold-glow)]">
                  <Image
                    src={
                      isValidUrl(expandedCharacter.character.imageUrl)
                        ? expandedCharacter.character.imageUrl!
                        : "/card.jpg"
                    }
                    alt=""
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </span>
                <span className="min-w-0">
                  <span className="block text-xl font-bold">
                    {expandedCharacter.character.name}
                  </span>
                  <span className="mt-1 block text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent-gold-soft)]">
                    {expandedCharacter.character.era ||
                      expandedCharacter.character.role ||
                      expandedCharacter.character.title}
                  </span>
                </span>
              </span>

              <span className="relative mt-7 block max-h-[270px] overflow-y-auto text-sm font-medium leading-7 text-neutral-200 [animation:character-detail-in_650ms_500ms_ease-out_both]">
                {expandedCharacter.character.description ||
                  expandedCharacter.character.title}
              </span>

              <button
                type="button"
                onClick={() =>
                  navigateWithAuth(`/chat/${expandedCharacter.character.id}`)
                }
                className="absolute inset-x-6 bottom-6 flex items-center justify-center gap-2 rounded-full bg-[var(--accent-gold)] py-3.5 text-sm font-extrabold text-[var(--text-inverse)] shadow-[0_14px_38px_var(--accent-gold-glow)] transition-[filter,transform] hover:brightness-110 active:scale-[0.98] [animation:character-detail-in_650ms_650ms_ease-out_both]"
              >
                <ChatTextIcon className="h-5 w-5 fill-current" />
                Trò chuyện ngay
              </button>
            </div>
            <style>{`
              @keyframes character-backdrop-in {
                from { opacity: 0; }
                to { opacity: 1; }
              }
              @keyframes character-aura {
                0%, 100% { opacity: .55; transform: scale(.92); }
                50% { opacity: 1; transform: scale(1.08); }
              }
              @keyframes character-detail-in {
                from { opacity: 0; transform: translateY(18px); }
                to { opacity: 1; transform: translateY(0); }
              }
              @media (prefers-reduced-motion: reduce) {
                [class*="character-"] { animation: none !important; }
              }
            `}</style>
          </div>,
          document.body,
        )}
      <div
        className="relative flex h-[260px] w-full items-center justify-center sm:h-[340px] md:h-[500px] lg:h-[650px]"
        style={{ perspective: "1200px" }}
      >
        <div className="pointer-events-none absolute h-[520px] w-[520px] rounded-full bg-[var(--accent-gold)]/10 blur-[70px] sm:h-[700px] sm:w-[700px]" />

        {isLoading ? (
          <div className="relative flex items-center justify-center">
            {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
              <div
                key={index}
                className="absolute h-[198px] w-[136px] animate-pulse overflow-hidden rounded-[var(--radius-lg)] border bg-[var(--bg-surface)] sm:h-[266px] sm:w-[190px] md:h-[340px] md:w-[240px] lg:h-[400px] lg:w-[280px]"
                style={{
                  borderColor: "var(--border-default)",
                  transform: `translateX(${(index - 2) * 120}px) scale(${index === 2 ? 1 : 0.7})`,
                  opacity: index === 2 ? 1 : 0.35,
                }}
              />
            ))}
          </div>
        ) : (
          <div
            className="relative h-full w-full"
            style={{ transformStyle: "preserve-3d" }}
          >
            {figures.map((figure, index) => {
              const isSelected = index === activeIndex;
              return (
                <div
                  key={figure.id}
                  ref={(element) => {
                    cardsRef.current[index] = element;
                  }}
                  className="absolute left-1/2 top-1/2 h-[198px] w-[136px] -translate-x-1/2 -translate-y-1/2 will-change-transform sm:h-[266px] sm:w-[190px] md:h-[340px] md:w-[240px] lg:h-[400px] lg:w-[280px]"
                  style={{ transformStyle: "preserve-3d" }}
                >
                  <CharacterCarouselCard
                    character={figure}
                    priority={index < 3}
                    interaction="flip"
                    onClick={() => handleCardClick(index)}
                  />
                  {isSelected && (
                    <div className="pointer-events-none absolute -inset-1.5 rounded-[calc(var(--radius-lg)+6px)] border border-[var(--accent-gold)]/35 shadow-[0_0_18px_rgba(201,162,77,0.22)]" />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!isLoading && cardCount > 1 && (
          <div className="absolute inset-x-0 bottom-1 z-[70] flex items-center justify-center gap-4 sm:bottom-3 md:bottom-8 lg:bottom-16">
            <button
              type="button"
              aria-label="Chọn nhân vật trước"
              onClick={selectPrevious}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/55 text-white shadow-lg backdrop-blur-md transition-colors hover:border-[var(--accent-gold)] hover:text-[var(--accent-gold)]"
            >
              <CaretLeftIcon className="h-5 w-5" weight="bold" />
            </button>
            <span className="min-w-20 text-center text-xs font-bold tracking-[0.18em] text-white/70">
              {activeIndex + 1} / {cardCount}
            </span>
            <button
              type="button"
              aria-label="Chọn nhân vật tiếp theo"
              onClick={selectNext}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/55 text-white shadow-lg backdrop-blur-md transition-colors hover:border-[var(--accent-gold)] hover:text-[var(--accent-gold)]"
            >
              <CaretRightIcon className="h-5 w-5" weight="bold" />
            </button>
          </div>
        )}
      </div>
    </>
  );
}
