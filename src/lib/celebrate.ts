"use client";

/**
 * Tiny app-wide celebration bus: any screen can cheer, the floating mascot
 * companion reacts (happy pose + speech bubble). No-op when nothing listens.
 */
const EVENT = "ht:celebrate";

export interface CelebrateDetail {
  text: string;
  /** Rain confetti too (milestones). */
  confetti?: boolean;
}

export function celebrate(detail: CelebrateDetail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<CelebrateDetail>(EVENT, { detail }));
}

export function onCelebrate(handler: (detail: CelebrateDetail) => void) {
  const listener = (e: Event) => handler((e as CustomEvent<CelebrateDetail>).detail);
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
}

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Coins arc from `from` to the visible token balance (`[data-coin-target]`), then the balance bumps.
 * Falls back to the header streak chip when the sidebar is collapsed or hidden.
 */
export async function flyCoins(from: Element, count = 6) {
  if (typeof window === "undefined" || reducedMotion()) return;
  const target = Array.from(document.querySelectorAll("[data-coin-target]")).find((el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  });
  if (!target) return;

  const { gsap } = await import("gsap");
  const a = from.getBoundingClientRect();
  const b = target.getBoundingClientRect();
  const start = { x: a.left + a.width / 2, y: a.top + a.height / 2 };
  const end = { x: b.left + b.width / 2, y: b.top + b.height / 2 };

  const layer = document.createElement("div");
  layer.setAttribute("aria-hidden", "true");
  layer.className = "pointer-events-none fixed inset-0 z-[100]";
  document.body.appendChild(layer);

  const coins = Array.from({ length: count }, () => {
    const coin = document.createElement("span");
    coin.className = "fly-coin";
    coin.style.left = `${start.x - 9}px`;
    coin.style.top = `${start.y - 9}px`;
    layer.appendChild(coin);
    return coin;
  });

  const tl = gsap.timeline({ onComplete: () => layer.remove() });
  coins.forEach((coin, i) => {
    const spreadX = gsap.utils.random(-50, 50);
    const lift = gsap.utils.random(50, 110);
    tl.to(coin, { x: spreadX, y: -lift, scale: 1.15, duration: 0.32, ease: "power2.out" }, i * 0.06)
      .to(coin, { x: end.x - start.x, y: end.y - start.y, scale: 0.5, duration: 0.55, ease: "power2.in" }, i * 0.06 + 0.32)
      .to(coin, { opacity: 0, duration: 0.1 }, i * 0.06 + 0.82);
  });
  tl.fromTo(target, { scale: 1 }, { scale: 1.25, duration: 0.15, yoyo: true, repeat: 3, ease: "power1.inOut", clearProps: "transform" }, 0.8);
}
