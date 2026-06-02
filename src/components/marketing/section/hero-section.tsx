"use client";

import { useEffect, useRef, useState, lazy, Suspense } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import TypingText from "@/components/commons/TypingText";
import TypingTextBody from "@/components/commons/TypingTextBody";
import MaskedText from "@/components/commons/MaskedText";
import { cn } from "@/lib/utils/cn";
import { Container } from "../container";

// Lazy load carousel để giảm initial render load
const Carousel3DVertical = lazy(() => import("./vertical-carousel").then(m => ({ default: m.Carousel3DVertical })));

// Simple placeholder cho carousel
const CarouselPlaceholder = () => (
  <div className="flex items-center justify-center h-full">
    <div className="w-32 h-32 rounded-full bg-[var(--bg-surface)] animate-pulse" />
  </div>
);

gsap.registerPlugin(ScrollTrigger);

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const contentWrapperRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const subContentRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [showCarousel, setShowCarousel] = useState(false);

  // Defer animations để tránh chạy ngay lập tức khi mount
  useEffect(() => {
    // Phase 1: Cho phép render content tĩnh trước
    const rafId = requestAnimationFrame(() => {
      setIsReady(true);
      
      // Phase 2: Defer carousel load để tránh lag initial render
      const loadCarousel = () => setShowCarousel(true);
      
      if (typeof window !== "undefined" && "requestIdleCallback" in window) {
        (window as Window & { requestIdleCallback: typeof requestIdleCallback }).requestIdleCallback(loadCarousel, { timeout: 200 });
      } else {
        setTimeout(loadCarousel, 150);
      }
    });

    return () => cancelAnimationFrame(rafId);
  }, []);

  useEffect(() => {
    if (!isReady) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ 
        defaults: { ease: "power2.out" },
        delay: 0.1 // Nhỏ delay để đảm bảo browser đã render xong
      });

      tl.fromTo(
        ".typing-title .char",
        { opacity: 0, x: -20 },
        { opacity: 1, x: 0, duration: 0.05, stagger: 0.03 },
      )
        .fromTo(
          ".typing-subtitle .char",
          { opacity: 0, x: -20 },
          { opacity: 1, x: 0, duration: 0.04, stagger: 0.025 },
          "-=0.3",
        )
        .fromTo(
          subContentRef.current,
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 1 },
          "-=0.5",
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

    return () => ctx.revert();
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
              <TypingText text="HISTORY TALK" className="typing-title" />
              <span className="text-subtitle mt-2 block font-normal normal-case text-[var(--text-tertiary)]">
                <TypingTextBody
                  text="Khi lịch sử trở nên sống động"
                  className="typing-subtitle"
                />
              </span>
            </h1>

            <div ref={subContentRef} className="space-y-5 opacity-0 lg:space-y-8">
              <MaskedText>
                <p className="text-sm md:text-base lg:text-lg leading-relaxed max-w-xl text-[var(--text-secondary)]">
                  Trò chuyện trực tiếp với các nhân vật lịch sử được tái hiện bằng AI. Khám phá quá khứ như một hành trình có bối cảnh, cảm xúc và lựa chọn.
                </p>
              </MaskedText>

              <div className="my-3 md:my-4 space-y-0.5 border-l-2 border-[var(--accent-gold)]/40 py-2 pl-4 md:py-3 md:pl-5 lg:pl-6">
                <p className="text-sm md:text-base font-light italic text-[var(--text-primary)]">
                  &quot;Học sinh chỉ chán học Lịch sử trên trường
                </p>
                <p className="text-sm md:text-base font-light italic text-[var(--accent-gold)]">
                  chứ không học sinh nào chán lịch sử dân tộc cả!&quot;
                </p>
              </div>

              <div className="pt-2 lg:pt-4">
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
          >
            {showCarousel ? (
              <Suspense fallback={<CarouselPlaceholder />}>
                <Carousel3DVertical />
              </Suspense>
            ) : (
              <CarouselPlaceholder />
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
