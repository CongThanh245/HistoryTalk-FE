// components/chat-history/chat-history-skeleton.tsx
// ✅ Không cần "use client" — pure UI

export function ChatHistorySkeleton() {
  return (
    <div className="space-y-6 pb-10 animate-pulse md:space-y-8 md:pb-16">
      {[0, 1].map((groupIdx) => (
        <div key={groupIdx} className="space-y-2.5 md:space-y-3">
          {/* Group header */}
          <div className="mb-3 flex items-center gap-3 md:mb-4">
            <div className="h-4 w-32 rounded-full bg-accent-gold/[0.12]" />
            <div className="h-px flex-1 bg-accent-gold/[0.08]" />
          </div>

          {/* Session cards */}
          {[0, 1, 2].map((cardIdx) => (
            <div
              key={cardIdx}
              className="flex items-center gap-3 rounded-xl p-3 md:gap-4 md:p-3.5 bg-accent-gold/[0.04] border border-accent-gold/[0.08]"
            >
              {/* Avatar */}
              <div className="h-10 w-10 flex-shrink-0 rounded-xl md:h-11 md:w-11 bg-accent-gold/10" />

              {/* Content */}
              <div className="flex-1 space-y-2 min-w-0">
                <div className="h-3.5 w-28 rounded-full bg-accent-gold/[0.12]" />
                <div className="h-3 w-36 rounded-full md:w-48 bg-accent-gold/[0.07]" />
              </div>

              {/* Timestamp */}
              <div className="hidden h-3 w-14 flex-shrink-0 rounded-full sm:block bg-accent-gold/[0.07]" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
