import type {
  StoryFlowEdge,
  StoryFlowNode,
  StoryIssue,
  StoryNodeData,
  StoryNodeKind,
  StoryOption,
} from "./types";

export function uid(prefix = "n") {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-3)}`;
}

export function option(label: string): StoryOption {
  return { id: uid("o"), label };
}

export function defaultData(kind: StoryNodeKind, speakerId: string | null = null): StoryNodeData {
  switch (kind) {
    case "start":
      return { kind, note: "" };
    case "line":
      return { kind, speakerId, text: "", expression: "neutral", background: null };
    case "choice":
      return { kind, speakerId, prompt: "", options: [option("Lựa chọn 1"), option("Lựa chọn 2")] };
    case "quiz": {
      const answers = [option(""), option(""), option("")];
      return { kind, speakerId, question: "", answers, correctId: answers[0].id, explanation: "" };
    }
    case "end":
      return { kind, title: "Hoàn thành", summary: "", xp: 30, unlockCharacters: true };
  }
}

export function createNode(
  kind: StoryNodeKind,
  position: { x: number; y: number },
  speakerId: string | null = null,
): StoryFlowNode {
  return {
    id: kind === "start" ? "start" : uid(),
    type: kind,
    position,
    data: defaultData(kind, speakerId),
    deletable: kind !== "start",
  };
}

/** Deep copy with fresh ids (options included) so handles don't collide. */
export function cloneNode(node: StoryFlowNode, offset = 48): StoryFlowNode {
  const data = structuredClone(node.data);
  if (data.kind === "choice") data.options = data.options.map((o) => ({ ...o, id: uid("o") }));
  if (data.kind === "quiz") {
    const correctIndex = data.answers.findIndex((a) => a.id === data.correctId);
    data.answers = data.answers.map((a) => ({ ...a, id: uid("o") }));
    data.correctId = data.answers[correctIndex]?.id ?? null;
  }
  return {
    id: uid(),
    type: node.type,
    position: { x: node.position.x + offset, y: node.position.y + offset },
    data,
    selected: true,
  };
}

export type OutputHandle = { id: string; label: string; tone?: "good" | "bad" };

/** Output handles of a node, in display order. */
export function outputHandles(data: StoryNodeData): OutputHandle[] {
  switch (data.kind) {
    case "start":
    case "line":
      return [{ id: "next", label: "Tiếp" }];
    case "choice":
      return data.options.map((o, i) => ({ id: o.id, label: o.label.trim() || `Lựa chọn ${i + 1}` }));
    case "quiz":
      return [
        { id: "correct", label: "Trả lời đúng", tone: "good" },
        { id: "wrong", label: "Trả lời sai", tone: "bad" },
      ];
    case "end":
      return [];
  }
}

export function nextNodeId(edges: StoryFlowEdge[], source: string, handle: string): string | null {
  return edges.find((e) => e.source === source && (e.sourceHandle ?? "next") === handle)?.target ?? null;
}

/** Ids reachable from the start node. */
export function reachableFrom(startId: string, edges: StoryFlowEdge[]) {
  const seen = new Set<string>([startId]);
  const queue = [startId];
  while (queue.length) {
    const id = queue.shift()!;
    for (const e of edges) {
      if (e.source === id && !seen.has(e.target)) {
        seen.add(e.target);
        queue.push(e.target);
      }
    }
  }
  return seen;
}

const LONG_LINE = 220;

export function validateStory(nodes: StoryFlowNode[], edges: StoryFlowEdge[]): StoryIssue[] {
  const issues: StoryIssue[] = [];
  const start = nodes.find((n) => n.data.kind === "start");
  if (!start) return [{ nodeId: "", level: "error", message: "Thiếu nút Bắt đầu" }];

  const reachable = reachableFrom(start.id, edges);
  const linked = (id: string, handle: string) => nextNodeId(edges, id, handle) !== null;
  let reachableEnd = false;

  for (const node of nodes) {
    const d = node.data;
    const push = (level: StoryIssue["level"], message: string) => issues.push({ nodeId: node.id, level, message });

    if (!reachable.has(node.id)) push("warning", "Không có đường đi tới nút này từ Bắt đầu");

    switch (d.kind) {
      case "start":
        if (!linked(node.id, "next")) push("error", "Bắt đầu chưa nối với bước nào");
        break;
      case "line":
        if (!d.text.trim()) push("error", "Lời thoại đang trống");
        else if (d.text.length > LONG_LINE) push("warning", `Lời thoại dài ${d.text.length} ký tự, nên tách làm 2`);
        if (!linked(node.id, "next")) push("error", "Chưa nối tới bước tiếp theo");
        break;
      case "choice":
        if (d.options.length < 2) push("error", "Cần ít nhất 2 lựa chọn");
        d.options.forEach((o, i) => {
          if (!o.label.trim()) push("error", `Lựa chọn ${i + 1} chưa có nội dung`);
          if (!linked(node.id, o.id)) push("error", `Lựa chọn "${o.label.trim() || i + 1}" chưa nối tiếp`);
        });
        break;
      case "quiz":
        if (!d.question.trim()) push("error", "Câu hỏi đang trống");
        if (d.answers.filter((a) => a.label.trim()).length < 2) push("error", "Cần ít nhất 2 đáp án");
        if (!d.correctId || !d.answers.some((a) => a.id === d.correctId && a.label.trim()))
          push("error", "Chưa chọn đáp án đúng");
        if (!linked(node.id, "correct")) push("error", "Nhánh trả lời đúng chưa nối tiếp");
        if (!linked(node.id, "wrong")) push("warning", "Nhánh sai chưa nối: trả lời sai sẽ đi theo nhánh đúng");
        if (!d.explanation.trim()) push("warning", "Nên có lời giải thích khi trả lời sai");
        break;
      case "end":
        if (reachable.has(node.id)) reachableEnd = true;
        break;
    }
  }

  if (!reachableEnd) issues.push({ nodeId: start.id, level: "error", message: "Câu chuyện chưa có nút Kết thúc nào đi tới được" });
  return issues;
}

/** Rough on-canvas height, used to space nodes in the auto layout. */
function estimateHeight(data: StoryNodeData) {
  const handles = outputHandles(data).length;
  switch (data.kind) {
    case "start":
      return 64;
    case "choice":
    case "quiz":
      return 112 + handles * 30;
    default:
      return 132;
  }
}

const COLUMN_GAP = 340;
const ROW_GAP = 40;

/**
 * Layered left-to-right layout: column = shortest distance from the start,
 * rows follow the order branches are discovered so siblings stay together.
 * Nodes not reachable from the start go in an extra column at the end.
 */
export function autoLayout(nodes: StoryFlowNode[], edges: StoryFlowEdge[]): StoryFlowNode[] {
  const start = nodes.find((n) => n.data.kind === "start");
  if (!start) return nodes;
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const depth = new Map<string, number>([[start.id, 0]]);
  const order: string[] = [start.id];
  const queue = [start.id];

  while (queue.length) {
    const id = queue.shift()!;
    const node = byId.get(id);
    if (!node) continue;
    for (const handle of outputHandles(node.data)) {
      const target = nextNodeId(edges, id, handle.id);
      if (target && byId.has(target) && !depth.has(target)) {
        depth.set(target, depth.get(id)! + 1);
        order.push(target);
        queue.push(target);
      }
    }
  }

  const maxDepth = Math.max(0, ...depth.values());
  for (const n of nodes) {
    if (!depth.has(n.id)) {
      depth.set(n.id, maxDepth + 1);
      order.push(n.id);
    }
  }

  const columns = new Map<number, string[]>();
  for (const id of order) {
    const d = depth.get(id)!;
    columns.set(d, [...(columns.get(d) ?? []), id]);
  }

  const positions = new Map<string, { x: number; y: number }>();
  for (const [col, ids] of columns) {
    const heights = ids.map((id) => estimateHeight(byId.get(id)!.data));
    const total = heights.reduce((a, b) => a + b, 0) + ROW_GAP * (ids.length - 1);
    let y = -total / 2;
    ids.forEach((id, i) => {
      positions.set(id, { x: col * COLUMN_GAP, y });
      y += heights[i] + ROW_GAP;
    });
  }

  return nodes.map((n) => ({ ...n, position: positions.get(n.id) ?? n.position }));
}

export function storyStats(nodes: StoryFlowNode[]) {
  let chars = 0;
  let lines = 0;
  let interactions = 0;
  for (const n of nodes) {
    const d = n.data;
    if (d.kind === "line") {
      lines++;
      chars += d.text.length;
    } else if (d.kind === "choice" || d.kind === "quiz") {
      interactions++;
      chars += 60;
    }
  }
  // ~15 characters a second when read aloud, plus ~8s per interaction.
  const seconds = Math.round(chars / 15 + interactions * 8);
  return { lines, interactions, seconds };
}

export function formatDuration(seconds: number) {
  if (seconds < 60) return `${seconds} giây`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s ? `${m} phút ${s} giây` : `${m} phút`;
}
