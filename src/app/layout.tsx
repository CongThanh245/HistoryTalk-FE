import type { Metadata } from "next";
import "../styles/globals.css";
import { Toaster } from "@/components/ui/sonner";
import ReactQueryProviders from "@/components/context/query-client-provider";
import { ThemeProvider } from "@/components/context/theme-provider";

// Define CSS variables for local fonts
const titleFont = {
  variable: "--font-title",
};

const bodyFont = {
  variable: "--font-body",
};

export const metadata: Metadata = {
  title: "HistoryTalk - Khám phá lịch sử qua cuộc trò chuyện",
  description: "Trò chuyện với các nhân vật lịch sử",
  icons: {
    icon: [
      { url: "/solo-logo.png?v=2", type: "image/png", sizes: "32x32" },
    ],
    shortcut: "/solo-logo.png?v=2",
    apple: "/solo-logo.png?v=2",
  },
  metadataBase: new URL("https://history-talk.vercel.app"),
  openGraph: {
    title: "HistoryTalk - Khám phá lịch sử qua cuộc trò chuyện",
    description: "Trò chuyện với các nhân vật lịch sử",
    images: [
      {
        url: "/historytalk-banner.png",
        width: 1200,
        height: 630,
        alt: "HistoryTalk Banner",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "HistoryTalk - Khám phá lịch sử qua cuộc trò chuyện",
    description: "Trò chuyện với các nhân vật lịch sử",
    images: ["/historytalk-banner.png"],
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
