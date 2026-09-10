import * as React from "react";

import { cn } from "@/lib/utils/cn";

export interface PageTransitionProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Delay in milliseconds before the animation starts */
  delay?: number;
}

/**
 * Simple fade-in-up wrapper using CSS animation and motion timing variables.
 * Wraps children in a div that animates opacity + translateY on mount.
 */
export function PageTransition({
  delay = 0,
  className,
  style,
  children,
  ...props
}: PageTransitionProps) {
  return (
    <div
      data-slot="page-transition"
      className={cn("animate-page-enter", className)}
      style={{
        animationDelay: delay > 0 ? `${delay}ms` : undefined,
        animationDuration: "var(--duration-emphasis)",
        animationTimingFunction: "var(--ease-out)",
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
