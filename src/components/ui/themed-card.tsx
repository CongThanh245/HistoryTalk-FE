import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils/cn";

const themedCardVariants = cva(
  "rounded-lg border transition-colors",
  {
    variants: {
      surface: {
        default: "bg-card-bg border-card-border",
        elevated: "bg-bg-elevated border-border-strong",
        interactive: "bg-card-bg border-card-border hover:bg-card-hover cursor-pointer",
        ghost: "bg-transparent border-transparent",
      },
      padding: {
        none: "",
        sm: "p-3",
        md: "p-4",
        lg: "p-6",
      },
    },
    defaultVariants: {
      surface: "default",
      padding: "md",
    },
  },
);

export interface ThemedCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof themedCardVariants> {}

export const ThemedCard = React.forwardRef<HTMLDivElement, ThemedCardProps>(
  ({ surface, padding, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(themedCardVariants({ surface, padding }), className)}
      {...props}
    />
  ),
);
ThemedCard.displayName = "ThemedCard";

export { themedCardVariants };
