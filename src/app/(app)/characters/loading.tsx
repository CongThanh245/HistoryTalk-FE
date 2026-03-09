export default function CharacterLoading() {
  return (
    <div className="px-6 py-8 space-y-8">
      {/* Skeleton header */}
      <div
        className="h-8 w-48 rounded-full animate-pulse"
        style={{ background: "rgba(201,162,77,0.12)" }}
      />

      {/* Skeleton timeline strip */}
      <div
        className="h-[72px] rounded-xl animate-pulse"
        style={{ background: "rgba(201,162,77,0.07)" }}
      />

      {/* Skeleton card */}
      <div
        className="h-48 rounded-xl animate-pulse"
        style={{ background: "rgba(201,162,77,0.07)" }}
      />
    </div>
  );
}
