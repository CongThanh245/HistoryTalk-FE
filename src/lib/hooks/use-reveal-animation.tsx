"use client";

import { useEffect } from "react";

/**
 * Shared landing-page motion.
 *
 * data-reveal="fast"       masked title reveal
 * data-reveal="block"      blurred content reveal
 * data-reveal="float"      3D float-in card reveal
 * data-motion-card         hover tilt + pointer spotlight variables
 */
export function useRevealAnimation(
  ref: React.RefObject<HTMLElement | HTMLDivElement | null>,
) {
  useEffect(() => {
    let ctx: { revert: () => void } | null = null;
    const cleanups: Array<() => void> = [];

    const init = async () => {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);

      const root = ref.current;
      if (!root) return;
      const scrollRoot = root.closest<HTMLElement>("[data-marketing-scroll]");
      const isScrollContainer = scrollRoot
        ? ["scroll", "auto"].includes(getComputedStyle(scrollRoot).overflowY)
        : false;
      const scroller = isScrollContainer ? scrollRoot : undefined;

      const fastEls = root.querySelectorAll("[data-reveal='fast']");
      const blockEls = root.querySelectorAll("[data-reveal='block']");
      const floatEls = root.querySelectorAll("[data-reveal='float']");
      const motionCards = root.querySelectorAll<HTMLElement>("[data-motion-card]");

      if (fastEls.length) {
        gsap.set(fastEls, {
          y: 56,
          opacity: 0,
          rotateX: -18,
          filter: "blur(12px)",
          clipPath: "inset(0 0 100% 0)",
          transformOrigin: "50% 100%",
        });
      }
      if (blockEls.length) {
        gsap.set(blockEls, {
          y: 36,
          opacity: 0,
          filter: "blur(10px)",
          clipPath: "inset(12% 0 0 0)",
        });
      }
      if (floatEls.length) {
        gsap.set(floatEls, {
          y: 72,
          opacity: 0,
          rotateX: 14,
          scale: 0.92,
          filter: "blur(14px)",
          transformOrigin: "50% 100%",
        });
      }
      ctx = gsap.context(() => {
        if (fastEls.length) {
          gsap.to(fastEls, {
            y: 0,
            opacity: 1,
            rotateX: 0,
            filter: "blur(0px)",
            clipPath: "inset(0 0 0% 0)",
            duration: 0.82,
            ease: "expo.out",
            stagger: 0.1,
            scrollTrigger: {
              trigger: root,
              scroller,
              start: "top 85%",
              toggleActions: "play none none none",
            },
          });
        }

        if (blockEls.length) {
          gsap.to(blockEls, {
            y: 0,
            opacity: 1,
            filter: "blur(0px)",
            clipPath: "inset(0% 0 0 0)",
            duration: 0.78,
            ease: "power4.out",
            stagger: 0.14,
            scrollTrigger: {
              trigger: root,
              scroller,
              start: "top 80%",
              toggleActions: "play none none none",
            },
          });
        }

        if (floatEls.length) {
          gsap.to(floatEls, {
            y: 0,
            opacity: 1,
            rotateX: 0,
            scale: 1,
            filter: "blur(0px)",
            duration: 0.9,
            ease: "expo.out",
            stagger: 0.12,
            scrollTrigger: {
              trigger: root,
              scroller,
              start: "top 76%",
              toggleActions: "play none none none",
            },
          });
        }

      }, ref);
      requestAnimationFrame(() => ScrollTrigger.refresh());

      motionCards.forEach((card) => {
        card.style.setProperty("--motion-x", "50%");
        card.style.setProperty("--motion-y", "50%");
        card.style.transformStyle = "preserve-3d";

        const onPointerMove = (event: PointerEvent) => {
          const rect = card.getBoundingClientRect();
          const x = event.clientX - rect.left;
          const y = event.clientY - rect.top;
          const rotateX = ((y / rect.height) - 0.5) * -5;
          const rotateY = ((x / rect.width) - 0.5) * 5;

          card.style.setProperty("--motion-x", `${x}px`);
          card.style.setProperty("--motion-y", `${y}px`);
          gsap.to(card, {
            rotateX,
            rotateY,
            y: -4,
            duration: 0.28,
            ease: "power2.out",
            overwrite: "auto",
          });
        };

        const onPointerLeave = () => {
          gsap.to(card, {
            rotateX: 0,
            rotateY: 0,
            y: 0,
            duration: 0.45,
            ease: "power3.out",
            overwrite: "auto",
          });
        };

        card.addEventListener("pointermove", onPointerMove);
        card.addEventListener("pointerleave", onPointerLeave);
        cleanups.push(() => {
          card.removeEventListener("pointermove", onPointerMove);
          card.removeEventListener("pointerleave", onPointerLeave);
        });
      });
    };

    init();

    return () => {
      cleanups.forEach((cleanup) => cleanup());
      ctx?.revert();
    };
  }, [ref]);
}
