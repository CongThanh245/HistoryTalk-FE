import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://historytalk.online";

  // Public static routes
  const staticRoutes = ["", "/about", "/pricing", "/features", "/login", "/register"].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: "daily" as const,
    priority: route === "" ? 1.0 : 0.8,
  }));

  // App core routes (authenticated but visible in sitemap)
  const appRoutes = ["/home", "/characters", "/events", "/map", "/library", "/quiz"].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...appRoutes];
}
