import Image from "next/image";
import { cn } from "@/lib/utils/cn";

type BrandLogoProps = {
  showText?: boolean;
  animatedText?: boolean;
  animatedMark?: boolean;
  glow?: "red" | "warm";
  markClassName?: string;
  textClassName?: string;
  className?: string;
  priority?: boolean;
};

export function BrandLogo({
  showText = true,
  animatedText = false,
  animatedMark = false,
  glow = "red",
  markClassName,
  textClassName,
  className,
  priority = false,
}: BrandLogoProps) {
  const brandText = "HistoryTalk";
  const isWarmGlow = glow === "warm";

  return (
    <span className={cn("brand-logo-root inline-flex items-center gap-2.5", className)}>
      {animatedText && (
        <style>{`
          .brand-logo-root .brand-logo-letter {
            display: inline-block;
            transform: translateY(0);
          }

          .brand-logo-root:hover .brand-logo-letter {
            animation: brand-logo-letter-drop 0.58s cubic-bezier(0.22, 1, 0.36, 1) both;
          }

          @keyframes brand-logo-letter-drop {
            0% { transform: translateY(0); }
            42% { transform: translateY(-7px); }
            72% { transform: translateY(2px); }
            100% { transform: translateY(0); }
          }
        `}</style>
      )}
      {animatedMark && (
        <style>{`
          .brand-logo-root .brand-logo-mark {
            animation: brand-logo-hourglass 3.2s cubic-bezier(0.65, 0, 0.35, 1) infinite;
            transform-origin: center;
          }

          @keyframes brand-logo-hourglass {
            0%, 18% { transform: rotate(0deg); }
            42%, 58% { transform: rotate(180deg); }
            82%, 100% { transform: rotate(360deg); }
          }
        `}</style>
      )}

      <span
        className={cn(
          "brand-logo-mark",
          "relative flex h-9 w-9 shrink-0 items-center justify-center overflow-visible border-0 bg-transparent shadow-none before:absolute before:left-1/2 before:top-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:rounded-full before:content-['']",
          isWarmGlow
            ? "before:h-10 before:w-10 before:bg-[radial-gradient(circle,rgba(255,146,21,0.34)_0%,rgba(255,146,21,0.16)_38%,transparent_70%)] before:blur-[4px]"
            : "before:h-5 before:w-5 before:bg-[radial-gradient(circle,rgba(114,56,61,0.24)_0%,rgba(114,56,61,0.14)_28%,rgba(114,56,61,0.07)_52%,transparent_78%)] before:blur-[1.5px]",
          markClassName,
        )}
      >
        <Image
          src="/historytalk-logo.png"
          alt="HistoryTalk logo"
          fill
          sizes="40px"
          priority={priority}
          className={cn(
            "relative z-10 object-contain saturate-[1.35] contrast-[1.14]",
            isWarmGlow
              ? "drop-shadow-[0_0_5px_rgba(255,146,21,0.6)]"
              : "drop-shadow-[0_0_4px_rgba(114,56,61,0.5)]",
          )}
        />
      </span>

      {showText && (
        <span
          className={cn(
            "text-[15px] font-bold tracking-wide text-[var(--text-primary)]",
            textClassName,
          )}
          style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
          aria-label={animatedText ? brandText : undefined}
        >
          {animatedText
            ? brandText.split("").map((letter, index) => (
                <span
                  key={`${letter}-${index}`}
                  aria-hidden="true"
                  className={cn(
                    "brand-logo-letter",
                    index >= 7 ? "text-[var(--accent-gold)]" : "",
                  )}
                  style={{ animationDelay: `${index * 34}ms` }}
                >
                  {letter}
                </span>
              ))
            : (
                <>
                  History<span className="text-[var(--accent-gold)]">Talk</span>
                </>
              )}
        </span>
      )}
    </span>
  );
}
