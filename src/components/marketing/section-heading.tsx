import { cn } from "@/lib/utils/cn";

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  centered?: boolean;
  className?: string;
}

export function SectionHeading({
  title,
  subtitle,
  centered = true,
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "mb-12 md:mb-16",
        centered && "text-center",
        className
      )}
    >
      <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#e7ddc8] mb-4">
        {title}
      </h2>
      {subtitle && (
        <p className="text-lg md:text-xl text-[#9a948c] max-w-3xl mx-auto">
          {subtitle}
        </p>
      )}
    </div>
  );
}