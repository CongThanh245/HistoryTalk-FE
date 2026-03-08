"use client";

import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRouter } from "next/navigation";
import {
  CharacterCarouselCard,
  type Character,
} from "@/components/commons/character-card";
import { useCharacters } from "@/features/characters/hooks";

const RADIUS = 250;

export function Carousel3DVertical() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const rotationProxy = useRef({ rotation: 0 });
  const radiusProxy = useRef({ value: RADIUS });
  const animationRef = useRef<gsap.core.Tween | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  const { data, isLoading } = useCharacters({ page: 1, limit: 6 });
  const FIGURES: Character[] = data?.content ?? [];

  const cardCount = FIGURES.length;
  const angleIncrement = cardCount > 0 ? (Math.PI * 2) / cardCount : 0;

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

    return () => {
      animationRef.current?.kill();
    };
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
    router.push(`/chat/${id}`);
  };

  if (isLoading) {
    return (
      <div className="relative w-full h-[650px] flex items-center justify-center">
        <div className="text-white/50 animate-pulse">Đang tải nhân vật...</div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[650px] flex items-center justify-center"
      style={{ perspective: "1200px" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
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
      <div
        className="relative w-full h-full"
        style={{ transformStyle: "preserve-3d" }}
      >
        {FIGURES.map((figure, index) => (
          <div
            key={figure.id}
            ref={(el) => {
              cardsRef.current[index] = el;
            }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{
              transformStyle: "preserve-3d",
              width: "280px",
              height: "400px",
            }}
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
  );
}
