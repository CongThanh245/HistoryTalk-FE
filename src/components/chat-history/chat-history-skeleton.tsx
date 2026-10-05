// components/chat-history/chat-history-skeleton.tsx
// ✅ Không cần "use client" — pure UI

export function ChatHistorySkeleton() {
  return (
    <div className="space-y-6 pb-10 animate-pulse md:space-y-8 md:pb-16">
      {[0, 1].map((groupIdx) => (
        <div key={groupIdx} className="space-y-2.5 md:space-y-3">
          {/* Group header */}
          <div className="mb-3 flex items-center gap-3 md:mb-4">
            <div className="h-4 w-32 bg-[var(--border-default)]" />
            <div className="h-px flex-1 bg-[var(--text-primary)]" />
          </div>

          {/* Session cards */}
          {[0, 1, 2].map((cardIdx) => (
            <div
              key={cardIdx}
              className="flex items-center gap-3 p-3 md:gap-4 md:p-3.5 border-b border-[var(--border-default)]"
            >
              {/* Avatar */}
              <div className="h-10 w-10 flex-shrink-0 rounded-full md:h-11 md:w-11 bg-[var(--bg-deep)]" />

              {/* Content */}
              <div className="flex-1 space-y-2 min-w-0">
                <div className="h-3.5 w-28 bg-[var(--border-default)]" />
                <div className="h-3 w-36 md:w-48 bg-[var(--border-default)]" />
              </div>

              {/* Timestamp */}
              <div className="hidden h-3 w-14 flex-shrink-0 sm:block bg-[var(--border-default)]" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
