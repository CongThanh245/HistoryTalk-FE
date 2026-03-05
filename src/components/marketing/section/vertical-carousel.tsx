'use client';

import { useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { useRouter } from 'next/navigation';
import { CharacterCarouselCard, type Character } from '@/components/commons/character-card';

// TODO: fetch từ API /characters
const FIGURES: Character[] = [
  { id: 'napoleon',   name: 'Napoleon Bonaparte', title: 'Hoàng đế Pháp',           era: '1769-1821' },
  { id: 'cleopatra',  name: 'Cleopatra VII',      title: 'Nữ hoàng Ai Cập',          era: '69-30 BC'  },
  { id: 'davinci',    name: 'Leonardo da Vinci',  title: 'Nghệ sĩ & Nhà phát minh',  era: '1452-1519' },
  { id: 'joan',       name: 'Joan of Arc',         title: 'Anh hùng Pháp',            era: '1412-1431' },
  { id: 'einstein',   name: 'Albert Einstein',    title: 'Nhà Vật lý',               era: '1879-1955' },
  { id: 'curie',      name: 'Marie Curie',         title: 'Nhà Khoa học',             era: '1867-1934' },
  { id: 'shakespeare',name: 'William Shakespeare', title: 'Nhà văn',                  era: '1564-1616' },
  { id: 'confucius',  name: 'Khổng Tử',            title: 'Triết gia',                era: '551-479 BC'},
];

const RADIUS = 250;

export function Carousel3DVertical() {
  const router = useRouter();
  const containerRef  = useRef<HTMLDivElement>(null);
  const cardsRef      = useRef<(HTMLDivElement | null)[]>([]);
  const rotationProxy = useRef({ rotation: 0 });
  const radiusProxy   = useRef({ value: RADIUS });
  const animationRef  = useRef<gsap.core.Tween | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  const cardCount      = FIGURES.length;
  const angleIncrement = (Math.PI * 2) / cardCount;

  useGSAP(() => {
    const cards = cardsRef.current.filter(Boolean) as HTMLDivElement[];
    if (cards.length === 0) return;

    const updateCards = () => {
      const rot = rotationProxy.current.rotation;
      const r   = radiusProxy.current.value;

      cards.forEach((card, i) => {
        const angle       = rot + i * angleIncrement;
        const x           = Math.sin(angle) * r;
        const z           = Math.cos(angle) * r;
        const normalizedZ = (z + r) / (r * 2);
        gsap.set(card, {
          x,
          z,
          scale:   0.6 + normalizedZ * 0.4,
          opacity: 0.3 + normalizedZ * 0.7,
          filter:  `blur(${(1 - normalizedZ) * 4}px)`,
          zIndex:  Math.round(normalizedZ * 100),
        });
      });
    };

    // Initial position
    updateCards();

    animationRef.current = gsap.to(rotationProxy.current, {
      rotation: Math.PI * 2,
      duration: 30,
      ease: 'none',
      repeat: -1,
      onUpdate: updateCards,
      onRepeat: () => { rotationProxy.current.rotation = 0; },
    });

    return () => { animationRef.current?.kill(); };
  }, [cardCount, angleIncrement]);

  useGSAP(() => {
    gsap.to(radiusProxy.current, {
      value: isHovered ? RADIUS * 0.7 : RADIUS,
      duration: 0.5,
      ease: 'power2.out',
    });
    if (animationRef.current) {
      animationRef.current.timeScale(isHovered ? 2 : 1);
    }
  }, [isHovered]);

  const handleSelect = (id: string) => {
    // TODO: navigate sang /chat/[id]
    router.push(`/chat/${id}`);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[650px] flex items-center justify-center"
      style={{ perspective: '1200px' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative w-full h-full" style={{ transformStyle: 'preserve-3d' }}>
        {FIGURES.map((figure, index) => (
          <div
            key={figure.id}
            ref={(el) => { cardsRef.current[index] = el; }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ transformStyle: 'preserve-3d', width: '280px', height: '400px' }}
          >
            {/* Dùng CharacterCarouselCard — component dùng chung */}
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