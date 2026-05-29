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
  default: "text-[#e7ddc8]",
  gold: "text-[var(--accent-gold)]",
  blue: "text-[#8fb3c8]",
  gradient:
    "bg-gradient-to-r from-[#e7ddc8] via-[var(--accent-gold)] to-[#8fb3c8] bg-clip-text text-transparent",
  warm: "text-[#FAB95B]",
  cream: "text-[#f5ecd9]",
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
          "text-3xl md:text-4xl lg:text-5xl font-bold mb-4",
          variantStyles[variant]
        )}
      >
        {title}
      </h2>
      {subtitle && (
        <p className="text-lg md:text-xl text-[var(--text-secondary)] max-w-3xl mx-auto">
          {subtitle}
        </p>
      )}
    </div>
  );
}