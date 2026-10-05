export default function CharacterLoading() {
  return (
    <div className="space-y-8 py-6 lg:py-8">
      {/* Skeleton header */}
      <div className="space-y-2 pb-3 border-b border-[var(--text-primary)] animate-pulse">
        <div className="h-3 w-24 bg-[var(--border-default)]" />
        <div className="h-8 w-64 bg-[var(--border-default)]" />
      </div>

      {/* Skeleton filters */}
      <div className="h-9 w-full max-w-xl animate-pulse bg-[var(--border-default)]" />

      {/* Skeleton ruled grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 border-t border-l border-[var(--text-primary)]">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-48 border-r border-b border-[var(--text-primary)] animate-pulse bg-[var(--bg-deep)]" />
        ))}
      </div>
    </div>
  );
}
