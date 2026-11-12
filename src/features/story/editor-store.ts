"use client";

import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type EdgeChange,
  type NodeChange,
} from "@xyflow/react";
import { create } from "zustand";
import { autoLayout, cloneNode, createNode, outputHandles, uid } from "./graph-utils";
import type { StoryDoc, StoryFlowEdge, StoryFlowNode, StoryNodeData, StoryNodeKind } from "./types";

type Snapshot = { nodes: StoryFlowNode[]; edges: StoryFlowEdge[] };
type Meta = Omit<StoryDoc, "nodes" | "edges">;

const HISTORY_LIMIT = 80;
/** Typing in the same field within this window is one undo step. */
const COALESCE_MS = 1200;

type EditorState = {
  meta: Meta | null;
  nodes: StoryFlowNode[];
  edges: StoryFlowEdge[];
  past: Snapshot[];
  future: Snapshot[];
  coalesce: { key: string; at: number } | null;
  /** Bumped on every content change; the page autosaves on it. */
  revision: number;

  load: (doc: StoryDoc) => void;
  toDoc: () => StoryDoc | null;
  commit: (coalesceKey?: string) => void;
  undo: () => void;
  redo: () => void;

  onNodesChange: (changes: NodeChange<StoryFlowNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<StoryFlowEdge>[]) => void;
  connect: (connection: Connection) => void;

  addNode: (
    kind: StoryNodeKind,
    position: { x: number; y: number },
    from?: { source: string; handle: string },
  ) => string;
  updateData: (id: string, patch: Partial<StoryNodeData>, coalesceKey?: string) => void;
  updateMeta: (patch: Partial<Meta>) => void;
  duplicate: (ids: string[]) => void;
  remove: (ids: string[]) => void;
  select: (id: string | null) => void;
  layout: () => void;
};

/** Edges whose handle no longer exists on their source node are dropped. */
function pruneEdges(nodes: StoryFlowNode[], edges: StoryFlowEdge[]) {
  const handles = new Map(nodes.map((n) => [n.id, new Set(outputHandles(n.data).map((h) => h.id))]));
  const ids = new Set(nodes.map((n) => n.id));
  return edges.filter((e) => ids.has(e.target) && handles.get(e.source)?.has(e.sourceHandle ?? "next"));
}

function makeEdge(source: string, handle: string, target: string): StoryFlowEdge {
  return { id: uid("e"), source, sourceHandle: handle, target, targetHandle: "in" };
}

