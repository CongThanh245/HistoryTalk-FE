"use client";

import React, { useId, useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { cn } from "@/lib/utils/cn";

export type MascotMood = "idle" | "thinking" | "happy" | "sad" | "timeout";
/** Holiday props: Tết mai branch, national-day flag, Trung thu star lantern, 20/11 flowers. */
export type MascotAccessory = "mai" | "flag" | "lantern" | "flowers";

interface MascotProps {
  mood?: MascotMood;
  /** Width in px; height follows the 5:6 viewBox. */
  size?: number;
  /** Arms for waving / gestures. Off = closer to the bare logo (and cleaner at small sizes). */
  arms?: boolean;
  className?: string;
  /** Accessible label; omit to treat the mascot as decoration. */
  label?: string;
  accessory?: MascotAccessory | null;
}

/*
 * HistoryTalk's hourglass logo as a character. The logo's two outer bars are the
 * glass, its glowing centre is the face and its vertical bar is the falling sand.
 * Geometry: frame bars cross at (100,117); the bulbs are the space inside them.
 */
const CENTER = "100 117";
const GROUND = "100 228";

// Sand surfaces are translated paths: top sand sinks, bottom pile rises.
const TOP_FULL = 40;
const TOP_HALF = 68;
const TOP_EMPTY = 100;
const BOTTOM_EMPTY = 202;
const BOTTOM_HALF = 168;
const BOTTOM_FULL = 140;

const INK = "#4A1206";
const FRAME_DARK = "#8E1B0A";

const SPARKLES = [
  { x: 30, y: 62, s: 1 },
  { x: 170, y: 56, s: 0.85 },
  { x: 20, y: 146, s: 0.7 },
  { x: 182, y: 150, s: 1 },
  { x: 100, y: 6, s: 0.75 },
  { x: 48, y: 14, s: 0.55 },
];

const ARM_PATHS: Record<MascotMood, { left: string; right: string }> = {
  idle: { left: "M74 124 Q64 134 62 146", right: "M126 124 Q136 134 138 146" },
  thinking: { left: "M74 124 Q64 134 62 146", right: "M126 124 Q134 142 116 141" },
  happy: { left: "M74 112 Q60 102 56 86", right: "M126 112 Q140 102 144 86" },
  sad: { left: "M75 127 Q70 141 70 153", right: "M125 127 Q130 141 130 153" },
  timeout: { left: "M74 118 Q60 112 64 98", right: "M126 118 Q140 112 136 98" },
};

/**
 * Where each accessory is attached to the frame (it is scaled up around this point so it
 * still reads at companion size) and the bbox origin it sways around.
 */
const ACCESSORY_MOUNT: Record<MascotAccessory, { at: [number, number]; sway: string }> = {
  mai: { at: [42, 28], sway: "100% 100%" },
  flowers: { at: [42, 28], sway: "100% 100%" },
  flag: { at: [172, 32], sway: "0% 100%" },
  lantern: { at: [164, 30], sway: "50% 0%" },
};
const ACCESSORY_SCALE = 1.6;

function Blossom({ x, y, petal, heart }: { x: number; y: number; petal: string; heart: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {[0, 72, 144, 216, 288].map((a) => (
        <circle key={a} cx={Math.cos((a * Math.PI) / 180) * 3.2} cy={Math.sin((a * Math.PI) / 180) * 3.2} r="2.9" fill={petal} />
      ))}
      <circle r="1.7" fill={heart} />
    </g>
  );
}

function Accessory({ type }: { type: MascotAccessory }) {
  if (type === "flag") {
    return (
      <g className="m-acc">
        <line x1="172" y1="32" x2="172" y2="0" stroke="#6B3B14" strokeWidth="3" strokeLinecap="round" />
        <path className="m-flag" d="M173 2 Q186 -3 199 2 V20 Q186 15 173 20Z" fill="#DA251D" />
        <path d="M186 5.5 L187.6 9.6 L192 9.8 L188.6 12.5 L189.8 16.8 L186 14.3 L182.2 16.8 L183.4 12.5 L180 9.8 L184.4 9.6Z" fill="#FFDE00" />
      </g>
    );
  }
  if (type === "lantern") {
    return (
      <g>
        <path d="M164 30 Q178 22 186 4" stroke="#6B3B14" strokeWidth="3" strokeLinecap="round" fill="none" />
        <g className="m-acc">
          <line x1="186" y1="4" x2="186" y2="12" stroke="#6B3B14" strokeWidth="1.5" />
          <path
            d="M186 12 L189.2 20.6 L198.4 21 L191.2 26.7 L193.6 35.6 L186 30.5 L178.4 35.6 L180.8 26.7 L173.6 21 L182.8 20.6Z"
            fill="#E53935"
            stroke="#FFC107"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <circle cx="186" cy="25" r="3" fill="#FFE082" />
          <path d="M184 35 L183 44 M188 35 L189 44" stroke="#FFC107" strokeWidth="1.5" strokeLinecap="round" />
        </g>
      </g>
    );
  }
  const [petal, heart] = type === "mai" ? ["#FFD21F", "#E07A00"] : ["#FF8FB1", "#C2185B"];
  return (
    <g className="m-acc">
      <path d="M42 28 Q30 18 14 6 M28 17 Q30 8 38 2" stroke="#6B3B14" strokeWidth="2.6" strokeLinecap="round" fill="none" />
      <Blossom x={14} y={6} petal={petal} heart={heart} />
      <Blossom x={38} y={3} petal={petal} heart={heart} />
      <Blossom x={24} y={14} petal={petal} heart={heart} />
      <ellipse cx="33" cy="12" rx="3" ry="1.6" fill="#5C9E3A" transform="rotate(-30 33 12)" />
    </g>
  );
}

function pathEnd(path: string) {
  const [x, y] = path.split(" ").slice(-2).map(Number);
  return { x, y };
}

function Eye({ cx, cy, big }: { cx: number; cy: number; big?: boolean }) {
  return (
    <>
      <ellipse cx={cx} cy={cy} rx={big ? 4.2 : 3.5} ry={big ? 5.2 : 4.5} fill={INK} />
      <circle cx={cx + 1.2} cy={cy - 1.6} r={big ? 1.5 : 1.25} fill="#FFFFFF" />
    </>
  );
}

function Face({ mood }: { mood: MascotMood }) {
  const look = mood === "thinking" ? { dx: 1.6, dy: -1.8 } : { dx: 0, dy: 0 };

  return (
    <g stroke={INK} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none">
      {/* Brows carry most of the emotion at small sizes. */}
      {mood === "sad" && (
        <>
          <path d="M85 106 L93 103" />
          <path d="M115 106 L107 103" />
        </>
      )}
      {mood === "thinking" && (
        <>
          <path d="M86 105.5 L94 105.5" />
          <path d="M106 103 Q110.5 99.5 115 102" />
        </>
      )}
      {mood === "timeout" && (
        <>
          <path d="M85 103 Q89.5 99 94 101.5" />
          <path d="M115 103 Q110.5 99 106 101.5" />
        </>
      )}

      <g className="m-eyes" stroke="none">
        {mood === "happy" ? (
          <g stroke={INK} strokeWidth="2.8">
            <path d="M85.5 114 Q90 107.5 94.5 114" />
            <path d="M105.5 114 Q110 107.5 114.5 114" />
          </g>
        ) : (
          <g className="m-pupils">
            <Eye cx={90 + look.dx} cy={113 + look.dy} big={mood === "timeout"} />
            <Eye cx={110 + look.dx} cy={113 + look.dy} big={mood === "timeout"} />
          </g>
        )}
      </g>

      <ellipse cx="83" cy="122" rx="4" ry="2.8" fill="#FF6B4A" opacity="0.4" stroke="none" />
      <ellipse cx="117" cy="122" rx="4" ry="2.8" fill="#FF6B4A" opacity="0.4" stroke="none" />

      {mood === "idle" && <path d="M94.5 123 Q100 128.5 105.5 123" />}
      {mood === "thinking" && <path d="M96 126 Q100.5 124 105 126.5" />}
      {mood === "sad" && <path d="M94.5 128 Q100 122.5 105.5 128" />}
      {mood === "happy" && (
        <>
          <path d="M92 120.5 Q100 133.5 108 120.5 Z" fill={INK} />
          <path d="M96 127.5 Q100 125 104 127.5 Q100 131 96 127.5 Z" fill="#FF7A59" stroke="none" />
        </>
      )}
      {mood === "timeout" && <ellipse cx="100" cy="126.5" rx="3.6" ry="4.6" fill={INK} stroke="none" />}

      {mood === "sad" && <path className="m-tear" d="M113.5 118 q-2.6 4.2 0 6 q2.6 -1.8 0 -6Z" fill="#5BA8E8" stroke="none" />}
      {mood === "timeout" && <path className="m-sweat" d="M124 98 q-3 4.8 0 6.8 q3 -2 0 -6.8Z" fill="#7FC0F0" stroke="none" />}
    </g>
  );
}

/** HistoryTalk's hourglass logo, brought to life. Respects prefers-reduced-motion. */
export function Mascot({ mood = "idle", size = 120, arms = true, className, label, accessory }: MascotProps) {
  const root = useRef<SVGSVGElement>(null);
  const uid = useId().replace(/:/g, "");
  const id = (name: string) => `m-${name}-${uid}`;

  const done = mood === "timeout";
  const armPaths = ARM_PATHS[mood];

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // Entering a mood: a small pop so mood changes never look like a hard cut.
        gsap.from(".m-face", { scale: 0.88, svgOrigin: CENTER, duration: 0.4, ease: "back.out(3)" });

        gsap.timeline({ repeat: -1, repeatDelay: 2.8, delay: 1.2 })
          .to(".m-eyes", { scaleY: 0.1, svgOrigin: "100 113", duration: 0.07 })
          .to(".m-eyes", { scaleY: 1, svgOrigin: "100 113", duration: 0.1 });

        if (accessory) {
          gsap.fromTo(".m-acc", { rotation: -5 }, { rotation: 5, transformOrigin: ACCESSORY_MOUNT[accessory].sway, duration: 1.3, yoyo: true, repeat: -1, ease: "sine.inOut" });
          if (accessory === "flag") gsap.to(".m-flag", { scaleY: 0.86, transformOrigin: "0% 50%", duration: 0.5, yoyo: true, repeat: -1, ease: "sine.inOut" });
        }

        gsap.to(".m-halo", { scale: 1.12, opacity: 0.1, svgOrigin: CENTER, duration: 1.5, yoyo: true, repeat: -1, ease: "sine.inOut" });

        if (done) {
          gsap.timeline({ repeat: -1, repeatDelay: 1.1 })
            .to(".m-body", { x: -3, duration: 0.05 })
            .to(".m-body", { x: 3, duration: 0.05, yoyo: true, repeat: 5 })
            .to(".m-body", { x: 0, duration: 0.05 });
          gsap.fromTo(".m-sweat", { y: 0, opacity: 1 }, { y: 10, opacity: 0, duration: 1.1, repeat: -1, repeatDelay: 0.5, ease: "power1.in" });
          return;
        }

        const drain = { idle: 7, thinking: 1.3, happy: 3, sad: 10 }[mood];
        gsap.to(".m-stream", { strokeDashoffset: -14, duration: 0.3, repeat: -1, ease: "none" });
        gsap.timeline({ repeat: -1 })
          .set(".m-stream-group", { opacity: 1 })
          .fromTo(".m-sand-top", { y: TOP_FULL }, { y: TOP_EMPTY, duration: drain, ease: "none" })
          .fromTo(".m-sand-bottom", { y: BOTTOM_EMPTY }, { y: BOTTOM_FULL, duration: drain, ease: "none" }, "<")
          .set(".m-stream-group", { opacity: 0 })
          .to(".m-glass", { rotation: 180, svgOrigin: CENTER, duration: 0.6, ease: "back.inOut(1.4)" })
          .to(".m-face", { y: -5, duration: 0.3, yoyo: true, repeat: 1, ease: "sine.out" }, "<")
          // The frame is symmetric, so snapping back to 0° while the sand refills is invisible.
          .set(".m-glass", { rotation: 0, svgOrigin: CENTER });

        if (mood === "idle") {
          gsap.to(".m-body", { rotation: 2.5, svgOrigin: GROUND, duration: 2.4, yoyo: true, repeat: -1, ease: "sine.inOut" });
          gsap.timeline({ repeat: -1, repeatDelay: 3.5, delay: 2 })
            .to(".m-pupils", { x: 1.8, duration: 0.25, ease: "power2.out" })
            .to(".m-pupils", { x: -1.8, duration: 0.3, ease: "power2.inOut" }, "+=0.7")
            .to(".m-pupils", { x: 0, duration: 0.25, ease: "power2.out" }, "+=0.6");
          if (arms) gsap.to(".m-arm-r", { rotation: -6, svgOrigin: "126 124", duration: 1.2, yoyo: true, repeat: -1, ease: "sine.inOut" });
        }

        if (mood === "thinking") {
          gsap.to(".m-body", { rotation: -4, svgOrigin: GROUND, duration: 1.6, yoyo: true, repeat: -1, ease: "sine.inOut" });
          gsap.fromTo(
            ".m-dot",
            { opacity: 0, scale: 0.4, svgOrigin: "160 50" },
            { opacity: 1, scale: 1, duration: 0.35, stagger: 0.25, repeat: -1, repeatDelay: 0.6, yoyo: true, ease: "back.out(2)" },
          );
          if (arms) gsap.to(".m-arm-r", { rotation: 5, svgOrigin: "126 124", duration: 0.45, yoyo: true, repeat: -1, ease: "sine.inOut" });
        }

        if (mood === "happy") {
          gsap.timeline({ repeat: -1, repeatDelay: 0.2 })
            .to(".m-body", { y: -16, duration: 0.3, ease: "power2.out" })
            .to(".m-shadow", { scale: 0.7, opacity: 0.08, svgOrigin: "100 230", duration: 0.3, ease: "power2.out" }, "<")
            .to(".m-body", { y: 0, duration: 0.26, ease: "power2.in" })
            .to(".m-shadow", { scale: 1, opacity: 0.2, svgOrigin: "100 230", duration: 0.26, ease: "power2.in" }, "<")
            .to(".m-body", { scaleY: 0.93, scaleX: 1.05, svgOrigin: GROUND, duration: 0.08 })
            .to(".m-body", { scaleY: 1, scaleX: 1, svgOrigin: GROUND, duration: 0.2, ease: "back.out(3)" });
          if (arms) {
            gsap.to(".m-arm-l", { rotation: -16, svgOrigin: "74 112", duration: 0.24, yoyo: true, repeat: -1, ease: "sine.inOut" });
            gsap.to(".m-arm-r", { rotation: 16, svgOrigin: "126 112", duration: 0.24, yoyo: true, repeat: -1, ease: "sine.inOut" });
          }
          gsap.utils.toArray<SVGElement>(".m-sparkle").forEach((el, i) => {
            gsap.fromTo(
              el,
              { scale: 0, opacity: 0, rotation: 0, transformOrigin: "50% 50%" },
              { scale: 1, opacity: 1, rotation: 90, duration: 0.45, yoyo: true, repeat: -1, repeatDelay: 0.35, delay: i * 0.17, ease: "back.out(2)" },
            );
          });
        }

        if (mood === "sad") {
          gsap.to(".m-body", { y: 3, rotation: -3, svgOrigin: GROUND, duration: 2.6, yoyo: true, repeat: -1, ease: "sine.inOut" });
          gsap.fromTo(".m-tear", { y: 0, opacity: 1 }, { y: 12, opacity: 0, duration: 1.4, repeat: -1, repeatDelay: 0.9, ease: "power1.in" });
        }
      });
      return () => mm.revert();
    },
    { scope: root, dependencies: [mood, arms, accessory], revertOnUpdate: true },
  );

  return (
    <svg
      // Fresh DOM per mood: GSAP caches each element's transform origin, and switching
      // svgOrigin on an already-transformed group (idle sway → happy hop) left parts offset.
      key={`${mood}-${arms}-${accessory ?? ""}`}
      ref={root}
      viewBox="0 0 200 240"
      width={size}
      height={size * 1.2}
      className={cn("shrink-0 overflow-visible", className)}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <defs>
        {/* Same burst as the logo: gold at the crossing, deep red at the tips. */}
        <radialGradient id={id("bar")} cx="100" cy="117" r="118" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFAD00" />
          <stop offset="0.5" stopColor="#E27600" />
          <stop offset="1" stopColor="#9A0A00" />
        </radialGradient>
        <radialGradient id={id("core")} cx="0.38" cy="0.32" r="0.8">
          <stop offset="0" stopColor="#FFE9A8" />
          <stop offset="0.55" stopColor="#FFB81C" />
          <stop offset="1" stopColor="#F08A00" />
        </radialGradient>
        <linearGradient id={id("sand")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFDE7A" />
          <stop offset="1" stopColor="#E9A21F" />
        </linearGradient>
        <linearGradient id={id("cap")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#C2361A" />
          <stop offset="1" stopColor="#7A1408" />
        </linearGradient>
        <clipPath id={id("top")}>
          <polygon points="57,36 143,36 100,105" />
        </clipPath>
        <clipPath id={id("bottom")}>
          <polygon points="100,129 57,198 143,198" />
        </clipPath>
      </defs>

      <ellipse className="m-shadow" cx="100" cy="230" rx="44" ry="5" fill="#000000" opacity="0.2" />

      {mood === "happy" && (
        <g fill="#FFC83D">
          {SPARKLES.map((p, i) => (
            <g key={i} transform={`translate(${p.x} ${p.y}) scale(${p.s})`}>
              <path className="m-sparkle" d="M0 -9 Q1 -1 9 0 Q1 1 0 9 Q-1 1 -9 0 Q-1 -1 0 -9Z" opacity="0" />
            </g>
          ))}
        </g>
      )}

      {mood === "thinking" && (
        <g fill="#C9A06A">
          <circle className="m-dot" cx="150" cy="70" r="3" />
          <circle className="m-dot" cx="160" cy="56" r="4" />
          <circle className="m-dot" cx="172" cy="40" r="5.5" />
        </g>
      )}

      <g className="m-body">
        {/* Feet sit under the bottom cap so the hourglass reads as standing. */}
        <g fill={FRAME_DARK}>
          <ellipse cx="80" cy="219" rx="11" ry="6" />
          <ellipse cx="120" cy="219" rx="11" ry="6" />
        </g>

        <g className={cn("m-glass", mood === "sad" && "saturate-[0.7]")}>
          <polygon points="57,36 143,36 100,105" fill="#FFF3D6" opacity="0.12" />
          <polygon points="100,129 57,198 143,198" fill="#FFF3D6" opacity="0.12" />

          <g clipPath={`url(#${id("top")})`}>
            <path
              className="m-sand-top"
              transform={`translate(0 ${done ? TOP_EMPTY : TOP_HALF})`}
              d="M20 0 Q100 9 180 0 V120 H20Z"
              fill={`url(#${id("sand")})`}
            />
          </g>
          <g className="m-stream-group" opacity={done ? 0 : 1}>
            <line x1="100" y1="104" x2="100" y2="198" stroke="#FFD66B" strokeWidth="1.2" opacity="0.6" />
            <line
              className="m-stream"
              x1="100"
              y1="104"
              x2="100"
              y2="198"
              stroke="#FFE08A"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeDasharray="2.5 4.5"
            />
          </g>
          <g clipPath={`url(#${id("bottom")})`}>
            <path
              className="m-sand-bottom"
              transform={`translate(0 ${done ? BOTTOM_FULL : BOTTOM_HALF})`}
              d="M20 16 Q100 -12 180 16 V120 H20Z"
              fill={`url(#${id("sand")})`}
            />
          </g>

          {/* Glass glints */}
          <g stroke="#FFFFFF" strokeLinecap="round" opacity="0.45">
            <path d="M68 44 L83 68" strokeWidth="3" />
            <path d="M88 76 L91 81" strokeWidth="3" />
            <path d="M68 190 L76 177" strokeWidth="2.5" />
          </g>

          <g stroke={`url(#${id("bar")})`} strokeWidth="12" strokeLinecap="round">
            <line x1="48" y1="36" x2="152" y2="198" />
            <line x1="152" y1="36" x2="48" y2="198" />
          </g>

          {[24, 198].map((y) => (
            <g key={y}>
              <rect x="36" y={y} width="128" height="14" rx="7" fill={`url(#${id("cap")})`} />
              <rect x="44" y={y + 2.5} width="112" height="2.5" rx="1.25" fill="#FFFFFF" opacity="0.28" />
            </g>
          ))}
        </g>

        <g className="m-face">
          <circle className="m-halo" cx="100" cy="117" r="35" fill="#FFB000" opacity="0.22" />
          <circle cx="100" cy="117" r="27" fill={`url(#${id("core")})`} stroke="#C25A00" strokeWidth="2" />
          <path d="M84 104 Q90 96 99 95" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.5" />
          <Face mood={mood} />
        </g>

        {arms && (
          <g stroke={FRAME_DARK} strokeWidth="6" strokeLinecap="round" fill="none">
            {(["left", "right"] as const).map((side) => {
              const d = armPaths[side];
              const hand = pathEnd(d);
              return (
                <g key={side} className={side === "left" ? "m-arm-l" : "m-arm-r"}>
                  <path d={d} />
                  <circle cx={hand.x} cy={hand.y} r="6" fill="#FFB81C" strokeWidth="2.5" />
                </g>
              );
            })}
          </g>
        )}

        {accessory && (
          <g
            transform={`translate(${ACCESSORY_MOUNT[accessory].at.join(" ")}) scale(${ACCESSORY_SCALE}) translate(${ACCESSORY_MOUNT[accessory].at.map((v) => -v).join(" ")})`}
          >
            <Accessory type={accessory} />
          </g>
        )}
      </g>
    </svg>
  );
}
