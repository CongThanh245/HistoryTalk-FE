import { firstParam, parseEra, parsePage } from "@/lib/catalog-url-state";
import { pageMetadata } from "@/lib/seo";

export function catalogMetadata(path: "/characters" | "/events", params: Record<string, string | string[] | undefined>) {
  const page = path === "/characters" ? parsePage(firstParam(params.page)) : 1;
  const era = parseEra(firstParam(params.era));
  const query = new URLSearchParams();
  if (era !== "all") query.set("era", era);
  if (page > 1) query.set("page", String(page));
  const title = path === "/characters" ? "Nhân vật lịch sử Việt Nam – Khám phá cùng HistoryTalk" : "Sự kiện lịch sử Việt Nam qua các thời kỳ | HistoryTalk";
  const description = path === "/characters"
    ? "Khám phá các nhân vật lịch sử Việt Nam theo thời kỳ, tìm hiểu vai trò và câu chuyện của từng người. Chọn nhân vật để bắt đầu trò chuyện AI cùng HistoryTalk."
    : "Khám phá các sự kiện lịch sử Việt Nam theo thời kỳ và tìm hiểu bối cảnh của những dấu mốc quan trọng. Mở từng sự kiện để tiếp tục hành trình cùng HistoryTalk.";
  const metadata = pageMetadata(path + (query.size ? `?${query}` : ""), title + (page > 1 ? ` – Trang ${page}` : ""), description);
  // Search and detail drawers are app states, not standalone editorial pages.
  if (firstParam(params.search)?.trim() || firstParam(params.event)) metadata.robots = { index: false, follow: true };
  return metadata;
}
