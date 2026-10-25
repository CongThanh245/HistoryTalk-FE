/**
 * Holiday "seasons" that dress up the mascot and the companion greeting.
 * Preview any season with `?season=tet|reunification|national|mid-autumn|teacher` (remembered for the tab).
 */
export type Season = "tet" | "reunification" | "national" | "mid-autumn" | "teacher";

// Lunar holidays don't follow the solar calendar — dates per year (Tết = mùng 1, Trung thu = rằm tháng 8).
const TET: Record<number, string> = { 2026: "02-17", 2027: "02-06", 2028: "01-26", 2029: "02-13", 2030: "02-03" };
const MID_AUTUMN: Record<number, string> = { 2026: "09-25", 2027: "09-15", 2028: "10-03", 2029: "09-22", 2030: "09-12" };

export const SEASON_GREETING: Record<Season, string> = {
  tet: "Chúc mừng năm mới! Đầu xuân học sử, cả năm hanh thông nhé 🌼",
  reunification: "Mừng ngày Giải phóng miền Nam, thống nhất đất nước 30/4 🇻🇳",
  national: "Mừng Quốc khánh 2/9! Cùng ôn lại bản Tuyên ngôn Độc lập nhé 🇻🇳",
  "mid-autumn": "Trung thu vui vẻ! Rước đèn ông sao, nghe kể chuyện sử nào 🏮",
  teacher: "Mừng ngày Nhà giáo Việt Nam 20/11 — tri ân thầy cô! 💐",
};

function within(now: Date, mmdd: string | undefined, before: number, after: number) {
  if (!mmdd) return false;
  const [m, d] = mmdd.split("-").map(Number);
  const center = new Date(now.getFullYear(), m - 1, d);
  const diff = (now.getTime() - center.getTime()) / 86_400_000;
  return diff >= -before && diff <= after;
}

const SEASONS = ["tet", "reunification", "national", "mid-autumn", "teacher"] as const;
const STORAGE_KEY = "ht-season-preview";

export function getSeason(now = new Date()): Season | null {
  if (typeof window !== "undefined") {
    try {
      const param = new URLSearchParams(window.location.search).get("season");
      if (param === "off") sessionStorage.removeItem(STORAGE_KEY);
      else if (param && (SEASONS as readonly string[]).includes(param)) sessionStorage.setItem(STORAGE_KEY, param);
      const preview = sessionStorage.getItem(STORAGE_KEY);
      if (preview) return preview as Season;
    } catch {
      // storage blocked — fall through to the real calendar
    }
  }

  const year = now.getFullYear();
  if (within(now, TET[year], 7, 7)) return "tet";
  if (within(now, "04-30", 5, 1)) return "reunification";
  if (within(now, "09-02", 5, 1)) return "national";
  if (within(now, MID_AUTUMN[year], 5, 1)) return "mid-autumn";
  if (within(now, "11-20", 3, 0)) return "teacher";
  return null;
}
