"use client";

import { useRef, useState, useEffect } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import {
  CharacterCarouselCard,
  type Character,
} from "@/components/commons/character-card";
import { useCharacters } from "@/features/characters/hooks";
import { useAuthRequiredNavigation } from "@/features/auth/use-auth-required-navigation";

const DESKTOP_RADIUS = 250;

function getResponsiveRadius() {
  if (typeof window === "undefined") return DESKTOP_RADIUS;
  if (window.innerWidth < 640) return 145;
  if (window.innerWidth < 768) return 185;
  return DESKTOP_RADIUS;
}

export function Carousel3DVertical() {
  const { authRequiredDialog, navigateWithAuth } = useAuthRequiredNavigation();
  const containerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const skeletonCardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const rotationProxy = useRef({ rotation: 0 });
  const radiusProxy = useRef({ value: getResponsiveRadius() });
  const baseRadiusRef = useRef(getResponsiveRadius());
  const animationRef = useRef<gsap.core.Tween | null>(null);
  const skeletonAnimRef = useRef<gsap.core.Tween | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isAnimationReady, setIsAnimationReady] = useState(false);

  const { data, isLoading } = useCharacters({ page: 1, limit: 6 });
  const FIGURES: Character[] = data?.content ?? [];
  const cardCount = FIGURES.length;
  const angleIncrement = cardCount > 0 ? (Math.PI * 2) / cardCount : 0;
  const SKELETON_COUNT = 6;
  const skeletonAngleIncrement = (Math.PI * 2) / SKELETON_COUNT;

  // Defer animation khởi động để giảm lag initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimationReady(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const updateRadius = () => {
      const nextRadius = getResponsiveRadius();
      baseRadiusRef.current = nextRadius;
      radiusProxy.current.value = nextRadius;
    };

    updateRadius();
    window.addEventListener("resize", updateRadius);

    return () => window.removeEventListener("resize", updateRadius);
  }, []);

  // ── Skeleton rotation (chỉ chạy khi ready) ─────────────────────
  useGSAP(() => {
    if (!isAnimationReady) return;
    
    const cards = skeletonCardsRef.current.filter(Boolean) as HTMLDivElement[];
    if (cards.length === 0) return;

    const skeletonProxy = { rotation: 0 };

    const updateSkeletons = () => {
      const rot = skeletonProxy.rotation;
      cards.forEach((card, i) => {
        const angle = rot + i * skeletonAngleIncrement;
        const r = baseRadiusRef.current;
        const x = Math.sin(angle) * r;
        const z = Math.cos(angle) * r;
        const normalizedZ = (z + r) / (r * 2);
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
      duration: 40, // Tăng duration để giảm CPU usage
      ease: "none",
      repeat: -1,
      onUpdate: updateSkeletons,
      onRepeat: () => {
        skeletonProxy.rotation = 0;
      },
    });

    return () => skeletonAnimRef.current?.kill();
  }, [isAnimationReady]);

  // ── Real cards rotation ────────────────────────────────
  useGSAP(() => {
    if (!isAnimationReady || cardsRef.current.length === 0 || cardCount === 0) return;

    const cards = cardsRef.current.filter(Boolean) as HTMLDivElement[];
    if (cards.length === 0) return;

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
      duration: 40, // Tăng duration để giảm CPU usage
      ease: "none",
      repeat: -1,
      onUpdate: updateCards,
      onRepeat: () => {
        rotationProxy.current.rotation = 0;
      },
    });

    return () => animationRef.current?.kill();
  }, [cardCount, angleIncrement, isAnimationReady]);

  useGSAP(() => {
    gsap.to(radiusProxy.current, {
      value: isHovered ? baseRadiusRef.current * 0.7 : baseRadiusRef.current,
      duration: 0.5,
      ease: "power2.out",
    });
    if (animationRef.current) {
      animationRef.current.timeScale(isHovered ? 1.5 : 1); // Giảm tốc độ khi hover
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
        className="relative flex h-[260px] w-full items-center justify-center sm:h-[340px] md:h-[500px] lg:h-[650px]"
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
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[136px] h-[198px] sm:w-[190px] sm:h-[266px] md:w-[240px] md:h-[340px] lg:w-[280px] lg:h-[400px]"
            style={{ transformStyle: "preserve-3d" }}
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
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[136px] h-[198px] sm:w-[190px] sm:h-[266px] md:w-[240px] md:h-[340px] lg:w-[280px] lg:h-[400px]"
            style={{ transformStyle: "preserve-3d" }}
          >
            <CharacterCarouselCard
              character={figure}
              priority={index === 0}
              onClick={handleSelect}
            />
          </div>
        ))}
      </div>
      </div>
    </>
  );
}
