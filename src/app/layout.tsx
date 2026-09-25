import type { Metadata, Viewport } from "next";
import { pageMetadata, siteUrl } from "@/lib/seo";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "../styles/globals.css";
import { Toaster } from "@/components/ui/sonner";
import ReactQueryProviders from "@/components/context/query-client-provider";
import { ThemeProvider } from "@/components/context/theme-provider";
import { WelcomeScreen } from "@/components/welcome-screen";
import { WELCOME_SCREEN_KEY } from "@/constants/welcome-screen";
import { SessionExpiredDialog } from "@/components/session-expired-dialog";
import { UserLockedDialog } from "@/components/user-locked-dialog";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-body",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "vietnamese"],
  variable: "--font-title",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const googleAnalyticsId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;

export const metadata: Metadata = {
  ...pageMetadata("/", "HistoryTalk - Trò chuyện và khám phá lịch sử Việt Nam", "Khám phá lịch sử Việt Nam qua trò chuyện AI với nhân vật lịch sử, tìm hiểu sự kiện và thử sức cùng câu đố. Bắt đầu hành trình học tương tác với HistoryTalk."),
  alternates: undefined,
  metadataBase: new URL(siteUrl),
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
    other: process.env.BING_SITE_VERIFICATION ? { "msvalidate.01": process.env.BING_SITE_VERIFICATION } : undefined,
  },
};

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
                function clearAuthCookies() {
                  var keys = ["auth-token", "auth-role"];
                  var paths = ["/", window.location.pathname || "/"];
                  var host = window.location.hostname;
                  var domains = ["", host, "." + host];
                  keys.forEach(function (key) {
                    paths.forEach(function (path) {
                      domains.forEach(function (domain) {
                        var domainAttr = domain ? "; domain=" + domain : "";
                        document.cookie = key + "=; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=" + path + domainAttr + "; sameSite=lax";
                      });
                    });
                  });
                }
                var auth = localStorage.getItem("auth-storage");
                if (auth) {
                  var parsed = JSON.parse(auth);
                  if (parsed && parsed.state && parsed.state.user && parsed.state.tokens && parsed.state.tokens.accessToken) {
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
                  } else {
                    clearAuthCookies();
                  }
                } else {
                  clearAuthCookies();
                }
              } catch (e) {
                clearAuthCookies();
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
        className={`${inter.variable} ${jakarta.variable} antialiased`}
      >
        <WelcomeScreen />
        <ThemeProvider>
          <ReactQueryProviders>{children}</ReactQueryProviders>
          <SessionExpiredDialog />
          <UserLockedDialog />
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
