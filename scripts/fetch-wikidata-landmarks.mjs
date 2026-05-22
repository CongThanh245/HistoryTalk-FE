// scripts/fetch-wikidata-landmarks.mjs
// Fetch các di tích lịch sử + trận đánh tại Việt Nam từ Wikidata.
// Chạy: node scripts/fetch-wikidata-landmarks.mjs
// Output: src/data/landmarks-wikidata.json

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = path.join(
  __dirname,
  "..",
  "src",
  "data",
  "landmarks-wikidata.json",
);

const SPARQL_ENDPOINT = "https://query.wikidata.org/sparql";
const USER_AGENT =
  "HistoryTalkVN/1.0 (https://github.com; educational project)";

// ── SPARQL queries ──────────────────────────────────────────

/** Trận đánh tại Việt Nam */
const QUERY_BATTLES = `
SELECT ?item ?itemLabel ?itemLabelEn ?coord ?date ?image WHERE {
  ?item wdt:P31/wdt:P279* wd:Q178561 .
  ?item wdt:P17 wd:Q881 .
  ?item wdt:P625 ?coord .
  OPTIONAL { ?item wdt:P585 ?date }
  OPTIONAL { ?item wdt:P18 ?image }
  OPTIONAL { ?item rdfs:label ?itemLabel . FILTER(LANG(?itemLabel) = "vi") }
  OPTIONAL { ?item rdfs:label ?itemLabelEn . FILTER(LANG(?itemLabelEn) = "en") }
}
LIMIT 300
`;


// ── Helpers ─────────────────────────────────────────────────

async function runSparql(query) {
  const url = `${SPARQL_ENDPOINT}?query=${encodeURIComponent(query)}&format=json`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/sparql-results+json",
    },
  });
  if (!res.ok) {
    throw new Error(`SPARQL failed: ${res.status} ${res.statusText}`);
  }
  const json = await res.json();
  return json.results.bindings;
}

/** Parse "Point(106.83 20.94)" → { lng, lat } */
function parseCoord(point) {
  const m = /Point\(([-\d.]+)\s+([-\d.]+)\)/.exec(point);
  if (!m) return null;
  return { lng: parseFloat(m[1]), lat: parseFloat(m[2]) };
}

/** Parse "+1954-05-07T00:00:00Z" or "-0257-01-01T00:00:00Z" → year (number) */
function parseYear(iso) {
  if (!iso) return null;
  const m = /^([+-]?)(\d{1,4})-/.exec(iso);
  if (!m) return null;
  const sign = m[1] === "-" ? -1 : 1;
  return sign * parseInt(m[2], 10);
}

/** ID cuối từ Wikidata URI: "http://www.wikidata.org/entity/Q12345" → "wd-Q12345" */
function wikidataId(uri) {
  const m = /\/(Q\d+)$/.exec(uri);
  return m ? `wd-${m[1]}` : `wd-${uri.slice(-10)}`;
}

/** Phân loại era theo year */
function classifyEra(year) {
  if (year == null) return "ALL";
  if (year < 939) return "ANCIENT";
  if (year < 1858) return "MEDIEVAL";
  if (year < 1945) return "MODERN";
  return "CONTEMPORARY";
}

/** Coords nằm trong VN không? (filter outliers / lỗi data) */
function isInVietnam(lat, lng) {
  return lat >= 6 && lat <= 24 && lng >= 100 && lng <= 115;
}

/** Map từ raw Wikidata bindings → Landmark object */
function mapBattle(b) {
  const coord = parseCoord(b.coord.value);
  if (!coord || !isInVietnam(coord.lat, coord.lng)) return null;
  const year = parseYear(b.date?.value);
  const name = b.itemLabel?.value || b.itemLabelEn?.value;
  if (!name || /^Q\d+$/.test(name)) return null;
  // Bỏ trận không có ngày — không thể hiển thị đúng trên timeline
  if (year == null) return null;
  return {
    landmarkId: wikidataId(b.item.value),
    name,
    description: `Trận đánh tại Việt Nam (năm ${year}).`,
    lat: coord.lat,
    lng: coord.lng,
    type: "battlefield",
    era: classifyEra(year),
    province: "",
    contextIds: [],
    characterIds: [],
    imageUrl: b.image?.value,
    yearStart: year,
    yearEnd: year,
  };
}

/** Loại bỏ duplicate theo landmarkId */
function dedupe(landmarks) {
  const seen = new Map();
  for (const l of landmarks) {
    if (!seen.has(l.landmarkId)) seen.set(l.landmarkId, l);
  }
  return Array.from(seen.values());
}

// ── Main ────────────────────────────────────────────────────

async function main() {
  console.log("⏳ Đang fetch Wikidata...");

  const battles = await runSparql(QUERY_BATTLES).catch((e) => {
    console.error("⚠️  Battles failed:", e.message);
    return [];
  });

  console.log(`📥 Raw: ${battles.length} battles`);

  const all = battles.map(mapBattle).filter(Boolean);

  const unique = dedupe(all);
  unique.sort((a, b) => a.yearStart - b.yearStart);

  console.log(`✅ Đã map: ${unique.length} landmarks (sau dedupe + lọc)`);

  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await fs.writeFile(OUTPUT_PATH, JSON.stringify(unique, null, 2), "utf8");

  console.log(`💾 Ghi vào: ${path.relative(process.cwd(), OUTPUT_PATH)}`);
  console.log("\n✨ Xong! Mở src/services/landmark.service.ts để merge data.");
}

main().catch((e) => {
  console.error("❌ Lỗi:", e);
  process.exit(1);
});
