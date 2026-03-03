import { Scroll } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export default function SidebarHeader({ isExpanded }: { isExpanded: boolean }) {
  return (
    <div
      className={cn(
        "relative z-10 h-16 flex items-center shrink-0 border-b overflow-hidden",
        isExpanded ? "px-4 gap-3" : "justify-center"
      )}
      style={{ borderColor: "var(--border-default)" }}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{
          background: "linear-gradient(135deg, var(--accent-gold) 0%, var(--truffle) 100%)",
          boxShadow: "var(--shadow-gold)",
        }}
      >
        <Scroll className="w-4 h-4" style={{ color: "var(--bg-deep)" }} />
      </div>
      {isExpanded && (
        <span
          className="text-[15px] font-bold tracking-wide truncate"
          style={{
            background: "linear-gradient(90deg, var(--accent-gold) 0%, var(--accent-gold-soft) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontFamily: "'Georgia', 'Times New Roman', serif",
          }}
        >
          HistoryTalk
        </span>
      )}
    </div>
  );
}