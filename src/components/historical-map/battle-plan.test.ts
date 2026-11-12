import { describe, expect, test } from "bun:test";
import { emptyBattleMap, isBattleMap, type BattleMap } from "./battle-map.types";
import { compileBattlePlan, type BattlePlan } from "./battle-plan";

const plan = (symbols: BattlePlan["phases"][number]["symbols"]): BattlePlan => ({
  factions: [{ id: "ta", name: "Quân Đại Việt", side: "ally" }, { id: "tong", name: "Quân Tống", side: "enemy" }],
  anchors: [
    { id: "nam", name: "Bờ nam", hint: "", kind: "area" },
    { id: "bac", name: "Bờ bắc", hint: "", kind: "area" },
    { id: "kenh", name: "Đông Kênh", hint: "", kind: "point" },
  ],
  phases: [{ title: "Bố trí", narration: "Quân ta đắp lũy.", sources: [], camera: "auto", symbols }],
  warnings: [],
});
const positions = { nam: { x: 50, y: 70 }, bac: { x: 50, y: 30 }, kenh: { x: 85, y: 40 } };
const base = (): BattleMap => ({
  ...emptyBattleMap(), imageUrl: "map.png",
  factions: [{ id: "f1", name: "Quân Đại Việt", color: "#b91c1c" }],
});

describe("compileBattlePlan", () => {
  test("reuses the map's side by name and adds the new one with its side's colour", () => {
    const { map } = compileBattlePlan(plan([{ type: "camp", faction: "tong", at: "bac" }]), positions, base());

    expect(map.factions.map(f => f.name)).toEqual(["Quân Đại Việt", "Quân Tống"]);
    expect(map.factions[1].color).toBe("#1d4ed8");
    expect(map.symbols[0].factionId).toBe(map.factions[1].id);
    expect(isBattleMap(map)).toBe(true);
  });

  test("movements run from one landmark to the other, bent apart when they share a route", () => {
    const { map } = compileBattlePlan(plan([
      { type: "arrow", faction: "tong", from: "bac", to: "nam" },
      { type: "retreat", faction: "tong", from: "nam", to: "bac" },
    ]), positions, base());

    const [first, second] = map.symbols;
    expect(first.points?.[0]).toEqual({ x: 50, y: 30 });
    expect(first.points?.[2]).toEqual({ x: 50, y: 70 });
    expect(first.points?.[1].x).not.toBe(second.points?.[1].x);
  });

  test("symbols on the same landmark are spread around it", () => {
    const { map } = compileBattlePlan(plan([
      { type: "infantry", faction: "ta", at: "nam" },
      { type: "archer", faction: "ta", at: "nam" },
      { type: "stakes", faction: "ta", at: "kenh" },
    ]), positions, base());

    expect([map.symbols[0].x, map.symbols[0].y]).toEqual([50, 70]);
    expect([map.symbols[1].x, map.symbols[1].y]).not.toEqual([50, 70]);
    expect(map.symbols[2].points).toEqual([{ x: 78, y: 40 }, { x: 92, y: 40 }]);
  });

  test("symbols whose landmark is not placed are skipped, not guessed", () => {
    const { map, skipped } = compileBattlePlan(plan([
      { type: "clash", faction: "ta", at: "thang-long" },
      { type: "march", faction: "ta", from: "nam", to: "thang-long" },
      { type: "victory", faction: "ta", at: "nam" },
    ]), positions, base());

    expect(skipped).toBe(2);
    expect(map.symbols.map(s => s.type)).toEqual(["victory"]);
  });

  test("phases are added after the existing ones and own their symbols", () => {
    const current = { ...base(), phases: [{ id: "p0", title: "Cũ", narration: "", camera: "full" as const }] };

    const { map } = compileBattlePlan(plan([{ type: "fort", faction: "ta", at: "nam" }]), positions, current);

    expect(map.phases?.map(p => p.title)).toEqual(["Cũ", "Bố trí"]);
    expect(map.symbols[0].phaseId).toBe(map.phases?.[1].id);
  });
});
