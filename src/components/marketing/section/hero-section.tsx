"use client";

import { useEffect, useRef, useState, lazy, Suspense } from "react";
import Image from "next/image";
import { Play, X } from "lucide-react";
import { Container } from "../container";
import { MarketingButton } from "@/components/commons/marketing-button";
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
    <div className="relative flex h-full w-full items-center justify-center [perspective:1200px]">
      <div className="absolute pointer-events-none h-[620px] w-[620px] rounded-full opacity-55 bg-[radial-gradient(ellipse_at_center,rgba(205,211,22,0.22)_0%,rgba(205,211,22,0.08)_40%,transparent_70%)]" />
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
            className="absolute h-[198px] w-[136px] overflow-hidden rounded-[var(--radius-lg)] border border-border-default bg-[var(--bg-surface)] shadow-[var(--shadow-soft)] sm:h-[266px] sm:w-[190px] md:h-[340px] md:w-[240px] lg:h-[400px] lg:w-[280px]"
            style={{
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
              <div className="absolute inset-0 bg-[linear-gradient(to_top,var(--bg-surface)_0%,rgba(26,36,54,0)_50%)]" />
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
  const [isVideoOpen, setIsVideoOpen] = useState(false);

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

        if (typeof window.requestIdleCallback === "function") {
          idleCallbackId = window.requestIdleCallback(loadCarousel, { timeout: 6500 });
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
      const scroller = sectionRef.current?.closest("[data-marketing-scroll]");
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
          scroller,
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
            scroller,
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
      className="relative flex h-svh min-h-svh flex-col overflow-hidden pb-0 lg:items-center lg:justify-center isolate"
    >
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: `
            radial-gradient(circle at 20% 30%, rgba(212, 175, 55, 0.05) 0%, transparent 50%),
            radial-gradient(ellipse 100% 80% at 50% 120%, #2a1f0d 0%, rgba(10, 12, 16, 0) 70%)
          `,
        }}
      />
      <div className="landing-ambient-beam hidden" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 hidden h-24 lg:block">
        <div className="absolute bottom-0 left-1/2 h-24 w-px -translate-x-1/2 overflow-hidden rounded-full bg-white/10">
          <div
            ref={lineRef}
            className="h-full w-full origin-bottom rounded-full bg-gradient-to-b from-transparent via-[var(--accent-gold)]/70 to-[var(--accent-gold)] shadow-[0_0_18px_rgba(255,146,21,0.45)]"
          />
        </div>
      </div>

      <Container className="relative w-full">
        <div className="flex h-svh min-h-0 flex-col justify-start lg:grid lg:h-auto lg:min-h-0 lg:grid-cols-2 lg:items-center lg:gap-20 lg:py-10">
          <div
            ref={contentWrapperRef}
            className="z-10 shrink-0 space-y-3 pb-2 pt-[5.8rem] sm:pt-[6.5rem] md:space-y-4 md:pb-4 md:pt-28 lg:space-y-8 lg:pb-0 lg:pt-0"
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

            <div ref={subContentRef} className="space-y-3 lg:space-y-8">
              <div className="hero-stagger-item">
                <p className="line-clamp-3 max-w-xl text-sm leading-relaxed text-[var(--text-secondary)] md:text-base lg:line-clamp-none lg:text-lg">
                  Trò chuyện trực tiếp với các nhân vật lịch sử được tái hiện bằng AI. Khám phá quá khứ như một hành trình có bối cảnh, cảm xúc và lựa chọn.
                </p>
              </div>

              <div className="hero-stagger-item my-2 space-y-0.5 border-l-2 border-[var(--accent-gold)]/40 py-1.5 pl-4 md:my-3 md:py-2 md:pl-5 lg:my-4 lg:py-3 lg:pl-6">
                <p className="text-xs font-light italic text-[var(--text-primary)] md:text-sm lg:text-base">
                  &quot;Học sinh chỉ chán học Lịch sử trên trường
                </p>
                <p className="text-xs font-light italic text-[var(--accent-gold)] md:text-sm lg:text-base">
                  chứ không học sinh nào chán lịch sử dân tộc cả!&quot;
                </p>
              </div>

              <div className="hero-stagger-item flex items-center gap-3 pt-1 lg:pt-4 [&>button:last-child]:hidden">
                <button
                  type="button"
                  aria-label="Xem video giới thiệu"
                  onClick={() => setIsVideoOpen(true)}
                  className="grid h-[50px] w-[50px] shrink-0 place-items-center rounded-full border border-white/15 bg-white/[0.04] text-white backdrop-blur-md transition-all duration-300 hover:border-[var(--accent-gold)] hover:bg-[var(--accent-gold)]/10 hover:text-[var(--accent-gold)] active:scale-95 lg:h-[58px] lg:w-[58px]"
                >
                  <Play className="h-5 w-5 translate-x-0.5 fill-current lg:h-6 lg:w-6" />
                </button>
                <MarketingButton
                  href="/home"
                  className="flex min-w-0 flex-1 lg:inline-flex lg:w-auto lg:flex-none lg:overflow-visible"
                >
                  TRẢI NGHIỆM NGAY
                </MarketingButton>
                <button
                  type="button"
                  aria-label="Xem video giới thiệu"
                  onClick={() => setIsVideoOpen(true)}
                  className="grid h-[50px] w-[50px] shrink-0 place-items-center rounded-full border border-white/15 bg-white/[0.04] text-white backdrop-blur-md transition-all duration-300 hover:border-[var(--accent-gold)] hover:bg-[var(--accent-gold)]/10 hover:text-[var(--accent-gold)] active:scale-95 lg:h-[58px] lg:w-[58px]"
                >
                  <Play className="h-5 w-5 translate-x-0.5 fill-current lg:h-6 lg:w-6" />
                </button>
              </div>
            </div>
          </div>

          <div
            ref={carouselRef}
            className="relative -mx-4 mt-1 flex h-[310px] min-h-0 w-[calc(100%+2rem)] shrink-0 items-center justify-center overflow-hidden will-change-transform sm:mx-0 sm:h-[340px] sm:w-full md:h-[500px] lg:mt-0 lg:h-[650px] lg:overflow-visible"
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
      {isVideoOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 px-4 backdrop-blur-md">
          <button
            type="button"
            aria-label="Đóng video"
            onClick={() => setIsVideoOpen(false)}
            className="absolute inset-0"
          />
          <div className="relative z-10 w-full max-w-5xl overflow-hidden rounded-lg border border-white/15 bg-black shadow-[0_30px_90px_rgba(0,0,0,0.65)]">
            <button
              type="button"
              aria-label="Đóng"
              onClick={() => setIsVideoOpen(false)}
              className="absolute right-3 top-3 z-20 grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-black/55 text-white backdrop-blur-md transition-colors hover:border-[var(--accent-gold)] hover:text-[var(--accent-gold)]"
            >
              <X className="h-4 w-4" />
            </button>
            <video
              className="aspect-video w-full bg-black object-cover"
              src="/TVC.mp4"
              autoPlay
              controls
              playsInline
              preload="none"
            >
              Trình duyệt của bạn không hỗ trợ video.
            </video>
          </div>
        </div>
      )}
    </section>
  );
}
