"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Container } from "../container";
import { Carousel3DVertical } from "./vertical-carousel";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function HeroSection() {
  const sectionRef = useRef(null);
  const contentWrapperRef = useRef(null);
  const carouselRef = useRef(null);
  const subContentRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // --- 1. ENTRANCE: Chỉ áp dụng cho Text bên trái ---
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.fromTo(
        ".reveal-text",
        { yPercent: 100, opacity: 0 },
        {
          yPercent: 0,
          opacity: 1,
          duration: 1.2,
          stagger: 0.1,
        }
      ).fromTo(
        subContentRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 1 },
        "-=0.8"
      );

      // --- 2. SCROLL: Cả 2 bên cùng biến mất dần khi cuộn ---
      // Ta gộp cả contentWrapper (trái) và carousel (phải) vào đây
      gsap.to([contentWrapperRef.current, carouselRef.current], {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",      // Bắt đầu mờ khi section chạm đỉnh
          end: "bottom 20%",     // Biến mất hoàn toàn khi cuộn được 80% section
          scrub: true,           // Mờ theo tốc độ ngón tay cuộn
        },
        opacity: 0,
        y: -100,                 // Cùng bay lên trên
        ease: "none",
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const MaskedText = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
    <div className={`overflow-hidden ${className}`}>
      <div className="reveal-text inline-block w-full">
        {children}
      </div>
    </div>
  );

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden min-h-[90vh] flex items-center"
    >
      {/* Background Decor */}
      <div className="absolute inset-0 -z-10 opacity-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--accent-gold)] rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[var(--accent-blue)] rounded-full blur-3xl" />
      </div>

      <Container>
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          
          {/* ===== LEFT SIDE: Text Content (Animation kiểu Arclin) ===== */}
          <div ref={contentWrapperRef} className="space-y-8 z-10 will-change-transform">
            <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold leading-[1.15] text-[var(--text-primary)]">
              <MaskedText>History Talk</MaskedText>
              <MaskedText className="mt-2">
                <span className="block text-[var(--accent-gold)] text-2xl">
                  Khi lịch sử trở nên sống động
                </span>
              </MaskedText>
            </h1>

            <div ref={subContentRef} className="space-y-8 opacity-0">
              <MaskedText>
                <p className="text-base md:text-lg text-[var(--text-secondary)] leading-relaxed max-w-xl">
                  Chúng tôi giúp thế hệ trẻ trên toàn thế giới hiểu sâu sắc về lịch
                  sử nhân loại bằng cách cho họ trò chuyện với các nhân vật lịch sử
                  được mô phỏng.
                </p>
              </MaskedText>

              <div className="py-2 space-y-1 border-l-2 border-[var(--accent-gold)]/30 pl-6">
                <p className="text-sm md:text-base text-[var(--text-primary)] font-medium italic">
                  "Học sinh không ghét lịch sử.
                </p>
                <p className="text-sm md:text-base text-[var(--accent-gold)] font-medium italic">
                  Họ ghét cách lịch sử được dạy."
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-4">
                <Link
                  href="/app"
                  className="group relative px-8 py-4 text-base font-semibold bg-white/[0.03] backdrop-blur-md text-white border border-white/10 inline-flex items-center gap-2 overflow-visible transition-all duration-300 hover:bg-white/[0.08] hover:border-white/20"
                >
                  <span className="absolute top-0 left-0 h-[1.5px] w-full bg-accent-gold transition-transform duration-700 ease-out scale-x-0 origin-left group-hover:scale-x-[1.15] -translate-x-[7.5%]"></span>
                  <span className="absolute bottom-0 left-0 h-[1.5px] w-full bg-accent-gold transition-transform duration-700 ease-out scale-x-0 origin-right group-hover:scale-x-[1.15] translate-x-[7.5%]"></span>
                  <span className="absolute left-0 top-0 w-[1.5px] h-full bg-accent-gold transition-transform duration-700 ease-out scale-y-0 origin-bottom group-hover:scale-y-[1.3] translate-y-[15%]"></span>
                  <span className="absolute right-0 top-0 w-[1.5px] h-full bg-accent-gold transition-transform duration-700 ease-out scale-y-0 origin-top group-hover:scale-y-[1.3] -translate-y-[15%]"></span>
                  <span className="relative z-20 tracking-wider">TRẢI NGHIỆM NGAY</span>
                </Link>
              </div>
            </div>
          </div>

          {/* ===== RIGHT SIDE: Carousel (Hiện ngay lập tức, mờ đi khi cuộn) ===== */}
          <div ref={carouselRef} className="relative w-full flex justify-center items-center will-change-transform">
            <div className="absolute inset-0 bg-[var(--accent-gold)] opacity-10 blur-[80px] rounded-full scale-75" />
            <div className="w-full max-w-[500px] lg:max-w-none">
              <Carousel3DVertical />
            </div>
          </div>

        </div>
      </Container>
    </section>
  );
}