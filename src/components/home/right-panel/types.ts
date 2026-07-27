export type GameMode = "character" | "event" | "timeline";

export const MODE_LABELS: Record<GameMode, string> = {
  character: "Đây là vị anh hùng nào",
  event: "Đây là sự kiện nào",
  timeline: "Hãy sắp xếp theo dòng thời gian",
};

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function getRandom<T>(arr: T[], exclude?: T): T {
  let item: T;
  do {
    item = arr[Math.floor(Math.random() * arr.length)];
  } while (arr.length > 1 && item === exclude);
  return item;
}

export function randomMode(exclude?: GameMode): GameMode {
  const modes: GameMode[] = ["character", "event", "timeline"];
  let m: GameMode;
  do {
    m = modes[Math.floor(Math.random() * modes.length)];
  } while (modes.length > 1 && m === exclude);
  return m;
}
