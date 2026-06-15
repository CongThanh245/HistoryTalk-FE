import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import "../styles/globals.css";
import { Toaster } from "@/components/ui/sonner";
import ReactQueryProviders from "@/components/context/query-client-provider";
import { ThemeProvider } from "@/components/context/theme-provider";
import { WelcomeScreen } from "@/components/welcome-screen";

// Define CSS variables for local fonts
const titleFont = {
  variable: "--font-title",
};

const bodyFont = {
  variable: "--font-body",
};

const googleAnalyticsId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;

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

// Tách viewport export theo chuẩn Next.js 16
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0a0c10",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        {googleAnalyticsId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${googleAnalyticsId}');
              `}
            </Script>
          </>
        )}
      </head>
      <body
        className={`${titleFont.variable} ${bodyFont.variable} antialiased`}
      >
        <WelcomeScreen />
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
        <Analytics />
      </body>
    </html>
  );
}
