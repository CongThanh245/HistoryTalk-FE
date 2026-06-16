"use client";

import { useEffect, useRef, useState, lazy, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { Container } from "../container";
import { isValidUrl } from "@/lib/utils/url";
import type { Character } from "@/services/character.service";
import {
  WELCOME_SCREEN_FINISHED_EVENT,
} from "@/constants/welcome-screen";

// Lazy load carousel để giảm initial render load
const Carousel3DVertical = lazy(() =>
  import("./vertical-carousel").then((m) => ({
    default: m.Carousel3DVertical,
  })),
);

// Simple placeholder cho carousel
const CarouselPlaceholder = () => (
  <div className="flex items-center justify-center h-full">
    <div className="w-32 h-32 rounded-full bg-[var(--bg-surface)] animate-pulse" />
  </div>
);

function StaticCharacterPreview({
  characters,
}: {
  characters: Character[];
}) {
  const visibleCharacters = characters.slice(0, 3);

  if (visibleCharacters.length === 0) return <CarouselPlaceholder />;

  return (
    <div
      className="relative flex h-full w-full items-center justify-center"
      style={{ perspective: "1200px" }}
    >
      <div
        className="absolute pointer-events-none h-[620px] w-[620px] rounded-full opacity-55"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(205,211,22,0.22) 0%, rgba(205,211,22,0.08) 40%, transparent 70%)",
        }}
      />
      {visibleCharacters.map((character, index) => {
        const imageSrc = isValidUrl(character.imageUrl)
          ? character.imageUrl!
          : "/card.jpg";
        const transforms = [
          "translate3d(0, 0, 80px) scale(1)",
          "translate3d(-150px, 16px, -80px) scale(0.82)",
          "translate3d(150px, 16px, -90px) scale(0.8)",
        ];

        return (
          <div
            key={character.id}
            className="absolute h-[198px] w-[136px] overflow-hidden rounded-[var(--radius-lg)] border bg-[var(--bg-surface)] shadow-[var(--shadow-soft)] sm:h-[266px] sm:w-[190px] md:h-[340px] md:w-[240px] lg:h-[400px] lg:w-[280px]"
            style={{
              borderColor: "var(--border-default)",
              transform: transforms[index],
              zIndex: 30 - index,
            }}
          >
            <div className="relative h-[65%] w-full bg-[var(--bg-elevated)]">
              <Image
                src={imageSrc}
                alt={character.name}
                fill
                priority
                fetchPriority="high"
                quality={65}
                sizes="(max-width: 640px) 136px, (max-width: 768px) 190px, (max-width: 1024px) 240px, 280px"
                className="object-cover"
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to top, var(--bg-surface) 0%, rgba(26,36,54,0) 50%)",
                }}
              />
            </div>
            <div className="flex h-[35%] flex-col px-3 py-3 text-left sm:px-4">
              <span className="mb-1 w-fit rounded-full border border-[var(--accent-gold)]/55 px-2 py-0.5 text-[9px] font-bold uppercase text-[var(--accent-gold-soft)]">
                {character.era ?? ""}
              </span>
              <h3 className="line-clamp-1 text-sm font-bold text-[var(--text-primary)] sm:text-base">
                {character.name}
              </h3>
              <p className="mt-1 line-clamp-2 text-[11px] font-medium leading-snug text-[var(--text-secondary)] sm:text-xs">
                {character.role ?? character.title}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function HeroSection({
  initialCharacters = [],
}: {
  initialCharacters?: Character[];
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const contentWrapperRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const subContentRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [showCarousel, setShowCarousel] = useState(false);

  // Defer animations để tránh chạy ngay lập tức khi mount
  useEffect(() => {
    let rafId = 0;
    let idleCallbackId: number | undefined;
    let carouselTimer: number | undefined;

    const startHero = () => {
      rafId = requestAnimationFrame(() => {
        setIsReady(true);

      // Phase 2: Defer carousel load để tránh lag initial render
        const loadCarousel = () => setShowCarousel(true);

        if ("requestIdleCallback" in window) {
          idleCallbackId = (
            window as Window & {
              requestIdleCallback: typeof requestIdleCallback;
            }
          ).requestIdleCallback(loadCarousel, { timeout: 6500 });
        } else {
          carouselTimer = window.setTimeout(loadCarousel, 6500);
        }
      });
    };

    const isWelcomeScreenMounted =
      document.querySelector(".welcome-screen") !== null;

    if (isWelcomeScreenMounted) {
      window.addEventListener(WELCOME_SCREEN_FINISHED_EVENT, startHero, {
        once: true,
      });
    } else {
      startHero();
    }

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener(WELCOME_SCREEN_FINISHED_EVENT, startHero);

      if (idleCallbackId !== undefined && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleCallbackId);
      }

      if (carouselTimer !== undefined) {
        window.clearTimeout(carouselTimer);
      }
    };
  }, []);

  useEffect(() => {
    if (!isReady) return;

    let ctx: { revert: () => void } | undefined;
    let isMounted = true;

    async function setupAnimations() {
      const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);

      if (!isMounted || !sectionRef.current) return;

      gsap.registerPlugin(ScrollTrigger);

      ctx = gsap.context(() => {
      const tl = gsap.timeline({ 
        defaults: { ease: "power3.out" },
        delay: 0.1 // Nhỏ delay để đảm bảo browser đã render xong
      });

      tl.fromTo(
        ".hero-reveal-title",
        { yPercent: 115, rotate: 1.5 },
        { yPercent: 0, rotate: 0, duration: 0.9 },
      )
        .fromTo(
          ".hero-reveal-subtitle",
          { yPercent: 120, opacity: 0 },
          { yPercent: 0, opacity: 1, duration: 0.75 },
          "-=0.58",
        )
        .fromTo(
          ".hero-stagger-item",
          { y: 24, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.65, stagger: 0.11 },
          "-=0.38",
        );

      gsap.to([contentWrapperRef.current, carouselRef.current], {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom 20%",
          scrub: true,
        },
        opacity: 0,
        y: -100,
        ease: "none",
      });

      gsap.fromTo(
        lineRef.current,
        { scaleY: 0.35, opacity: 0.45 },
        {
          scaleY: 1,
          opacity: 1,
          transformOrigin: "bottom",
          ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: "bottom center",
            scrub: true,
          },
        },
      );
      }, sectionRef);
    }

    const animationTimer = window.setTimeout(() => {
      setupAnimations();
    }, 180);

    return () => {
      isMounted = false;
      window.clearTimeout(animationTimer);
      ctx?.revert();
    };
  }, [isReady]);

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-[100svh] flex-col overflow-hidden pb-8 lg:items-center lg:justify-center lg:pb-0"
      style={{ 
        isolation: "isolate"
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 0,
          background: `
            radial-gradient(circle at 20% 30%, rgba(212, 175, 55, 0.05) 0%, transparent 50%),
            radial-gradient(ellipse 100% 80% at 50% 120%, #2a1f0d 0%, rgba(10, 12, 16, 0) 70%)
          `,
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 hidden h-24 lg:block">
        <div className="absolute bottom-0 left-1/2 h-24 w-px -translate-x-1/2 overflow-hidden rounded-full bg-white/10">
          <div
            ref={lineRef}
            className="h-full w-full origin-bottom rounded-full bg-gradient-to-b from-transparent via-[var(--accent-gold)]/70 to-[var(--accent-gold)] shadow-[0_0_18px_rgba(255,146,21,0.45)]"
          />
        </div>
      </div>

      <Container className="relative w-full">
        <div className="flex min-h-[100svh] flex-col justify-start lg:grid lg:min-h-0 lg:grid-cols-2 lg:items-center lg:gap-20 lg:py-10">
          <div
            ref={contentWrapperRef}
            className="z-10 space-y-4 pb-4 pt-28 sm:pt-[7.5rem] md:space-y-5 md:pb-6 md:pt-28 lg:space-y-8 lg:pb-0 lg:pt-0"
          >
            <h1 className="text-hero text-[var(--text-primary)]">
              <span className="block overflow-hidden pb-[0.08em]">
                <span className="hero-reveal-title block">HISTORY TALK</span>
              </span>
              <span className="text-subtitle mt-2 block overflow-hidden pb-[0.08em] font-normal normal-case text-[var(--text-tertiary)]">
                <span className="hero-reveal-subtitle block">
                  Khi lịch sử trở nên sống động
                </span>
              </span>
            </h1>

            <div ref={subContentRef} className="space-y-5 lg:space-y-8">
              <div className="hero-stagger-item">
                <p className="text-sm md:text-base lg:text-lg leading-relaxed max-w-xl text-[var(--text-secondary)]">
                  Trò chuyện trực tiếp với các nhân vật lịch sử được tái hiện bằng AI. Khám phá quá khứ như một hành trình có bối cảnh, cảm xúc và lựa chọn.
                </p>
              </div>

              <div className="hero-stagger-item my-3 md:my-4 space-y-0.5 border-l-2 border-[var(--accent-gold)]/40 py-2 pl-4 md:py-3 md:pl-5 lg:pl-6">
                <p className="text-sm md:text-base font-light italic text-[var(--text-primary)]">
                  &quot;Học sinh chỉ chán học Lịch sử trên trường
                </p>
                <p className="text-sm md:text-base font-light italic text-[var(--accent-gold)]">
                  chứ không học sinh nào chán lịch sử dân tộc cả!&quot;
                </p>
              </div>

              <div className="hero-stagger-item pt-2 lg:pt-4">
                <Link
                  href="/home"
                  className={cn(
                    "group relative flex w-full items-center justify-center overflow-hidden border border-white/10 bg-white/[0.03] px-6 py-3.5 text-sm font-semibold tracking-wider text-white backdrop-blur-md transition-all duration-300 hover:border-white/20 hover:bg-white/[0.08] active:scale-[0.98] lg:inline-flex lg:w-auto lg:overflow-visible lg:px-8 lg:py-4 lg:text-base",
                  )}
                >
                  <span className="absolute left-0 top-0 h-[1.5px] w-full origin-left -translate-x-[7.5%] scale-x-0 bg-[var(--text-tertiary)] transition-transform duration-700 ease-out group-hover:scale-x-[1.15]" />
                  <span className="absolute bottom-0 left-0 h-[1.5px] w-full origin-right translate-x-[7.5%] scale-x-0 bg-[var(--text-tertiary)] transition-transform duration-700 ease-out group-hover:scale-x-[1.15]" />
                  <span className="absolute left-0 top-0 h-full w-[1.5px] origin-bottom translate-y-[15%] scale-y-0 bg-[var(--text-tertiary)] transition-transform duration-700 ease-out group-hover:scale-y-[1.3]" />
                  <span className="absolute right-0 top-0 h-full w-[1.5px] origin-top -translate-y-[15%] scale-y-0 bg-[var(--text-tertiary)] transition-transform duration-700 ease-out group-hover:scale-y-[1.3]" />
                  <span className="relative z-20">TRẢI NGHIỆM NGAY</span>
                </Link>
              </div>
            </div>
          </div>

          <div
            ref={carouselRef}
            className="relative -mx-4 mt-2 flex h-[260px] w-[calc(100%+2rem)] items-center justify-center overflow-hidden will-change-transform sm:mx-0 sm:h-[340px] sm:w-full md:h-[500px] lg:mt-0 lg:h-[650px] lg:overflow-visible"
            onPointerEnter={() => setShowCarousel(true)}
            onFocus={() => setShowCarousel(true)}
          >
            {showCarousel ? (
              <Suspense fallback={<CarouselPlaceholder />}>
                <Carousel3DVertical initialCharacters={initialCharacters} />
              </Suspense>
            ) : (
              <StaticCharacterPreview characters={initialCharacters} />
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
