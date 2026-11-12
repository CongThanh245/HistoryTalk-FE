// Vietnamese Wikipedia lookup for prefilling RAG documents. Called straight from the browser:
// the MediaWiki action API allows anonymous CORS requests with origin=*.
const WIKI_API = "https://vi.wikipedia.org/w/api.php";

export interface WikiSearchResult {
  title: string;
  /** Plain-text snippet (search highlight markup stripped). */
  snippet: string;
}

export interface WikiArticle {
  title: string;
  url: string;
  /** Markdown body: wiki headings converted, reference sections dropped, attribution appended. */
  content: string;
}

// Sections that are only lists of links / citations — noise for a RAG document.
const DROPPED_SECTIONS = new Set([
  "tham khảo",
  "chú thích",
  "ghi chú",
  "liên kết ngoài",
  "xem thêm",
  "đọc thêm",
  "thư mục",
  "nguồn",
  "tài liệu tham khảo",
]);

interface WikiResponse {
  query?: {
    search?: { title: string; snippet?: string }[];
    pages?: { title: string; missing?: boolean; extract?: string; fullurl?: string }[];
  };
}

async function wikiQuery(params: Record<string, string>, signal?: AbortSignal): Promise<WikiResponse> {
  const qs = new URLSearchParams({ format: "json", formatversion: "2", origin: "*", ...params });
  const res = await fetch(`${WIKI_API}?${qs}`, { signal });
  if (!res.ok) throw new Error(`Wikipedia trả về lỗi ${res.status}`);
  return res.json();
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&#0?39;/g, "'");
}

export async function searchWikipedia(query: string, signal?: AbortSignal): Promise<WikiSearchResult[]> {
  const q = query.trim();
  if (!q) return [];
  const data = await wikiQuery({ action: "query", list: "search", srsearch: q, srlimit: "8" }, signal);
  return (data.query?.search ?? []).map((r) => ({
    title: r.title,
    snippet: stripHtml(r.snippet ?? ""),
  }));
}

/** Converts "== Heading ==" plain-text extract into markdown and drops reference-only sections. */
export function wikiExtractToMarkdown(extract: string): string {
  const out: string[] = [];
  let skipLevel = 0; // >0 while inside a dropped section; cleared by a heading at the same or higher level
  for (const line of extract.split("\n")) {
    const m = line.match(/^(={2,6})\s*(.*?)\s*\1\s*$/);
    if (m) {
      const level = m[1].length;
      if (skipLevel && level > skipLevel) continue;
      skipLevel = 0;
      if (DROPPED_SECTIONS.has(m[2].toLowerCase())) {
        skipLevel = level;
        continue;
      }
      out.push("", `${"#".repeat(level)} ${m[2]}`, "");
      continue;
    }
    if (!skipLevel) out.push(line);
  }
  // Drop headings left with no body (next non-blank line is a same-or-higher heading, or nothing).
  const headingLevel = (l: string) => l.match(/^(#{2,6}) /)?.[1].length ?? 0;
  const kept: string[] = [];
  for (let i = 0; i < out.length; i++) {
    const level = headingLevel(out[i]);
    if (level) {
      let j = i + 1;
      while (j < out.length && !out[j].trim()) j++;
      const next = j < out.length ? headingLevel(out[j]) : -1;
      if (next === -1 || (next > 0 && next <= level)) continue;
    }
    kept.push(out[i]);
  }
  return kept.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

export async function fetchWikipediaArticle(title: string, signal?: AbortSignal): Promise<WikiArticle> {
  const data = await wikiQuery(
    {
      action: "query",
      prop: "extracts|info",
      explaintext: "1",
      exsectionformat: "wiki",
      inprop: "url",
      redirects: "1",
      titles: title,
    },
    signal,
  );
  const page = data.query?.pages?.[0];
  if (!page || page.missing || !page.extract?.trim()) throw new Error("Không tìm thấy nội dung bài viết trên Wikipedia");
  const url: string = page.fullurl ?? `https://vi.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, "_"))}`;
  const body = wikiExtractToMarkdown(page.extract);
  const attribution = `---\n\nNguồn: [Wikipedia tiếng Việt – ${page.title}](${url}), nội dung theo giấy phép CC BY-SA 4.0.`;
  return { title: page.title, url, content: `${body}\n\n${attribution}` };
}
