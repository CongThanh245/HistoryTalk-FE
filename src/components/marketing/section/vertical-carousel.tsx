'use client';

import { useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import Link from 'next/link';

interface HistoricalFigure {
  id: string;
  name: string;
  title: string;
  era: string;
  image?: string;
}

const figures: HistoricalFigure[] = [
  {
    id: 'napoleon',
    name: 'Napoleon Bonaparte',
    title: 'Hoàng đế Pháp',
    era: '1769-1821',
  },
  {
    id: 'cleopatra',
    name: 'Cleopatra VII',
    title: 'Nữ hoàng Ai Cập',
    era: '69-30 BC',
  },
  {
    id: 'davinci',
    name: 'Leonardo da Vinci',
    title: 'Nghệ sĩ & Nhà phát minh',
    era: '1452-1519',
  },
  {
    id: 'joan',
    name: 'Joan of Arc',
    title: 'Anh hùng Pháp',
    era: '1412-1431',
  },
  {
    id: 'einstein',
    name: 'Albert Einstein',
    title: 'Nhà Vật lý',
    era: '1879-1955',
  },
  {
    id: 'curie',
    name: 'Marie Curie',
    title: 'Nhà Khoa học',
    era: '1867-1934',
  },
  {
    id: 'shakespeare',
    name: 'William Shakespeare',
    title: 'Nhà văn',
    era: '1564-1616',
  },
  {
    id: 'confucius',
    name: 'Khổng Tử',
    title: 'Triết gia',
    era: '551-479 BC',
  },
];

export function Carousel3DVertical() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLAnchorElement | null)[]>([]);
  const [isHovered, setIsHovered] = useState(false);
  
  // Proxy object for rotation animation
  const rotationProxy = useRef({ rotation: 0 });
  const animationRef = useRef<gsap.core.Tween | null>(null);

  const radius = 450; // Radius of the hidden cylinder
  const cardCount = figures.length;
  const angleIncrement = (Math.PI * 2) / cardCount; // Angle between cards

  useGSAP(() => {
    const cards = cardsRef.current.filter(Boolean) as HTMLAnchorElement[];
    if (cards.length === 0) return;

    // Function to update card positions and visual properties
    const updateCards = () => {
      const currentRotation = rotationProxy.current.rotation;

      cards.forEach((card, index) => {
        // Calculate angle for this card
        const angle = currentRotation + index * angleIncrement;

        // CRITICAL: Use sine and cosine for circular positioning
        const x = Math.sin(angle) * radius;
        const z = Math.cos(angle) * radius;

        // Calculate depth-based properties
        // z ranges from -radius to +radius
        // Normalize to 0-1 (0 = back, 1 = front)
        const normalizedZ = (z + radius) / (radius * 2);

        // Scale: 0.6 (back) to 1.0 (front)
        const scale = 0.6 + normalizedZ * 0.4;

        // Opacity: 0.3 (back) to 1.0 (front)
        const opacity = 0.3 + normalizedZ * 0.7;

        // Blur: 4px (back) to 0px (front)
        const blur = (1 - normalizedZ) * 4;

        // Z-index: higher for cards closer to front
        const zIndex = Math.round(normalizedZ * 100);

        // Apply transform - ONLY translate3d (keeps cards vertical)
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

    // Initial positioning
    updateCards();

    // Create infinite rotation animation
    const animation = gsap.to(rotationProxy.current, {
      rotation: Math.PI * 2, // One full rotation (360 degrees in radians)
      duration: 25, // 25 seconds per rotation
      ease: 'none',
      repeat: -1,
      onUpdate: updateCards,
      onRepeat: () => {
        // Reset rotation to 0 to prevent number overflow
        rotationProxy.current.rotation = 0;
      },
    });

    animationRef.current = animation;

    return () => {
      animation.kill();
    };
  }, [cardCount, radius, angleIncrement]);

  // Handle hover pause/resume
  useGSAP(() => {
    if (!animationRef.current) return;

    if (isHovered) {
      // Smoothly pause
      gsap.to(animationRef.current, {
        timeScale: 0,
        duration: 0.5,
        ease: 'power2.out',
      });
    } else {
      // Smoothly resume
      gsap.to(animationRef.current, {
        timeScale: 1,
        duration: 0.5,
        ease: 'power2.in',
      });
    }
  }, [isHovered]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[600px] flex items-center justify-center"
      style={{ perspective: '1200px' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 3D Scene Container */}
      <div
        className="relative w-full h-full"
        style={{
          transformStyle: 'preserve-3d',
        }}
      >
        {figures.map((figure, index) => {
          const iconMap: { [key: string]: string } = {
            napoleon: '👑',
            cleopatra: '👸',
            davinci: '🎨',
            joan: '⚔️',
            einstein: '🔬',
            curie: '🧪',
            shakespeare: '📚',
            confucius: '🏛️',
          };

          return (
            <Link
              key={figure.id}
              href={`/character/${figure.id}`}
              ref={(el) => {
                cardsRef.current[index] = el;
              }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
              style={{
                transformStyle: 'preserve-3d',
                width: '300px',
                height: '420px',
              }}
            >
              {/* Card */}
              <div className="w-full h-full bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[var(--radius-lg)] overflow-hidden shadow-[var(--shadow-strong)] transition-all duration-300 group-hover:border-[var(--accent-gold)] group-hover:shadow-[0_20px_80px_rgba(201,162,77,0.4)]">
                
                {/* Image Section */}
                <div className="relative w-full h-[300px] bg-[var(--bg-elevated)] overflow-hidden">
                  {/* Gradient Background */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background: `linear-gradient(135deg, 
                        var(--accent-${index % 2 === 0 ? 'gold' : 'bronze'}) 0%, 
                        var(--accent-${index % 2 === 0 ? 'bronze' : 'gold'}) 100%)`,
                      opacity: 0.15,
                    }}
                  />

                  {/* Icon/Placeholder */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-8xl opacity-40">
                      {iconMap[figure.id] || '🎭'}
                    </span>
                  </div>

                  {/* Era Badge */}
                  <div className="absolute top-4 right-4 px-3 py-1 bg-[var(--bg-main)]/80 backdrop-blur-sm rounded-full border border-[var(--border-default)]">
                    <span className="text-xs text-[var(--accent-gold)] font-medium">
                      {figure.era}
                    </span>
                  </div>

                  {/* Bottom Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-surface)] via-transparent to-transparent" />
                </div>

                {/* Content Section */}
                <div className="p-6 space-y-3">
                  <h3 className="text-xl font-bold text-[var(--text-primary)] line-clamp-1 group-hover:text-[var(--accent-gold)] transition-colors">
                    {figure.name}
                  </h3>
                  <p className="text-sm text-[var(--accent-gold)] font-medium">
                    {figure.title}
                  </p>

                  {/* Hover CTA */}
                  <div className="pt-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="text-xs text-[var(--text-muted)]">
                      Trò chuyện ngay
                    </span>
                    <svg
                      className="w-3 h-3 text-[var(--accent-gold)]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>

                {/* Decorative Corner */}
                <div className="absolute top-0 left-0 w-20 h-20 overflow-hidden opacity-20">
                  <div className="absolute top-0 left-0 w-0 h-0 border-t-[60px] border-l-[60px] border-t-[var(--accent-gold)] border-l-transparent" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Pause Indicator */}
      {isHovered && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-[var(--bg-surface)]/90 backdrop-blur-sm rounded-full border border-[var(--accent-gold)]/30">
          <span className="text-sm text-[var(--accent-gold)] font-medium flex items-center gap-2">
            <span className="w-2 h-2 bg-[var(--accent-gold)] rounded-full animate-pulse" />
            Tạm dừng
          </span>
        </div>
      )}

      {/* Navigation Hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center">
        <p className="text-sm text-[var(--text-muted)] italic">
          Di chuột vào để tạm dừng • Click để trò chuyện
        </p>
      </div>
    </div>
  );
}