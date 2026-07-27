import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils/cn";

const emptyStateVariants = cva(
  "flex flex-col items-center justify-center text-center border border-dashed border-border-default rounded-xl p-8",
  {
    variants: {
      size: {
        sm: "gap-2 p-6",
        md: "gap-3 p-8",
        lg: "gap-4 p-12",
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
);

export interface EmptyStateProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof emptyStateVariants> {
  /** Lucide icon component to display */
  icon?: LucideIcon;
  /** Main heading text */
  title: string;
  /** Supporting description text */
  description?: string;
  /** Optional action element (e.g. a Button) */
  action?: React.ReactNode;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  size,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      data-slot="empty-state"
      className={cn(emptyStateVariants({ size }), className)}
      {...props}
    >
      {Icon && (
        <div className="mb-1 flex size-12 items-center justify-center rounded-full bg-bg-elevated">
          <Icon className="size-6 text-content-muted" strokeWidth={1.5} />
        </div>
      )}
      <h3 className="text-small font-semibold text-content-heading">{title}</h3>
      {description && (
        <p className="max-w-sm text-small text-content-muted">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export { emptyStateVariants };
