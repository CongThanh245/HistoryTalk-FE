import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils/cn";

const textVariants = cva("", {
  variants: {
    tone: {
      heading: "text-content-heading",
      body: "text-content-text",
      muted: "text-content-muted",
      subtle: "text-content-subtle",
      accent: "text-accent-gold",
      inverse: "text-text-inverse",
      success: "text-status-success",
      danger: "text-accent-danger",
    },
    size: {
      hero: "text-hero font-bold",
      section: "text-section font-bold",
      title: "text-title font-semibold",
      subtitle: "text-subtitle font-semibold",
      lead: "text-lead",
      body: "text-body",
      small: "text-small",
      xs: "text-xs",
      micro: "text-micro",
    },
  },
  defaultVariants: {
    tone: "body",
    size: "body",
  },
});

export interface ThemedTextProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof textVariants> {
  as?: "p" | "span" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "label";
}

export function ThemedText({
  as: Tag = "p",
  tone,
  size,
  className,
  ...props
}: ThemedTextProps) {
  return (
    <Tag className={cn(textVariants({ tone, size }), className)} {...props} />
  );
}

export { textVariants };
