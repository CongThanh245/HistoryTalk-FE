import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import "../styles/globals.css";
import { Toaster } from "@/components/ui/sonner";
import ReactQueryProviders from "@/components/context/query-client-provider";
import { ThemeProvider } from "@/components/context/theme-provider";
import { WelcomeScreen } from "@/components/welcome-screen";
import { WELCOME_SCREEN_KEY } from "@/constants/welcome-screen";

// Define CSS variables for local fonts
const titleFont = {
  variable: "--font-title",
};

const bodyFont = {
  variable: "--font-body",
};

const googleAnalyticsId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;

export const metadata: Metadata = {
  title: "HistoryTalk - Trò chuyện với nhân vật lịch sử",
  description: "Trò chuyện, chat trực tiếp với các nhân vật lịch sử. Trải nghiệm học lịch sử tương tác thú vị, sinh động cùng HistoryTalk.",
  icons: {
    icon: [
      { url: "/solo-logo.png?v=2", type: "image/png", sizes: "32x32" },
    ],
    shortcut: "/solo-logo.png?v=2",
    apple: "/solo-logo.png?v=2",
  },
  metadataBase: new URL("https://historytalk.online"),
  openGraph: {
    title: "HistoryTalk - Trò chuyện với nhân vật lịch sử qua các cuộc hội thoại",
    description: "Trò chuyện, chat trực tiếp với các nhân vật lịch sử. Trải nghiệm học lịch sử tương tác thú vị, sinh động cùng HistoryTalk.",
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
    title: "HistoryTalk - Trò chuyện với nhân vật lịch sử",
    description: "Trò chuyện, chat trực tiếp với các nhân vật lịch sử. Trải nghiệm học lịch sử tương tác thú vị, sinh động cùng HistoryTalk.",
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
        <style
          dangerouslySetInnerHTML={{
            __html: `
              .welcome-screen {
                position: fixed;
                inset: 0;
                z-index: 9999;
                display: grid;
                place-items: center;
                overflow: hidden;
                background: #070d18;
              }
              html[data-welcome-screen-seen="true"] .welcome-screen {
                display: none !important;
              }
            `,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (document.cookie.split("; ").includes("${WELCOME_SCREEN_KEY}=true")) {
                document.documentElement.dataset.welcomeScreenSeen = "true";
              }
              try {
                var auth = localStorage.getItem("auth-storage");
                if (auth) {
                  var parsed = JSON.parse(auth);
                  if (parsed && parsed.state && parsed.state.user && parsed.state.tokens) {
                    var user = parsed.state.user;
                    var tokens = parsed.state.tokens;
                    var role = user.role;
                    var accessToken = tokens.accessToken;
                    var expiresIn = tokens.expiresIn || 3600;
                    var maxAge = expiresIn > 100000 ? Math.floor(expiresIn / 1000) : expiresIn;

                    // Set cookies synchronously so they are sent with the redirected page request
                    document.cookie = "auth-token=" + accessToken + "; path=/; max-age=" + maxAge + "; sameSite=lax";
                    document.cookie = "auth-role=" + role + "; path=/; max-age=" + maxAge + "; sameSite=lax";

                    var pathname = window.location.pathname;
                    var isLanding = pathname === "/";
                    var isAuthOnly = ["/login", "/register", "/forgot-password"].includes(pathname);
                    var isAdmin = role === "CONTENT_ADMIN" || role === "SYSTEM_ADMIN";
                    var isStaffRoute = pathname === "/staff" || pathname.startsWith("/staff/");
                    
                    if (isAuthOnly || (isAdmin && !isStaffRoute)) {
                      var home = "/home";
                      if (role === "CONTENT_ADMIN") home = "/staff";
                      else if (role === "SYSTEM_ADMIN") home = "/staff/admin";
                      window.location.replace(home);
                    }
                  }
                }
              } catch (e) {
                console.error(e);
              }
            `,
          }}
        />
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
