"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { jsonLd, siteUrl } from "@/lib/seo";

export function MarketingBreadcrumbs() {
  const pathname = usePathname();
  const label = pathname === "/features" ? "Tính năng" : pathname === "/pricing" ? "Bảng giá" : null;
  if (!label) return null;
  return <nav aria-label="Đường dẫn trang" className="mx-auto max-w-7xl px-6 pt-24 text-sm text-[var(--text-secondary)]">
    <ol className="flex gap-2"><li><Link href="/">Trang chủ</Link></li><li aria-hidden="true">/</li><li aria-current="page">{label}</li></ol>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Trang chủ", item: siteUrl },
      { "@type": "ListItem", position: 2, name: label, item: siteUrl + pathname },
    ] }) }} />
  </nav>;
}
