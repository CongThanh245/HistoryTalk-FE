import type { Metadata } from "next";

export const siteUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://historytalk.online").origin;
export const socialImage = { url: "/opengraph-image", width: 1200, height: 630, alt: "HistoryTalk – Học lịch sử qua trò chuyện" };

export function pageMetadata(path: string, title: string, description: string): Metadata {
  return {
    title,
    description,
    alternates: { canonical: `${siteUrl}${path}` },
    openGraph: { title, description, url: `${siteUrl}${path}`, siteName: "HistoryTalk", locale: "vi_VN", type: "website", images: [socialImage] },
    twitter: { card: "summary_large_image", title, description, images: [socialImage] },
  };
}

export const privateMetadata: Metadata = { robots: { index: false, follow: true } };

export function jsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