export const useStoryEditor = create<EditorState>((set, get) => ({
  meta: null,
  nodes: [],
  edges: [],
  past: [],
  future: [],
  coalesce: null,
  revision: 0,

  load: (doc) => {
    const { nodes, edges, ...meta } = doc;
    set({ meta, nodes, edges, past: [], future: [], coalesce: null, revision: 0 });
  },

  toDoc: () => {
    const { meta, nodes, edges } = get();
    if (!meta) return null;
    // Selection is editor state, not content.
    return { ...meta, nodes: nodes.map(({ selected: _s, dragging: _d, measured: _m, ...n }) => n as StoryFlowNode), edges };
  },

  commit: (coalesceKey) => {
    const { nodes, edges, past, coalesce } = get();
    const now = Date.now();
    if (coalesceKey && coalesce?.key === coalesceKey && now - coalesce.at < COALESCE_MS) {
      set({ coalesce: { key: coalesceKey, at: now } });
      return;
    }
    set({
      past: [...past, { nodes, edges }].slice(-HISTORY_LIMIT),
      future: [],
      coalesce: coalesceKey ? { key: coalesceKey, at: now } : null,
    });
  },

  undo: () => {
    const { past, future, nodes, edges, revision } = get();
    const prev = past.at(-1);
    if (!prev) return;
    set({
      nodes: prev.nodes,
      edges: prev.edges,
      past: past.slice(0, -1),
      future: [{ nodes, edges }, ...future],
      coalesce: null,
      revision: revision + 1,
    });
  },

  redo: () => {
    const { past, future, nodes, edges, revision } = get();
    const next = future[0];
    if (!next) return;
    set({
      nodes: next.nodes,
      edges: next.edges,
      past: [...past, { nodes, edges }],
      future: future.slice(1),
      coalesce: null,
      revision: revision + 1,
    });
  },

  onNodesChange: (changes) => {
    const content = changes.some((c) => c.type === "remove" || (c.type === "position" && !c.dragging));
    if (changes.some((c) => c.type === "remove")) get().commit();
    const nodes = applyNodeChanges(changes, get().nodes);
    const edges = changes.some((c) => c.type === "remove") ? pruneEdges(nodes, get().edges) : get().edges;
    set({ nodes, edges, revision: content ? get().revision + 1 : get().revision });
  },

  onEdgesChange: (changes) => {
    const content = changes.some((c) => c.type === "remove");
    if (content) get().commit();
    set({ edges: applyEdgeChanges(changes, get().edges), revision: content ? get().revision + 1 : get().revision });
  },

  connect: ({ source, sourceHandle, target }) => {
    if (!source || !target || source === target) return;
    const targetNode = get().nodes.find((n) => n.id === target);
    if (!targetNode || targetNode.data.kind === "start") return;
    const handle = sourceHandle ?? "next";
    get().commit();
    // One outgoing edge per handle: a new connection replaces the old one.
    const kept = get().edges.filter((e) => !(e.source === source && (e.sourceHandle ?? "next") === handle));
    set({
      edges: addEdge(makeEdge(source, handle, target), kept),
      revision: get().revision + 1,
    });
  },

  addNode: (kind, position, from) => {
    const { meta } = get();
    get().commit();
    const node = { ...createNode(kind, position, meta?.narratorId ?? null), selected: true };
    let edges = get().edges;
    if (from) {
      edges = edges.filter((e) => !(e.source === from.source && (e.sourceHandle ?? "next") === from.handle));
      edges = [...edges, makeEdge(from.source, from.handle, node.id)];
    }
    set({
      nodes: [...get().nodes.map((n) => ({ ...n, selected: false })), node],
      edges,
      revision: get().revision + 1,
    });
    return node.id;
  },

  updateData: (id, patch, coalesceKey) => {
    get().commit(coalesceKey ? `${id}:${coalesceKey}` : undefined);
    const nodes = get().nodes.map((n) =>
      n.id === id ? ({ ...n, data: { ...n.data, ...patch } as StoryNodeData } as StoryFlowNode) : n,
    );
    set({ nodes, edges: pruneEdges(nodes, get().edges), revision: get().revision + 1 });
  },

  updateMeta: (patch) => {
    const { meta } = get();
    if (!meta) return;
    set({ meta: { ...meta, ...patch }, revision: get().revision + 1 });
  },

  duplicate: (ids) => {
    const source = get().nodes.filter((n) => ids.includes(n.id) && n.data.kind !== "start");
    if (!source.length) return;
    get().commit();
    const copies = source.map((n) => cloneNode(n));
    set({
      nodes: [...get().nodes.map((n) => ({ ...n, selected: false })), ...copies],
      revision: get().revision + 1,
    });
  },

  remove: (ids) => {
    const removable = new Set(get().nodes.filter((n) => ids.includes(n.id) && n.deletable !== false).map((n) => n.id));
    if (!removable.size) return;
    get().commit();
    const nodes = get().nodes.filter((n) => !removable.has(n.id));
    set({ nodes, edges: pruneEdges(nodes, get().edges), revision: get().revision + 1 });
  },

  select: (id) => {
    set({ nodes: get().nodes.map((n) => (n.selected === (n.id === id) ? n : { ...n, selected: n.id === id })) });
  },

  layout: () => {
    get().commit();
    set({ nodes: autoLayout(get().nodes, get().edges), revision: get().revision + 1 });
  },
}));
