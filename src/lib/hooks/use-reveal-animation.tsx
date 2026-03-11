"use client";

import { useEffect } from "react";

/**
 * useRevealAnimation
 * Safe for React — does NOT manipulate innerHTML.
 * Animates elements with [data-reveal] when they enter the viewport.
 *
 * data-reveal="block"  → fade + slide up (for any element)
 * data-reveal="fast"   → same but quicker, for headings
 */
export function useRevealAnimation(
  ref: React.RefObject<HTMLElement | HTMLDivElement | null>,
) {
  useEffect(() => {
    let ctx: { revert: () => void } | null = null;

    const init = async () => {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);
      if (!ref.current) return;

      // ✅ Pre-hide elements TRƯỚC khi ScrollTrigger init
      // Tránh flash visible → invisible → animate
      const fastEls = ref.current.querySelectorAll("[data-reveal='fast']");
      const blockEls = ref.current.querySelectorAll("[data-reveal='block']");

      if (fastEls.length) gsap.set(fastEls, { y: 40, opacity: 0 });
      if (blockEls.length) gsap.set(blockEls, { y: 28, opacity: 0 });

      ctx = gsap.context(() => {
        if (fastEls.length) {
          gsap.to(fastEls, {
            // ✅ dùng gsap.to thay vì gsap.from
            y: 0,
            opacity: 1,
            duration: 0.55,
            ease: "power3.out",
            stagger: 0.08,
            scrollTrigger: {
              trigger: ref.current,
              start: "top 85%",
              toggleActions: "play none none none",
            },
          });
        }

        if (blockEls.length) {
          gsap.to(blockEls, {
            // ✅ dùng gsap.to thay vì gsap.from
            y: 0,
            opacity: 1,
            duration: 0.65,
            ease: "power3.out",
            stagger: 0.12,
            scrollTrigger: {
              trigger: ref.current,
              start: "top 80%",
              toggleActions: "play none none none",
            },
          });
        }
      }, ref);
    };

    init();
    return () => {
      ctx?.revert();
    };
  }, []);
}
