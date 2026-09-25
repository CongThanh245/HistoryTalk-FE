import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "HistoryTalk", short_name: "HistoryTalk", lang: "vi",
    description: "Học lịch sử qua trò chuyện với nhân vật lịch sử.",
    start_url: "/", display: "standalone", background_color: "#0e1a2b", theme_color: "#0e1a2b",
    icons: [{ src: "/icon.png", sizes: "512x512", type: "image/png" }],
  };
}
