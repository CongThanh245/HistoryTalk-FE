// app/(auth)/layout.tsx
export default function AuthLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

// Hoặc nếu muốn giữ wrapper:
// export default function AuthLayoutWrapper({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   return <div className="min-h-screen">{children}</div>;
// }