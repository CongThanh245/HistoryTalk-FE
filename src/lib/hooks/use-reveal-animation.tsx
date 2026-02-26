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
  ref: React.RefObject<HTMLElement | HTMLDivElement | null>
) {
  useEffect(() => {
    let ctx: { revert: () => void } | null = null;

    const init = async () => {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);

      if (!ref.current) return;

      ctx = gsap.context(() => {
        // Headings: fast slide up
        const fastEls = ref.current!.querySelectorAll("[data-reveal='fast']");
        if (fastEls.length) {
          gsap.from(fastEls, {
            y: 40,
            opacity: 0,
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

        // Blocks: slightly slower, more stagger
        const blockEls = ref.current!.querySelectorAll("[data-reveal='block']");
        if (blockEls.length) {
          gsap.from(blockEls, {
            y: 28,
            opacity: 0,
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
    return () => { ctx?.revert(); };
  }, []);
}