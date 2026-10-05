import { privateMetadata } from "@/lib/seo";
export const metadata = privateMetadata;
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
  // `chat-page` lets the (app) layout drop its max-width container so the chat fills the space beside the sidebar.
  return <div className="chat-page h-full w-full overflow-hidden">{children}</div>;
}
