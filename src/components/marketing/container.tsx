import { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface ContainerProps {
  children: ReactNode;
  className?: string;
}

export function Container({ children, className }: ContainerProps) {
  return (
    <div className={cn("max-w-7xl mx-auto px-4 sm:px-6", className)}>
      {children}
    </div>
  );
}