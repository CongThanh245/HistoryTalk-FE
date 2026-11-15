import { autoLayout, createNode } from "./graph-utils";
import type { StoryDoc, StoryFlowEdge, StoryFlowNode, StoryNodeKind, StoryScript } from "./types";

const KINDS: StoryNodeKind[] = ["start", "line", "choice", "quiz", "end"];

/** Shape check for a script coming from the server (or an old local draft). */
export function isStoryScript(value: unknown): value is StoryScript {
  if (!value || typeof value !== "object") return false;
  const s = value as StoryScript;
  return (
    typeof s.title === "string" &&
    (s.status === "draft" || s.status === "published") &&
    Array.isArray(s.nodes) &&
    Array.isArray(s.edges) &&
    s.nodes.every(
      (n: StoryFlowNode) =>
        n && typeof n.id === "string" && KINDS.includes(n.type as StoryNodeKind) && n.data && KINDS.includes(n.data.kind) &&
        n.position && Number.isFinite(n.position.x) && Number.isFinite(n.position.y),
    ) &&
    s.edges.every((e: StoryFlowEdge) => e && typeof e.source === "string" && typeof e.target === "string") &&
    s.nodes.some((n) => n.data.kind === "start")
  );
}

/** A script the learner can play: published, with a start that leads somewhere. */
export function isPlayableScript(value: StoryScript | null | undefined): value is StoryScript {
  return !!value && value.status === "published" && value.nodes.length > 1;
}

export function scriptToDoc(script: StoryScript, context: { id: string; name: string }): StoryDoc {
  return {
    id: context.id,
    contextId: context.id,
    contextName: context.name,
    title: script.title,
    narratorId: script.narratorId ?? null,
    status: script.status,
    updatedAt: script.updatedAt ?? new Date().toISOString(),
    // The start node must never be deletable, whatever was stored.
    nodes: script.nodes.map((n) => ({ ...n, selected: false, deletable: n.data.kind !== "start" })),
    edges: script.edges,
  };
}

export function docToScript(doc: StoryDoc): StoryScript {
  return {
    version: 1,
    title: doc.title,
    narratorId: doc.narratorId,
    status: doc.status,
    updatedAt: new Date().toISOString(),
    nodes: doc.nodes.map(({ selected: _s, dragging: _d, measured: _m, className: _c, ...n }) => n as StoryFlowNode),
    edges: doc.edges.map(({ selected: _s, ...e }) => e),
  };
}

/** Start → one empty line → end, for a context that has no story yet. */
export function newStoryDoc(context: { id: string; name: string }): StoryDoc {
  const start = createNode("start", { x: 0, y: 0 });
  const first = createNode("line", { x: 0, y: 0 });
  const end = createNode("end", { x: 0, y: 0 });
  const edges: StoryFlowEdge[] = [
    { id: `e_${start.id}_${first.id}`, source: start.id, sourceHandle: "next", target: first.id, targetHandle: "in" },
    { id: `e_${first.id}_${end.id}`, source: first.id, sourceHandle: "next", target: end.id, targetHandle: "in" },
  ];
  return {
    id: context.id,
    contextId: context.id,
    contextName: context.name,
    title: `Kể chuyện: ${context.name}`,
    narratorId: null,
    status: "draft",
    updatedAt: new Date().toISOString(),
    nodes: autoLayout([start, first, end], edges),
    edges,
  };
}
