import type { Metadata } from "next";
import "../styles/globals.css";
import { Toaster } from "@/components/ui/sonner";
import ReactQueryProviders from "@/components/context/query-client-provider";
import { ThemeProvider } from "@/components/context/theme-provider";
import { Playfair_Display, Inter } from "next/font/google";

const titleFont = Playfair_Display({
  subsets: ["latin", "vietnamese"],
  weight: ["600", "700", "800"],
  variable: "--font-title",
  display: "swap",
});

const bodyFont = Inter({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "HistoryTalk - Khám phá lịch sử qua cuộc trò chuyện",
  description: "Trò chuyện với các nhân vật lịch sử",
  icons: {
    icon: "/solo-logo.png",
    shortcut: "/solo-logo.png",
    apple: "/solo-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body
        className={`${titleFont.variable} ${bodyFont.variable} antialiased`}
      >
        <ThemeProvider>
          <ReactQueryProviders>{children}</ReactQueryProviders>
          <Toaster
            position="bottom-right"
            duration={4000}
            visibleToasts={3}
            closeButton
            richColors={false}
            gap={10}
            toastOptions={{
              classNames: {
                toast: "ht-toast",
                title: "ht-toast-title",
                description: "ht-toast-description",
                closeButton: "ht-toast-close",
                success: "ht-toast--success",
                error: "ht-toast--error",
                warning: "ht-toast--warning",
                info: "ht-toast--info",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
