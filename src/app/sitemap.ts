import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";
export default function sitemap(): MetadataRoute.Sitemap {
  // TODO: configure the actual public-content revision date, never the current request time.
  const revision = process.env.SEO_CONTENT_UPDATED_AT;
  const lastModified = revision && !Number.isNaN(Date.parse(revision)) ? new Date(revision) : undefined;
  return ["", "/features", "/pricing", "/characters", "/events"].map((path) => ({
    url: siteUrl + path, ...(lastModified ? { lastModified } : {}),
  }));
}
