"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Container } from "../container";
import { Carousel3DVertical } from "./vertical-carousel";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import TypingText from "@/components/commons/TypingText";
import MaskedText from "@/components/commons/MaskedText";
import { cn } from "@/lib/utils/cn";

gsap.registerPlugin(ScrollTrigger);

export function HeroSection() {
  const sectionRef = useRef(null);
  const contentWrapperRef = useRef(null);
  const carouselRef = useRef(null);
  const subContentRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

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
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden min-h-[100svh] flex flex-col lg:items-center lg:justify-center"
      style={{ isolation: "isolate" }}
    >
      {/* ── BACKGROUND GRADIENT LAYERS ──
          Dùng z-0 (KHÔNG dùng -z-10) để gradient nằm trên bg của parent
          nhưng dưới content (z-10+).
      */}

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 0,
          background:
            "radial-gradient(ellipse 120% 70% at 60% 100%, #ff9215 0%, rgba(255,146,21,0.3) 50%, transparent 90%)",
        }}
      />

      {/* Content phải có z-index > 0 để nằm trên gradient */}
      <Container className="w-full relative">
        <div className="flex flex-col lg:grid lg:grid-cols-2 lg:gap-20 lg:items-center lg:py-10">
          {/* TEXT CONTENT */}
          <div
            ref={contentWrapperRef}
            className="z-10 will-change-transform pt-24 pb-6 lg:pt-0 lg:pb-0 space-y-5 lg:space-y-8"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-5xl xl:text-6xl font-bold leading-[1.1] text-[var(--text-primary)]">
              <TypingText text="HISTORY TALK" className="typing-title" />
              <span className="block text-[var(--text-tertiary)] text-xl sm:text-2xl mt-2">
                <TypingText
                  text="Khi lịch sử trở nên sống động"
                  className="typing-subtitle"
                />
              </span>
            </h1>

            <div
              ref={subContentRef}
              className="space-y-5 lg:space-y-8 opacity-0"
            >
              <MaskedText>
                <p className="text-sm sm:text-base lg:text-lg text-[var(--text-secondary)] leading-relaxed max-w-xl">
                  Chúng tôi giúp thế hệ trẻ trên toàn thế giới hiểu sâu sắc về
                  lịch sử nhân loại bằng cách cho họ trò chuyện với các nhân vật
                  lịch sử được mô phỏng.
                </p>
              </MaskedText>

              <div className="py-2 space-y-0.5 border-l-2 border-[var(--accent-gold)]/30 pl-4 lg:pl-6">
                <p className="text-sm lg:text-base text-[var(--text-primary)] font-medium italic">
                  "Học sinh không ghét lịch sử.
                </p>
                <p className="text-sm lg:text-base text-[var(--accent-gold)] font-medium italic">
                  Họ ghét cách lịch sử được dạy."
                </p>
              </div>

              <div className="pt-2 lg:pt-4">
                <Link
                  href="/home"
                  className={cn(
                    "group relative",
                    "w-full lg:w-auto",
                    "flex lg:inline-flex items-center justify-center",
                    "px-6 lg:px-8 py-3.5 lg:py-4",
                    "text-sm lg:text-base font-semibold tracking-wider",
                    "bg-white/[0.03] backdrop-blur-md text-white",
                    "border border-white/10",
                    "overflow-visible",
                    "transition-all duration-300",
                    "hover:bg-white/[0.08] hover:border-white/20",
                    "active:scale-[0.98]",
                  )}
                >
                  <span className="absolute top-0 left-0 h-[1.5px] w-full bg-[var(--text-tertiary)] transition-transform duration-700 ease-out scale-x-0 origin-left group-hover:scale-x-[1.15] -translate-x-[7.5%]" />
                  <span className="absolute bottom-0 left-0 h-[1.5px] w-full bg-[var(--text-tertiary)] transition-transform duration-700 ease-out scale-x-0 origin-right group-hover:scale-x-[1.15] translate-x-[7.5%]" />
                  <span className="absolute left-0 top-0 w-[1.5px] h-full bg-[var(--text-tertiary)] transition-transform duration-700 ease-out scale-y-0 origin-bottom group-hover:scale-y-[1.3] translate-y-[15%]" />
                  <span className="absolute right-0 top-0 w-[1.5px] h-full bg-[var(--text-tertiary)] transition-transform duration-700 ease-out scale-y-0 origin-top group-hover:scale-y-[1.3] -translate-y-[15%]" />
                  <span className="relative z-20">TRẢI NGHIỆM NGAY</span>
                </Link>
              </div>
            </div>
          </div>

          {/* CAROUSEL */}
          {/* Carousel inner glow — đặt NGOÀI div overflow-hidden */}
          <div
            ref={carouselRef}
            className={cn(
              "relative w-full will-change-transform",
              "flex justify-center items-center",
              "h-[300px] sm:h-[380px] lg:h-[650px]",
              "lg:overflow-visible",
            )}
          >

            <Carousel3DVertical />
          </div>
        </div>
      </Container>
    </section>
  );
}
