import { Pin, PinOff, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface SidebarFooterProps {
  isExpanded: boolean;
  isPinned: boolean;
  onTogglePin: () => void;
}

export default function SidebarFooter({ isExpanded, isPinned, onTogglePin }: SidebarFooterProps) {
  return (
    <div
      className="relative z-10 shrink-0 px-2 py-3 border-t flex items-center gap-2"
      style={{ borderColor: "var(--border-default)" }}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onTogglePin}
            aria-label={isPinned ? "Bỏ ghim sidebar" : "Ghim sidebar"}
            className={cn(
              "flex items-center justify-center rounded-lg transition-all duration-150 cursor-pointer shrink-0",
              isExpanded ? "w-8 h-8" : "w-10 h-10 mx-auto"
            )}
            style={{
              color: isPinned ? "var(--sidebar-pin-active)" : "var(--sidebar-pin-inactive)",
              background: isPinned ? "var(--accent-gold-active-bg)" : "transparent",
            }}
          >
            {isPinned ? <Pin className="w-4 h-4" /> : <PinOff className="w-4 h-4" />}
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)", color: "var(--text-primary)", fontSize: 12 }}>
          {isPinned ? "Bỏ ghim sidebar" : "Ghim sidebar"}
        </TooltipContent>
      </Tooltip>

      {isExpanded && isPinned && (
        <button
          onClick={onTogglePin}
          className="flex items-center gap-1.5 text-xs rounded-lg px-2 py-1.5 transition-all duration-150 cursor-pointer"
          style={{ color: "var(--text-on-dark-muted)" }}
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Thu gọn</span>
        </button>
      )}
    </div>
  );
}