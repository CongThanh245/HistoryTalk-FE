import { describe, expect, test } from "bun:test";
import type { BattleMap, BattleSymbol, BattleSymbolType } from "./battle-map.types";
import { scoreBattleMap } from "./battle-map-scoring";
import { buildCompareMap, COMPARE_FACTIONS, toPracticeMap } from "./battle-map-practice";

const map = (symbols: BattleSymbol[], extra: Partial<BattleMap> = {}): BattleMap => ({
  version: 1, mode: "custom", imageUrl: "x.png", imageSource: "Nguồn",
  factions: [{ id: "a", name: "A", color: "#B8321F" }, { id: "b", name: "B", color: "#1F4E8C" }],
  symbols, ...extra,
});
const pt = (id: string, type: BattleSymbolType, x: number, y: number, factionId = "a"): BattleSymbol =>
  ({ id, type, factionId, label: "", x, y, size: 7, rotation: 0 });
const factionOf = (m: BattleMap, id: string) => m.symbols.find(s => s.id === id)?.factionId;

describe("toPracticeMap", () => {
  test("toPracticeMap_keepsBackgroundAndFactions_clearsSymbols", () => {
    const answer = map([pt("a1", "infantry", 50, 50, "a")], { phases: [{ id: "p", title: "P", narration: "", camera: "auto" }] });
    const sheet = toPracticeMap(answer);
    expect(sheet.imageUrl).toBe(answer.imageUrl);
    expect(sheet.imageSource).toBe(answer.imageSource);
    expect(sheet.factions).toEqual(answer.factions);
    expect(sheet.symbols).toEqual([]);
    expect(sheet.phases).toBeUndefined();
    expect(sheet.mode).toBe("custom");
  });
});

describe("buildCompareMap", () => {
  const answer = map([pt("A1", "infantry", 50, 50), pt("A2", "fort", 20, 20)]);

  test("buildCompareMap_coloursByStatus", () => {
    const attempt = map([pt("U1", "infantry", 52, 50), pt("U2", "cavalry", 80, 80)]);
    const result = buildCompareMap(answer, attempt, scoreBattleMap(answer, attempt));
    expect(factionOf(result, "you:U1")).toBe("cmp-partial");
    expect(factionOf(result, "you:U2")).toBe("cmp-extra");
    expect(factionOf(result, "ans:A2")).toBe("cmp-missed");
    expect(factionOf(result, "ans:A1")).toBe("cmp-answer");
    expect(result.factions).toEqual(COMPARE_FACTIONS);
    expect(result.phases).toBeUndefined();
  });

  test("buildCompareMap_exactMatchIsCorrect", () => {
    const attempt = map([pt("U1", "infantry", 50, 50)]);
    const result = buildCompareMap(answer, attempt, scoreBattleMap(answer, attempt));
    expect(factionOf(result, "you:U1")).toBe("cmp-correct");
  });

  test("buildCompareMap_keepsLabelsAsAnswerContext", () => {
    const withLabel = map([...answer.symbols, { ...pt("L", "label", 10, 10), label: "Sông Như Nguyệt" }]);
    const attempt = map([pt("U1", "infantry", 50, 50)]);
    const result = buildCompareMap(withLabel, attempt, scoreBattleMap(withLabel, attempt));
    expect(factionOf(result, "ans:L")).toBe("cmp-answer");
  });

  test("buildCompareMap_dropsLearnerTextAndSteps", () => {
    const attempt = map([pt("U1", "infantry", 50, 50), pt("T", "label", 5, 5), pt("S", "step", 6, 6)]);
    const result = buildCompareMap(answer, attempt, scoreBattleMap(answer, attempt));
    expect(result.symbols.some(s => s.id === "you:T" || s.id === "you:S")).toBe(false);
  });

  test("buildCompareMap_dropsPhases", () => {
    const phased = map([{ ...pt("A1", "infantry", 50, 50), phaseId: "p" }], { phases: [{ id: "p", title: "P", narration: "", camera: "auto" }] });
    const attempt = map([pt("U1", "infantry", 50, 50)]);
    const result = buildCompareMap(phased, attempt, scoreBattleMap(phased, attempt));
    expect(result.symbols.every(s => s.phaseId === undefined)).toBe(true);
  });
});

test("buildCompareMap_clearsLegendNotesButKeepsMapText", () => {
  const answer = map([{ ...pt("A1", "infantry", 50, 50), label: "Quân Tống" }, { ...pt("L", "label", 10, 10), label: "Sông Cầu" }]);
  const attempt = map([{ ...pt("U1", "infantry", 50, 50), label: "Quân ta" }]);
  const result = buildCompareMap(answer, attempt, scoreBattleMap(answer, attempt));
  expect(result.symbols.find(s => s.id === "ans:A1")?.label).toBe("");
  expect(result.symbols.find(s => s.id === "you:U1")?.label).toBe("");
  expect(result.symbols.find(s => s.id === "ans:L")?.label).toBe("Sông Cầu");
});

test("compareFactions_validColours", () => {
  for (const f of COMPARE_FACTIONS) expect(f.color).toMatch(/^#[0-9a-f]{6}$/i);
});
