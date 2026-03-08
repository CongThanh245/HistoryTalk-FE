import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "../styles/globals.css";
import { Toaster } from "@/components/ui/sonner";
import ReactQueryProviders from "@/components/context/query-client-provider";
import localFont from "next/font/local";
const titleFont = localFont({
  src: "../styles/fonts/Helvep-6.ttf",
  variable: "--font-title",
});

const bodyFont = localFont({
  src: "../styles/fonts/Helvep-6.ttf",
  variable: "--font-title",
});
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HistoryTalk - Khám phá lịch sử qua cuộc trò chuyện",
  description: "Trò chuyện với các nhân vật lịch sử",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body
        className={`${titleFont.variable} ${bodyFont.variable} antialiased`}
      >
        {" "}
        <ReactQueryProviders>{children}</ReactQueryProviders>
        <Toaster
          position="bottom-right"
          duration={4000}
          visibleToasts={3}
          closeButton
          richColors={false} // tắt màu mặc định của sonner → dùng màu custom
          gap={10}
          toastOptions={{
            classNames: {
              toast: "ht-toast",
              title: "ht-toast-title",
              description: "ht-toast-description",
              closeButton: "ht-toast-close",
              // Variants
              success: "ht-toast--success",
              error: "ht-toast--error",
              warning: "ht-toast--warning",
              info: "ht-toast--info",
            },
          }}
        />
      </body>
    </html>
  );
}
