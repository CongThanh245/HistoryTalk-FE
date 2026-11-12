// AI story drafts come as a flat list of steps linked by "next" (see the AI authoring contract). This file turns
// them into editor nodes and edges, and turns the steps leading to a node back into that format for the AI.

import { autoLayout, nextNodeId, outputHandles, uid } from "./graph-utils";
import type { Expression, StoryFlowEdge, StoryFlowNode, StoryNodeData } from "./types";

export type AiLineStep = {
  id: string; type: "line"; speaker: string; text: string; expression: Expression;
  background: string | null; sources: string[]; next: string | null;
};
export type AiChoiceStep = { id: string; type: "choice"; speaker: string; prompt: string; options: { label: string; next: string }[] };
export type AiQuizStep = {
  id: string; type: "quiz"; speaker: string; question: string; answers: string[]; correctIndex: number;
  explanation: string; sources: string[]; next: string | null; wrongNext: string | null;
};
export type AiEndStep = { id: string; type: "end"; title: string; summary: string };
export type AiStep = AiLineStep | AiChoiceStep | AiQuizStep | AiEndStep;

export type AiStoryDraft = { title: string; startId: string; steps: AiStep[]; warnings: string[] };

const speakerOf = (speaker: string) => (speaker === "narrator" ? null : speaker);

function dataOf(step: AiStep): { data: StoryNodeData; links: { handle: string; target: string | null }[] } {
  switch (step.type) {
    case "line":
      return {
        data: { kind: "line", speakerId: speakerOf(step.speaker), text: step.text, expression: step.expression, background: step.background },
        links: [{ handle: "next", target: step.next }],
      };
    case "choice": {
      const options = step.options.map((o) => ({ id: uid("o"), label: o.label }));
      return {
        data: { kind: "choice", speakerId: speakerOf(step.speaker), prompt: step.prompt, options },
        links: options.map((o, i) => ({ handle: o.id, target: step.options[i].next })),
      };
    }
    case "quiz": {
      const answers = step.answers.map((label) => ({ id: uid("o"), label }));
      return {
        data: {
          kind: "quiz", speakerId: speakerOf(step.speaker), question: step.question, answers,
          correctId: answers[step.correctIndex]?.id ?? answers[0]?.id ?? null, explanation: step.explanation,
        },
        // Without a "wrongNext", a wrong answer simply carries on like a right one.
        links: [{ handle: "correct", target: step.next }, { handle: "wrong", target: step.wrongNext ?? step.next }],
      };
    }
    case "end":
      return { data: { kind: "end", title: step.title, summary: step.summary, xp: 30, unlockCharacters: true }, links: [] };
  }
}

function edge(source: string, handle: string, target: string): StoryFlowEdge {
  return { id: uid("e"), source, sourceHandle: handle, target, targetHandle: "in" };
}

/**
 * Nodes and edges of the steps, with fresh ids. Links to steps outside the list are dropped, except `exit`:
 * a step whose "next" is null then continues to `exit` (where the inserted steps rejoin the story).
 */
export function stepsToGraph(steps: AiStep[], exit: string | null = null) {
  const idOf = new Map(steps.map((s) => [s.id, uid()]));
  const nodes: StoryFlowNode[] = [];
  const edges: StoryFlowEdge[] = [];
  for (const step of steps) {
    const { data, links } = dataOf(step);
    const id = idOf.get(step.id)!;
    nodes.push({ id, type: data.kind, position: { x: 0, y: 0 }, data, deletable: true });
    for (const { handle, target } of links) {
      const to = target === null ? exit : idOf.get(target);
      if (to) edges.push(edge(id, handle, to));
    }
  }
  return { nodes, edges, idOf };
}

/** A whole new story: the start node followed by the draft, laid out. */
export function draftToStory(draft: AiStoryDraft): { nodes: StoryFlowNode[]; edges: StoryFlowEdge[] } {
  const start: StoryFlowNode = { id: "start", type: "start", position: { x: 0, y: 0 }, data: { kind: "start", note: "" }, deletable: false };
  const { nodes, edges, idOf } = stepsToGraph(draft.steps);
  const first = idOf.get(draft.startId);
  const all = [start, ...nodes];
  const allEdges = first ? [edge("start", "next", first), ...edges] : edges;
  return { nodes: autoLayout(all, allEdges), edges: allEdges };
}

/**
 * Inserts the steps after `after` (through its `handle`): whatever came next before now follows the last
 * inserted step, so the story is not cut.
 */
export function insertSteps(
  nodes: StoryFlowNode[], edges: StoryFlowEdge[], steps: AiStep[], startId: string, after: string, handle: string,
) {
  const exit = nextNodeId(edges, after, handle);
  const added = stepsToGraph(steps, exit);
  const first = added.idOf.get(startId);
  if (!first) return { nodes, edges };
  const kept = edges.filter((e) => !(e.source === after && (e.sourceHandle ?? "next") === handle));
  const anchor = nodes.find((n) => n.id === after);
  // Place the new steps to the right of where they attach; "Tự sắp xếp" can tidy the rest.
  const placed = added.nodes.map((n, i) => ({ ...n, position: { x: (anchor?.position.x ?? 0) + 320 * (i + 1), y: (anchor?.position.y ?? 0) + 120 } }));
  return { nodes: [...nodes, ...placed], edges: [...kept, edge(after, handle, first), ...added.edges] };
}

/** The node's step in the AI format, for "previousSteps" and "step". */
export function nodeToStep(node: StoryFlowNode): Record<string, unknown> | null {
  const d = node.data;
  const speaker = "speakerId" in d ? d.speakerId ?? "narrator" : "narrator";
  switch (d.kind) {
    case "line":
      return { id: node.id, type: "line", speaker, text: d.text, expression: d.expression, background: d.background };
    case "choice":
      return { id: node.id, type: "choice", speaker, prompt: d.prompt, options: d.options.map((o) => ({ label: o.label })) };
    case "quiz":
      return { id: node.id, type: "quiz", speaker, question: d.question, answers: d.answers.map((a) => a.label) };
    default:
      return null;
  }
}

/** Steps on the way from the start node to `targetId` (included), in reading order. */
export function stepsLeadingTo(nodes: StoryFlowNode[], edges: StoryFlowEdge[], targetId: string, limit = 12) {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const start = nodes.find((n) => n.data.kind === "start");
  if (!start) return [];
  const parent = new Map<string, string>();
  const queue = [start.id];
  const seen = new Set([start.id]);
  while (queue.length && !seen.has(targetId)) {
    const id = queue.shift()!;
    const node = byId.get(id);
    if (!node) continue;
    for (const h of outputHandles(node.data)) {
      const to = nextNodeId(edges, id, h.id);
      if (to && !seen.has(to)) {
        seen.add(to);
        parent.set(to, id);
        queue.push(to);
      }
    }
  }
  const path: StoryFlowNode[] = [];
  for (let id: string | undefined = targetId; id && id !== start.id; id = parent.get(id)) {
    const node = byId.get(id);
    if (node) path.unshift(node);
  }
  return path.map(nodeToStep).filter((s): s is Record<string, unknown> => s !== null).slice(-limit);
}
