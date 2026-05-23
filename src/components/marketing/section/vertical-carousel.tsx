"use client";

import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import {
  CharacterCarouselCard,
  type Character,
} from "@/components/commons/character-card";
import { useCharacters } from "@/features/characters/hooks";
import { useAuthRequiredNavigation } from "@/features/auth/use-auth-required-navigation";

const RADIUS = 250;

export function Carousel3DVertical() {
  const { authRequiredDialog, navigateWithAuth } = useAuthRequiredNavigation();
  const containerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const skeletonCardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const rotationProxy = useRef({ rotation: 0 });
  const radiusProxy = useRef({ value: RADIUS });
  const animationRef = useRef<gsap.core.Tween | null>(null);
  const skeletonAnimRef = useRef<gsap.core.Tween | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  const { data, isLoading } = useCharacters({ page: 1, limit: 6 });
  const FIGURES: Character[] = data?.content ?? [];
  const cardCount = FIGURES.length;
  const angleIncrement = cardCount > 0 ? (Math.PI * 2) / cardCount : 0;
  const SKELETON_COUNT = 6;
  const skeletonAngleIncrement = (Math.PI * 2) / SKELETON_COUNT;

  // ── Skeleton rotation (luôn chạy) ─────────────────────
  useGSAP(() => {
    const cards = skeletonCardsRef.current.filter(Boolean) as HTMLDivElement[];
    if (cards.length === 0) return;

    const skeletonProxy = { rotation: 0 };

    const updateSkeletons = () => {
      const rot = skeletonProxy.rotation;
      cards.forEach((card, i) => {
        const angle = rot + i * skeletonAngleIncrement;
        const x = Math.sin(angle) * RADIUS;
        const z = Math.cos(angle) * RADIUS;
        const normalizedZ = (z + RADIUS) / (RADIUS * 2);
        gsap.set(card, {
          x,
          z,
          scale: 0.6 + normalizedZ * 0.4,
          opacity: 0.3 + normalizedZ * 0.7,
          zIndex: Math.round(normalizedZ * 100),
        });
      });
    };

    updateSkeletons();

    skeletonAnimRef.current = gsap.to(skeletonProxy, {
      rotation: Math.PI * 2,
      duration: 30,
      ease: "none",
      repeat: -1,
      onUpdate: updateSkeletons,
      onRepeat: () => {
        skeletonProxy.rotation = 0;
      },
    });

    return () => skeletonAnimRef.current?.kill();
  }, []);

  // ── Real cards rotation ────────────────────────────────
  useGSAP(() => {
    const cards = cardsRef.current.filter(Boolean) as HTMLDivElement[];
    if (cards.length === 0 || cardCount === 0) return;

    const updateCards = () => {
      const rot = rotationProxy.current.rotation;
      const r = radiusProxy.current.value;
      cards.forEach((card, i) => {
        const angle = rot + i * angleIncrement;
        const x = Math.sin(angle) * r;
        const z = Math.cos(angle) * r;
        const normalizedZ = (z + r) / (r * 2);
        gsap.set(card, {
          x,
          z,
          scale: 0.6 + normalizedZ * 0.4,
          opacity: 0.3 + normalizedZ * 0.7,
          filter: `blur(${(1 - normalizedZ) * 4}px)`,
          zIndex: Math.round(normalizedZ * 100),
        });
      });
    };

    updateCards();

    animationRef.current = gsap.to(rotationProxy.current, {
      rotation: Math.PI * 2,
      duration: 30,
      ease: "none",
      repeat: -1,
      onUpdate: updateCards,
      onRepeat: () => {
        rotationProxy.current.rotation = 0;
      },
    });

    return () => animationRef.current?.kill();
  }, [cardCount, angleIncrement]);

  useGSAP(() => {
    gsap.to(radiusProxy.current, {
      value: isHovered ? RADIUS * 0.7 : RADIUS,
      duration: 0.5,
      ease: "power2.out",
    });
    if (animationRef.current) {
      animationRef.current.timeScale(isHovered ? 2 : 1);
    }
  }, [isHovered]);

  const handleSelect = (id: string) => {
    navigateWithAuth(`/chat/${id}`);
  };

  return (
    <>
      {authRequiredDialog}
      <div
        ref={containerRef}
        className="relative w-full h-[650px] flex items-center justify-center"
        style={{ perspective: "1200px" }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
      {/* Glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: "1000px",
          height: "1000px",
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse at center, rgba(205,211,22,0.35) 0%, rgba(205,211,22,0.1) 40%, transparent 70%)",
          zIndex: 0,
        }}
      />

      {/* Skeleton layer — fade out khi load xong */}
      <div
        className="absolute w-full h-full transition-opacity duration-700"
        style={{
          transformStyle: "preserve-3d",
          opacity: isLoading ? 1 : 0, // ← fade out
          pointerEvents: isLoading ? "auto" : "none",
        }}
      >
        {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
          <div
            key={i}
            ref={(el) => {
              skeletonCardsRef.current[i] = el;
            }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ transformStyle: "preserve-3d", width: 280, height: 400 }}
          >
            <div
              className="w-full h-full rounded-[var(--radius-lg)] animate-pulse overflow-hidden"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-default)",
              }}
            >
              <div
                className="w-full"
                style={{ height: "65%", background: "var(--bg-elevated)" }}
              />
              <div className="p-4 space-y-2">
                <div
                  className="h-4 w-2/3 rounded"
                  style={{ background: "var(--bg-elevated)" }}
                />
                <div
                  className="h-3 w-1/2 rounded"
                  style={{ background: "var(--bg-elevated)" }}
                />
                <div
                  className="h-3 w-1/3 rounded-full"
                  style={{ background: "var(--bg-elevated)" }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Real cards layer — fade in khi load xong */}
      <div
        className="relative w-full h-full transition-opacity duration-700"
        style={{
          transformStyle: "preserve-3d",
          opacity: isLoading ? 0 : 1, // ← fade in
        }}
      >
        {FIGURES.map((figure, index) => (
          <div
            key={figure.id}
            ref={(el) => {
              cardsRef.current[index] = el;
            }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ transformStyle: "preserve-3d", width: 280, height: 400 }}
          >
            <CharacterCarouselCard
              character={figure}
              priority={index < 3}
              onClick={handleSelect}
            />
          </div>
        ))}
      </div>
      </div>
    </>
  );
}
