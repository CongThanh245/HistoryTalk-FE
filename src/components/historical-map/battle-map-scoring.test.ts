import { describe, expect, test } from "bun:test";
import { withPoints, type BattleMap, type BattleSymbol, type BattleSymbolType } from "./battle-map.types";
import { isGradableMap, resamplePath, scoreBattleMap } from "./battle-map-scoring";

const map = (symbols: BattleSymbol[]): BattleMap => ({
  version: 1, mode: "custom", imageUrl: "x.png", imageSource: "",
  factions: [{ id: "a", name: "A", color: "#B8321F" }, { id: "b", name: "B", color: "#1F4E8C" }],
  symbols,
});
const pt = (id: string, type: BattleSymbolType, x: number, y: number, factionId = "a"): BattleSymbol =>
  ({ id, type, factionId, label: "", x, y, size: 7, rotation: 0 });
const line = (id: string, type: BattleSymbolType, points: [number, number][], factionId = "a"): BattleSymbol =>
  withPoints(pt(id, type, 0, 0, factionId), points.map(([x, y]) => ({ x, y })));

describe("scoreBattleMap", () => {
  test("identicalMaps_score100", () => {
    const symbols = [pt("i", "infantry", 50, 50), line("r", "arrow", [[10, 10], [40, 10]])];
    const s = scoreBattleMap(map(symbols), map(symbols));
    expect(s.percent).toBe(100);
    expect(s.matches.length).toBe(2);
  });

  test("emptyAttempt_scoresZero_allMissed", () => {
    const answer = map([pt("i", "infantry", 50, 50), pt("f", "fort", 20, 20)]);
    const s = scoreBattleMap(answer, map([pt("t", "label", 50, 50)]));
    expect(s.percent).toBe(0);
    expect(s.missedIds).toEqual(["i", "f"]);
    expect(s.attemptCount).toBe(0);
  });

  test("pointHalfTolerance_scores50", () => {
    const s = scoreBattleMap(map([pt("a1", "infantry", 50, 50)]), map([pt("u1", "infantry", 54, 50)]));
    expect(s.matches[0].score).toBe(0.5);
    expect(s.percent).toBe(50);
  });

  test("pointBeyondTolerance_noMatch", () => {
    const s = scoreBattleMap(map([pt("a1", "infantry", 50, 50)]), map([pt("u1", "infantry", 59, 50)]));
    expect(s.matches).toEqual([]);
    expect(s.missedIds.length).toBe(1);
    expect(s.extraIds.length).toBe(1);
    expect(s.percent).toBe(0);
  });

  test("spamSameSpot_onlyOneMatched", () => {
    const attempt = map([pt("u1", "infantry", 50, 50), pt("u2", "infantry", 50, 50), pt("u3", "infantry", 50, 50)]);
    const s = scoreBattleMap(map([pt("a1", "infantry", 50, 50)]), attempt);
    expect(s.matches.length).toBe(1);
    expect(s.extraIds.length).toBe(2);
    expect(s.percent).toBe(50);
  });

  test("sameGroupOtherType_halfCredit", () => {
    expect(scoreBattleMap(map([pt("a", "infantry", 50, 50)]), map([pt("u", "cavalry", 50, 50)])).percent).toBe(50);
  });

  test("otherFaction_halfCredit", () => {
    expect(scoreBattleMap(map([pt("a", "infantry", 50, 50)]), map([pt("u", "infantry", 50, 50, "b")])).percent).toBe(50);
  });

  test("differentGroup_noMatch", () => {
    expect(scoreBattleMap(map([pt("a", "infantry", 50, 50)]), map([pt("u", "fort", 50, 50)])).percent).toBe(0);
  });

  test("lineVsPoint_noMatch", () => {
    const answer = map([line("a", "defenseLine", [[40, 50], [60, 50]])]);
    expect(scoreBattleMap(answer, map([pt("u", "fort", 50, 50)])).percent).toBe(0);
  });

  test("reversedArrow_noMatch", () => {
    const answer = map([line("a", "arrow", [[0, 50], [40, 50]])]);
    const attempt = map([line("u", "arrow", [[40, 50], [0, 50]])]);
    expect(scoreBattleMap(answer, attempt).percent).toBe(0);
  });

  test("reversedDefenseLine_fullScore", () => {
    const answer = map([line("a", "defenseLine", [[0, 50], [40, 50]])]);
    const attempt = map([line("u", "defenseLine", [[40, 50], [0, 50]])]);
    expect(scoreBattleMap(answer, attempt).percent).toBe(100);
  });

  test("legacyAnswerWithoutPoints_matchesPointsAttempt", () => {
    const answer = map([{ ...pt("a", "arrow", 50, 50), size: 40, rotation: 0 }]);
    const attempt = map([line("u", "arrow", [[31.6, 50], [68.4, 50]])]);
    expect(scoreBattleMap(answer, attempt).percent).toBe(100);
  });

  test("aspectScalesVerticalDistance", () => {
    expect(scoreBattleMap(map([pt("a", "infantry", 50, 50)]), map([pt("u", "infantry", 50, 58)]), 2).percent).toBe(50);
  });

  test("labelAndStepIgnored", () => {
    const answer = map([pt("a", "infantry", 50, 50), pt("l", "label", 10, 10), pt("s", "step", 20, 20)]);
    const s = scoreBattleMap(answer, map([pt("u", "infantry", 50, 50)]));
    expect(s.percent).toBe(100);
    expect(s.answerCount).toBe(1);
  });

  test("scoreBattleMap_notGradable_throws", () => {
    const imageModeMap = { ...map([pt("a", "infantry", 50, 50)]), mode: "image" as const };
    expect(() => scoreBattleMap(imageModeMap, map([]))).toThrow("Lược đồ này chưa chấm được");
  });
});

describe("isGradableMap", () => {
  test("isGradableMap_rules", () => {
    expect(isGradableMap({ ...map([pt("a", "infantry", 50, 50)]), mode: "image" })).toBe(false);
    expect(isGradableMap(map([pt("l", "label", 50, 50)]))).toBe(false);
    expect(isGradableMap({ ...map([pt("a", "infantry", 50, 50)]), imageUrl: "" })).toBe(false);
    expect(isGradableMap(null)).toBe(false);
    expect(isGradableMap(map([pt("a", "infantry", 50, 50)]))).toBe(true);
  });
});

describe("resamplePath", () => {
  test("resamplePath_keepsEndpointsAndCount", () => {
    const out = resamplePath([{ x: 0, y: 0 }, { x: 10, y: 0 }], 20);
    expect(out.length).toBe(20);
    expect(out[0]).toEqual({ x: 0, y: 0 });
    expect(out[19]).toEqual({ x: 10, y: 0 });
    expect(out[1].x).toBeCloseTo(10 / 19, 6);
    expect(out[1].y).toBe(0);
  });

  test("resamplePath_followsEveryCorner", () => {
    const out = resamplePath([{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }], 3);
    expect(out[1].x).toBeCloseTo(10, 6);
    expect(out[1].y).toBeCloseTo(0, 6);
    expect(out[2]).toEqual({ x: 10, y: 10 });
  });
});
