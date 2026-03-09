// components/chat-history/chat-history-skeleton.tsx
// ✅ Không cần "use client" — pure UI

export function ChatHistorySkeleton() {
  return (
    <div className="space-y-10 pb-16 animate-pulse">
      {[0, 1].map((groupIdx) => (
        <div key={groupIdx} className="space-y-3">
          {/* Group header */}
          <div className="flex items-center gap-3 mb-4">
            <div
              className="h-4 w-32 rounded-full"
              style={{ background: "rgba(201,162,77,0.12)" }}
            />
            <div
              className="h-px flex-1"
              style={{ background: "rgba(201,162,77,0.08)" }}
            />
          </div>

          {/* Session cards */}
          {[0, 1, 2].map((cardIdx) => (
            <div
              key={cardIdx}
              className="flex items-center gap-4 p-4 rounded-xl"
              style={{
                background: "rgba(201,162,77,0.04)",
                border: "1px solid rgba(201,162,77,0.08)",
              }}
            >
              {/* Avatar */}
              <div
                className="w-11 h-11 rounded-full flex-shrink-0"
                style={{ background: "rgba(201,162,77,0.10)" }}
              />

              {/* Content */}
              <div className="flex-1 space-y-2 min-w-0">
                <div
                  className="h-3.5 w-28 rounded-full"
                  style={{ background: "rgba(201,162,77,0.12)" }}
                />
                <div
                  className="h-3 w-48 rounded-full"
                  style={{ background: "rgba(201,162,77,0.07)" }}
                />
              </div>

              {/* Timestamp */}
              <div
                className="h-3 w-14 rounded-full flex-shrink-0"
                style={{ background: "rgba(201,162,77,0.07)" }}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
