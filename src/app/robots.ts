import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";
export default function robots(): MetadataRoute.Robots {
  // Crawlers must be able to read noindex on utility pages.
  return { rules: { userAgent: "*", allow: "/", disallow: ["/api/"] }, sitemap: `${siteUrl}/sitemap.xml` };
}
