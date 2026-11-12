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

// ---------------------------------------------------------------------------------------------------------------
// Character prefill: structured facts from Wikidata + the article's lead section as a short biography.

const WIKIDATA_API = "https://www.wikidata.org/w/api.php";
const MAX_IMAGE_URL = 255; // backend CreateCharacterRequest.imageUrl @Size(max = 255)

export interface WikiDate {
  year: string;
  month: string;
  day: string;
  bc: boolean;
}

export interface WikiCharacter {
  title: string;
  url: string;
  /** Short Wikidata description, trailing "(1890–1969)" removed. */
  description: string;
  /** Labels of "position held" (P39), Vietnamese only. */
  positions: string[];
  /** Lead section as plain text — a ready-made biography. */
  intro: string;
  imageUrl?: string;
  born?: WikiDate;
  death?: WikiDate;
  /** Full article, already converted for a RAG document. */
  article: WikiArticle;
}

interface WikidataTime {
  time: string;
  precision: number;
}
interface WikidataClaim {
  mainsnak?: { datavalue?: { value?: unknown } };
  rank?: string;
}
interface WikidataEntity {
  claims?: Record<string, WikidataClaim[]>;
  descriptions?: { vi?: { value: string } };
  labels?: { vi?: { value: string } };
}

async function wikidataEntities(params: Record<string, string>, signal?: AbortSignal): Promise<Record<string, WikidataEntity>> {
  const qs = new URLSearchParams({ action: "wbgetentities", languages: "vi", format: "json", origin: "*", ...params });
  const res = await fetch(`${WIKIDATA_API}?${qs}`, { signal });
  if (!res.ok) throw new Error(`Wikidata trả về lỗi ${res.status}`);
  return ((await res.json()) as { entities?: Record<string, WikidataEntity> }).entities ?? {};
}

function claimValues(entity: WikidataEntity, prop: string): unknown[] {
  const claims = (entity.claims?.[prop] ?? []).filter((c) => c.rank !== "deprecated");
  // Preferred-rank statements first.
  claims.sort((a, b) => Number(b.rank === "preferred") - Number(a.rank === "preferred"));
  return claims.map((c) => c.mainsnak?.datavalue?.value).filter((v) => v != null);
}

/** "+1890-05-19T00:00:00Z" → parts, honouring precision (9 = year, 10 = month, 11 = day). Negative year = TCN. */
export function parseWikidataTime(value: WikidataTime | undefined): WikiDate | undefined {
  const m = value?.time?.match(/^([+-])(\d+)-(\d{2})-(\d{2})/);
  if (!m || !value || value.precision < 9) return undefined;
  const year = Number(m[2]);
  if (!year) return undefined;
  return {
    year: String(year),
    month: value.precision >= 10 && m[3] !== "00" ? String(Number(m[3])) : "",
    day: value.precision >= 11 && m[4] !== "00" ? String(Number(m[4])) : "",
    bc: m[1] === "-",
  };
}

export async function fetchWikipediaCharacter(title: string, signal?: AbortSignal): Promise<WikiCharacter> {
  const [lead, article] = await Promise.all([
    wikiQuery(
      {
        action: "query",
        prop: "pageprops|extracts|pageimages|info",
        ppprop: "wikibase_item",
        exintro: "1",
        explaintext: "1",
        piprop: "thumbnail",
        pithumbsize: "600",
        inprop: "url",
        redirects: "1",
        titles: title,
      },
      signal,
    ),
    fetchWikipediaArticle(title, signal),
  ]);
  const page = lead.query?.pages?.[0] as
    | { title: string; fullurl?: string; extract?: string; thumbnail?: { source: string }; pageprops?: { wikibase_item?: string } }
    | undefined;
  if (!page) throw new Error("Không tìm thấy bài viết trên Wikipedia");

  const result: WikiCharacter = {
    title: page.title,
    url: page.fullurl ?? article.url,
    description: "",
    positions: [],
    intro: (page.extract ?? "").replace(/\n{2,}/g, "\n\n").trim(),
    imageUrl: page.thumbnail?.source && page.thumbnail.source.length <= MAX_IMAGE_URL ? page.thumbnail.source : undefined,
    article,
  };

  const qid = page.pageprops?.wikibase_item;
  if (!qid) return result;
  try {
    const entity = (await wikidataEntities({ ids: qid, props: "claims|descriptions" }, signal))[qid];
    if (!entity) return result;
    result.description = (entity.descriptions?.vi?.value ?? "").replace(/\s*\([^)]*\d[^)]*\)\s*$/, "").trim();
    result.born = parseWikidataTime(claimValues(entity, "P569")[0] as WikidataTime | undefined);
    result.death = parseWikidataTime(claimValues(entity, "P570")[0] as WikidataTime | undefined);
    const positionIds = [...new Set(claimValues(entity, "P39").map((v) => (v as { id?: string }).id).filter(Boolean))].slice(0, 20) as string[];
    if (positionIds.length) {
      const labels = await wikidataEntities({ ids: positionIds.join("|"), props: "labels" }, signal);
      result.positions = [...new Set(positionIds.map((id) => labels[id]?.labels?.vi?.value).filter((l): l is string => !!l))];
    }
  } catch (e) {
    // Structured facts are a bonus — the article and lead still prefill the rest.
    if (signal?.aborted) throw e;
  }
  return result;
}
