export default function CharacterLoading() {
  return (
    <div className="space-y-8">
      {/* Skeleton header */}
      <div className="h-8 w-48 rounded-full animate-pulse bg-accent-gold/[0.12]" />

      {/* Skeleton timeline strip */}
      <div className="h-[72px] rounded-xl animate-pulse bg-accent-gold/[0.07]" />

      {/* Skeleton card */}
      <div className="h-48 rounded-xl animate-pulse bg-accent-gold/[0.07]" />
    </div>
  );
}
