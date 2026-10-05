import { cn } from "@/lib/utils/cn";

type Variant = "default" | "gold" | "blue" | "gradient" | "warm" | "cream";

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  centered?: boolean;
  className?: string;
  variant?: Variant;
}

const variantStyles: Record<Variant, string> = {
  default: "",
  gold: "text-[var(--accent-gold)]",
  blue: "",
  gradient: "",
  warm: "text-[var(--accent-gold)]",
  cream: "",
};

export function SectionHeading({
  title,
  subtitle,
  centered = true,
  className,
  variant = "default",
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "mb-12 md:mb-16",
        centered && "text-center",
        className
      )}
    >
      <h2
        className={cn(
          "archive-title mb-4 text-[clamp(30px,4vw,52px)]",
          variantStyles[variant]
        )}
      >
        {title}
      </h2>
      <div
        className={cn("h-px w-16 bg-[var(--accent-gold)] mb-5", centered && "mx-auto")}
        aria-hidden="true"
      />
      {subtitle && (
        <p className={cn("text-base md:text-lg leading-relaxed text-[var(--text-secondary)] max-w-3xl", centered && "mx-auto")}>
          {subtitle}
        </p>
      )}
    </div>
  );
}