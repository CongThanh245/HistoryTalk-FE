'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import Link from 'next/link';
import Image from 'next/image';

interface HistoricalFigure {
  id: string;
  name: string;
  title: string;
  era: string;
}

const figures: HistoricalFigure[] = [
  { id: 'napoleon', name: 'Napoleon Bonaparte', title: 'Hoàng đế Pháp', era: '1769-1821' },
  { id: 'cleopatra', name: 'Cleopatra VII', title: 'Nữ hoàng Ai Cập', era: '69-30 BC' },
  { id: 'davinci', name: 'Leonardo da Vinci', title: 'Nghệ sĩ & Nhà phát minh', era: '1452-1519' },
  { id: 'joan', name: 'Joan of Arc', title: 'Anh hùng Pháp', era: '1412-1431' },
  { id: 'einstein', name: 'Albert Einstein', title: 'Nhà Vật lý', era: '1879-1955' },
  { id: 'curie', name: 'Marie Curie', title: 'Nhà Khoa học', era: '1867-1934' },
  { id: 'shakespeare', name: 'William Shakespeare', title: 'Nhà văn', era: '1564-1616' },
  { id: 'confucius', name: 'Khổng Tử', title: 'Triết gia', era: '551-479 BC' },
];

export function Carousel3DVertical() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLAnchorElement | null)[]>([]);
  
  const rotationProxy = useRef({ rotation: 0 });

  const radius = 250; 
  const cardCount = figures.length;
  const angleIncrement = (Math.PI * 2) / cardCount;

  useGSAP(() => {
    const cards = cardsRef.current.filter(Boolean) as HTMLAnchorElement[];
    if (cards.length === 0) return;

    const updateCards = () => {
      const currentRotation = rotationProxy.current.rotation;

      cards.forEach((card, index) => {
        const angle = currentRotation + index * angleIncrement;
        const x = Math.sin(angle) * radius;
        const z = Math.cos(angle) * radius;
        const normalizedZ = (z + radius) / (radius * 2);
        
        const scale = 0.6 + normalizedZ * 0.4;
        const opacity = 0.3 + normalizedZ * 0.7;
        const blur = (1 - normalizedZ) * 4;
        const zIndex = Math.round(normalizedZ * 100);

        gsap.set(card, {
          x: x,
          z: z,
          scale: scale,
          opacity: opacity,
          filter: `blur(${blur}px)`,
          zIndex: zIndex,
        });
      });
    };

    updateCards();

    // Animation xoay liên tục không nghỉ
    const animation = gsap.to(rotationProxy.current, {
      rotation: Math.PI * 2,
      duration: 30, // Tăng nhẹ thời gian để xoay mượt mà hơn
      ease: 'none',
      repeat: -1,
      onUpdate: updateCards,
      onRepeat: () => {
        rotationProxy.current.rotation = 0;
      },
    });

    return () => {
      animation.kill();
    };
  }, [cardCount, radius, angleIncrement]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[650px] flex items-center justify-center"
      style={{ perspective: '1200px' }}
    >
      <div className="relative w-full h-full" style={{ transformStyle: 'preserve-3d' }}>
        {figures.map((figure, index) => (
          <Link
            key={figure.id}
            href="/app/latest" // Chuyển hướng cố định về app
            ref={(el) => {
              cardsRef.current[index] = el;
            }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
            style={{
              transformStyle: 'preserve-3d',
              width: '280px',
              height: '400px',
            }}
          >
            <div className="w-full h-full bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[var(--radius-lg)] overflow-hidden shadow-[var(--shadow-strong)] transition-all duration-300 group-hover:border-[var(--accent-gold)] group-hover:shadow-[0_10px_40px_rgba(201,162,77,0.2)]">
              
              <div className="relative w-full h-[280px] bg-[var(--bg-elevated)] overflow-hidden">
                <Image
                  src="/card.jpg" 
                  alt={figure.name}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  priority={index < 3}
                />
                <div className="absolute top-3 right-3 px-2 py-1 bg-[var(--bg-main)]/80 backdrop-blur-sm rounded-md border border-[var(--border-default)] z-10">
                  <span className="text-[10px] text-[var(--accent-gold)] font-bold uppercase tracking-wider">
                    {figure.era}
                  </span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-surface)] via-transparent to-transparent z-10" />
              </div>

              <div className="p-5 space-y-1">
                <h3 className="text-lg font-bold text-[var(--text-primary)] line-clamp-1 group-hover:text-[var(--accent-gold)] transition-colors">
                  {figure.name}
                </h3>
                <p className="text-xs text-[var(--text-secondary)] font-medium">
                  {figure.title}
                </p>
                <div className="pt-3 flex items-center gap-2">
                   <div className="h-[1px] flex-1 bg-gradient-to-r from-[var(--accent-gold)]/50 to-transparent" />
                   <span className="text-[10px] uppercase font-bold text-[var(--accent-gold)] opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                     Chat ngay
                   </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center w-full">
        <p className="text-xs text-[var(--text-muted)] font-medium tracking-widest uppercase opacity-50">
          Click vào thẻ để bắt đầu hành trình
        </p>
      </div>
    </div>
  );
}