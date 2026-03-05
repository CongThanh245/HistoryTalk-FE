// src/app/(app)/chat/layout.tsx
//
// Layout riêng cho tất cả trang /chat/*
// Override phần <main> của (app)/layout — bỏ container, padding, scroll
// Sidebar + Header vẫn lấy từ (app)/layout như bình thường

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="h-full w-full overflow-hidden">{children}</div>;
}
