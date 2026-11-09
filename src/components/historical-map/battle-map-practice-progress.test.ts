import { beforeEach, describe, expect, test } from "bun:test";
import type { BattleMap, BattleSymbol, BattleSymbolType } from "./battle-map.types";
import { scoreBattleMap } from "./battle-map-scoring";
import { missingHints, nextRankAt, practiceRank, readPracticeRecord, savePracticeScore } from "./battle-map-practice-progress";

const map = (symbols: BattleSymbol[]): BattleMap => ({
  version: 1, mode: "custom", imageUrl: "x.png", imageSource: "",
  factions: [{ id: "a", name: "Đại Việt", color: "#B8321F" }, { id: "b", name: "Nguyên", color: "#1F4E8C" }],
  symbols,
});
const pt = (id: string, type: BattleSymbolType, x: number, y: number, factionId = "a"): BattleSymbol =>
  ({ id, type, factionId, label: "", x, y, size: 7, rotation: 0 });

const store = new Map<string, string>();
beforeEach(() => {
  store.clear();
  globalThis.localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
    key: () => null,
    length: 0,
  } as Storage;
});

describe("practice record", () => {
  test("firstScore_hasNoPrevious", () => {
    const { previous, record } = savePracticeScore("u", "e", 42.5);
    expect(previous).toBeNull();
    expect(record).toEqual({ best: 42.5, last: 42.5, attempts: 1 });
  });

  test("lowerScore_keepsBest", () => {
    savePracticeScore("u", "e", 80);
    const { previous, record } = savePracticeScore("u", "e", 60);
    expect(previous?.best).toBe(80);
    expect(record).toEqual({ best: 80, last: 60, attempts: 2 });
    expect(readPracticeRecord("u", "e")).toEqual(record);
  });

  test("recordsArePerUserAndBattle", () => {
    savePracticeScore("u", "e", 80);
    expect(readPracticeRecord("u", "other")).toBeNull();
    expect(readPracticeRecord("v", "e")).toBeNull();
  });

  test("brokenStoredValue_readsAsNone", () => {
    store.set("historytalk:battle-practice:v1:u:e", "{oops");
    expect(readPracticeRecord("u", "e")).toBeNull();
  });
});

describe("practiceRank", () => {
  test("thresholds", () => {
    expect(practiceRank(100).stars).toBe(3);
    expect(practiceRank(90).title).toBe("Nguyên soái");
    expect(practiceRank(89.9).stars).toBe(2);
    expect(practiceRank(70).stars).toBe(2);
    expect(practiceRank(40).stars).toBe(1);
    expect(practiceRank(39.9).stars).toBe(0);
    expect(nextRankAt(10)).toBe(40);
    expect(nextRankAt(75)).toBe(90);
    expect(nextRankAt(95)).toBeNull();
  });
});

describe("missingHints", () => {
  test("groupsMissedByTypeAndSide_mostFirst", () => {
    const answer = map([
      pt("A1", "infantry", 10, 10), pt("A2", "infantry", 30, 30), pt("A3", "infantry", 50, 50, "b"),
      pt("A4", "fort", 70, 70), pt("A5", "cavalry", 90, 90),
    ]);
    const attempt = map([pt("U1", "cavalry", 90, 90)]);
    const hints = missingHints(answer, scoreBattleMap(answer, attempt));
    expect(hints.map(h => [h.label, h.faction, h.count])).toEqual([
      ["Bộ binh", "Đại Việt", 2],
      ["Bộ binh", "Nguyên", 1],
      ["Thành / đồn lũy", "Đại Việt", 1],
    ]);
  });
});
