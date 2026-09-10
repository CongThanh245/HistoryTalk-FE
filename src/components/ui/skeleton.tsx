import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils/cn";

const skeletonVariants = cva(
  "animate-pulse bg-card-border/60 rounded-md",
  {
    variants: {
      variant: {
        default: "",
        text: "h-4 w-full rounded-sm",
        circle: "rounded-full aspect-square",
        card: "h-40 w-full rounded-lg",
        image: "h-48 w-full rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {}

function Skeleton({ className, variant, ...props }: SkeletonProps) {
  return (
    <div
      data-slot="skeleton"
      className={cn(skeletonVariants({ variant }), className)}
      {...props}
    />
  );
}

/** Multi-line text skeleton placeholder */
function SkeletonText({
  lines = 3,
  className,
  ...props
}: SkeletonProps & { lines?: number }) {
  return (
    <div className={cn("flex flex-col gap-2", className)} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            skeletonVariants({ variant: "text" }),
            i === lines - 1 && "w-2/3",
          )}
        />
      ))}
    </div>
  );
}

/** Card-shaped skeleton with header + body lines */
function SkeletonCard({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-lg border border-card-border p-4",
        className,
      )}
      {...props}
    >
      <div className={cn(skeletonVariants({ variant: "image" }), "h-32")} />
      <div className="flex flex-col gap-2">
        <div className={cn(skeletonVariants({ variant: "text" }), "h-5 w-1/2")} />
        <div className={skeletonVariants({ variant: "text" })} />
        <div className={cn(skeletonVariants({ variant: "text" }), "w-4/5")} />
      </div>
    </div>
  );
}

/** Circular avatar skeleton */
function SkeletonAvatar({
  size = "md",
  className,
  ...props
}: SkeletonProps & { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "size-8",
    md: "size-10",
    lg: "size-14",
  };

  return (
    <div
      className={cn(
        skeletonVariants({ variant: "circle" }),
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton, SkeletonText, SkeletonCard, SkeletonAvatar, skeletonVariants };
