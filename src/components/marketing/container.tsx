export function Container({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-7xl mx-auto px-6">
      {children}
    </div>
  );
}