export function getYouTubeEmbedUrl(url?: string | null, options?: { autoplay?: boolean }) {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    let videoId: string | null = null;

    if (host === "youtu.be") {
      videoId = parsed.pathname.split("/").filter(Boolean)[0] ?? null;
    } else if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
      if (parsed.pathname === "/watch") {
        videoId = parsed.searchParams.get("v");
      } else if (parsed.pathname.startsWith("/shorts/") || parsed.pathname.startsWith("/embed/")) {
        videoId = parsed.pathname.split("/").filter(Boolean)[1] ?? null;
      }
    }

    if (!videoId) return null;

    const embed = new URL(`https://www.youtube.com/embed/${videoId}`);
    embed.searchParams.set("rel", "0");
    embed.searchParams.set("modestbranding", "1");
    if (options?.autoplay) {
      embed.searchParams.set("autoplay", "1");
    }
    return embed.toString();
  } catch {
    return null;
  }
}

export function isYouTubeUrl(url?: string | null) {
  return !!getYouTubeEmbedUrl(url);
}
