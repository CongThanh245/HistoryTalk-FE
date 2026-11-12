"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent, type MouseEvent as ReactMouseEvent } from "react";
import Link from "next/link";
import {
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  MiniMap,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type FinalConnectionState,
  type IsValidConnection,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  ArrowLeft,
  CircleAlert,
  CloudCheck,
  Loader2,
  Maximize2,
  Minimize2,
  Play,
  Redo2,
  Rocket,
  Sparkles,
  Undo2,
  Wand2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";
import { ROUTES } from "@/constants/routes";
import { useStoryEditor } from "@/features/story/editor-store";
import { validateStory } from "@/features/story/graph-utils";
import { storyRepo } from "@/features/story/mock-data";
import { useAuthStore } from "@/store/auth.store";
import { StoryAiDialog } from "./story-ai-dialog";
import { ADDABLE_KINDS, KIND_META } from "@/features/story/story-meta";
import type { StoryFlowNode, StoryIssue, StoryNodeKind } from "@/features/story/types";
import "@/features/story/story.css";
import { StoryPlayer } from "../player/story-player";
import { ScaledStage } from "../player/scaled-stage";
import { DeletableEdge } from "./deletable-edge";
import { EditorContext } from "./editor-context";
import { NodeInspector } from "./node-inspector";
import { DRAG_MIME, NodePalette } from "./node-palette";
import { storyNodeTypes } from "./story-nodes";

const edgeTypes = { deletable: DeletableEdge };
const defaultEdgeOptions = {
  type: "deletable",
  markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16, color: "var(--text-tertiary)" },
};

type QuickAdd = { x: number; y: number; flow: { x: number; y: number }; from?: { source: string; handle: string } };
type Preview = { from?: string; docked: boolean };

function ToolButton({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid size-9 cursor-pointer place-items-center rounded-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-deep)] hover:text-[var(--text-primary)] disabled:pointer-events-none disabled:opacity-30"
    >
      {children}
    </button>
  );
}

function SaveStatus({ saving, savedAt }: { saving: boolean; savedAt: Date | null }) {
  if (saving)
    return (
      <span className="flex items-center gap-1.5 text-[12px] text-[var(--text-muted)]">
        <Loader2 className="size-3.5 animate-spin" /> Đang lưu…
      </span>
    );
  if (!savedAt) return null;
  return (
    <span className="flex items-center gap-1.5 text-[12px] text-[var(--text-muted)]" title="Tự động lưu trên trình duyệt (dữ liệu giả, chưa nối backend)">
      <CloudCheck className="size-3.5" /> Đã lưu {savedAt.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
    </span>
  );
}

function QuickAddMenu({ menu, onPick, onClose }: { menu: QuickAdd; onPick: (kind: StoryNodeKind) => void; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      const kind = ADDABLE_KINDS.find((k) => KIND_META[k].shortcut === e.key);
      if (kind) {
        e.preventDefault();
        onPick(kind);
      }
    };
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onDown);
    };
  }, [onPick, onClose]);

  return (
    <div
      ref={ref}
      className="story-fade-in absolute z-50 w-56 overflow-hidden rounded-md border border-[var(--border-strong)] bg-[var(--bg-elevated)] shadow-[0_16px_40px_-16px_rgba(0,0,0,0.5)]"
      style={{ left: menu.x, top: menu.y }}
    >
      <p className="border-b border-[var(--border-default)] px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
        {menu.from ? "Tạo bước tiếp theo" : "Thêm bước"}
      </p>
      {ADDABLE_KINDS.map((kind) => {
        const meta = KIND_META[kind];
        const Icon = meta.icon;
        return (
          <button
            key={kind}
            type="button"
            onClick={() => onPick(kind)}
            className="flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-left text-[13px] hover:bg-[var(--bg-deep)]"
          >
            <span className="grid size-6 place-items-center rounded-sm text-white" style={{ background: meta.color }}>
              <Icon className="size-3.5" />
            </span>
            <span className="flex-1 font-medium">{meta.label}</span>
            <kbd className="rounded-[3px] border border-[var(--border-strong)] px-1 font-mono text-[10px] text-[var(--text-muted)]">{meta.shortcut}</kbd>
          </button>
        );
      })}
    </div>
  );
}

function EditorInner({ storyId }: { storyId: string }) {
  const flow = useReactFlow<StoryFlowNode>();
  const wrapperRef = useRef<HTMLDivElement>(null);

  const meta = useStoryEditor((s) => s.meta);
  const nodes = useStoryEditor((s) => s.nodes);
  const edges = useStoryEditor((s) => s.edges);
  const revision = useStoryEditor((s) => s.revision);
  const canUndo = useStoryEditor((s) => s.past.length > 0);
  const canRedo = useStoryEditor((s) => s.future.length > 0);
  const { load, toDoc, commit, undo, redo, onNodesChange, onEdgesChange, connect, addNode, duplicate, select, layout, updateMeta } =
    useStoryEditor.getState();

  const [status, setStatus] = useState<"loading" | "ready" | "missing">("loading");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [quickAdd, setQuickAdd] = useState<QuickAdd | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [liveId, setLiveId] = useState<string | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const role = useAuthStore((s) => s.user?.role);
  const canUseAi = role === "CONTENT_ADMIN" || role === "TEACHER";

  // Load (localStorage is client-only).
  useEffect(() => {
    const doc = storyRepo.get(storyId);
    if (!doc) {
      setStatus("missing");
      return;
    }
    load(doc);
    setSavedAt(new Date(doc.updatedAt));
    setStatus("ready");
    requestAnimationFrame(() => fitOrStart());
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on story change
  }, [storyId, load, flow]);

  /**
   * Fit the whole story when it is readable that way; a long story would be
   * shrunk to unreadable cards, so start at the beginning at a working zoom instead.
   */
  function fitOrStart() {
    const box = wrapperRef.current?.getBoundingClientRect();
    const all = flow.getNodes();
    if (!box || !all.length) return;
    const bounds = flow.getNodesBounds(all);
    const zoom = Math.min(box.width / (bounds.width + 160), box.height / (bounds.height + 160), 1);
    if (zoom >= 0.6) {
      flow.fitView({ padding: 0.15, maxZoom: 1, duration: 300 });
      return;
    }
    const start = all.find((n) => n.type === "start") ?? all[0];
    flow.setViewport({ x: 80 - start.position.x * 0.8, y: box.height / 2 - start.position.y * 0.8, zoom: 0.8 }, { duration: 300 });
  }

  // Autosave shortly after the last change.
  useEffect(() => {
    if (status !== "ready" || revision === 0) return;
    setSaving(true);
    const t = window.setTimeout(() => {
      const doc = toDoc();
      if (doc) storyRepo.save(doc);
      setSaving(false);
      setSavedAt(new Date());
    }, 700);
    return () => window.clearTimeout(t);
  }, [revision, status, toDoc]);

  const issues = useMemo(() => validateStory(nodes, edges), [nodes, edges]);
  const issuesByNode = useMemo(() => {
    const map = new Map<string, StoryIssue[]>();
    for (const i of issues) map.set(i.nodeId, [...(map.get(i.nodeId) ?? []), i]);
    return map;
  }, [issues]);
  const connectedHandles = useMemo(() => new Set(edges.map((e) => `${e.source}:${e.sourceHandle ?? "next"}`)), [edges]);
  const editorContext = useMemo(() => ({ issuesByNode, connectedHandles }), [issuesByNode, connectedHandles]);
  const errorCount = issues.filter((i) => i.level === "error").length;
  const selected = useMemo(() => nodes.filter((n) => n.selected), [nodes]);

  // Highlight the node the preview is on.
  const displayNodes = useMemo(
    () => (preview && liveId ? nodes.map((n) => (n.id === liveId ? { ...n, className: "story-live" } : n)) : nodes),
    [nodes, preview, liveId],
  );

  const focusNode = useCallback(
    (id: string) => {
      const node = flow.getNode(id);
      if (!node) return;
      select(id);
      const w = node.measured?.width ?? 260;
      const h = node.measured?.height ?? 120;
      flow.setCenter(node.position.x + w / 2, node.position.y + h / 2, { zoom: Math.max(flow.getZoom(), 0.9), duration: 450 });
    },
    [flow, select],
  );

  const addAtCenter = useCallback(
    (kind: StoryNodeKind) => {
      const box = wrapperRef.current?.getBoundingClientRect();
      if (!box) return;
      const base = flow.screenToFlowPosition({ x: box.left + box.width / 2, y: box.top + box.height / 2 });
      // Place next to the selected node and link it, so clicking the palette builds a chain.
      const anchor = selected.length === 1 ? selected[0] : null;
      const handle = anchor ? (anchor.data.kind === "line" || anchor.data.kind === "start" ? "next" : null) : null;
      const position = anchor
        ? { x: anchor.position.x + 340, y: anchor.position.y }
        : { x: base.x - 130 + (Math.random() * 40 - 20), y: base.y - 60 + (Math.random() * 40 - 20) };
      const id = addNode(kind, position, anchor && handle && !connectedHandles.has(`${anchor.id}:next`) ? { source: anchor.id, handle } : undefined);
      requestAnimationFrame(() => focusNode(id));
    },
    [flow, selected, addNode, connectedHandles, focusNode],
  );

  const onDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      const kind = e.dataTransfer.getData(DRAG_MIME) as StoryNodeKind;
      if (!kind) return;
      const pos = flow.screenToFlowPosition({ x: e.clientX, y: e.clientY });
      addNode(kind, { x: pos.x - 130, y: pos.y - 24 });
    },
    [flow, addNode],
  );

  const openQuickAdd = useCallback(
    (clientX: number, clientY: number, from?: QuickAdd["from"]) => {
      const box = wrapperRef.current?.getBoundingClientRect();
      if (!box) return;
      const x = Math.min(clientX - box.left, box.width - 232);
      const y = Math.min(clientY - box.top, box.height - 250);
      setQuickAdd({ x, y, flow: flow.screenToFlowPosition({ x: clientX, y: clientY }), from });
    },
    [flow],
  );

  const onConnectEnd = useCallback(
    (event: MouseEvent | TouchEvent, state: FinalConnectionState) => {
      if (state.isValid || !state.fromNode || state.fromHandle?.type !== "source") return;
      const point = "changedTouches" in event ? event.changedTouches[0] : event;
      openQuickAdd(point.clientX, point.clientY, { source: state.fromNode.id, handle: state.fromHandle.id ?? "next" });
    },
    [openQuickAdd],
  );

  const pickQuickAdd = useCallback(
    (kind: StoryNodeKind) => {
      if (!quickAdd) return;
      addNode(kind, { x: quickAdd.flow.x, y: quickAdd.flow.y - 22 }, quickAdd.from);
      setQuickAdd(null);
    },
    [quickAdd, addNode],
  );

  const isValidConnection: IsValidConnection = useCallback(
    (c) => c.source !== c.target && flow.getNode(c.target)?.type !== "start",
    [flow],
  );

  const openPreview = useCallback((from?: string) => setPreview({ from, docked: false }), []);

  const closePreview = useCallback(() => {
    setPreview(null);
    if (liveId && flow.getNode(liveId)) focusNode(liveId);
  }, [liveId, flow, focusNode]);

  const publish = () => {
    if (errorCount) {
      select(null);
      toast.error(`Còn ${errorCount} lỗi cần sửa trước khi xuất bản`, { description: "Danh sách lỗi ở bảng bên phải." });
      return;
    }
    updateMeta({ status: "published" });
    toast.success("Đã xuất bản kịch bản (giả lập)", { description: "Khi nối backend, học sinh sẽ thấy kịch bản thay cho video." });
  };

  // Editor shortcuts.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing = !!target.closest("input, textarea, select, [contenteditable]");
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === "s") {
        e.preventDefault();
        const doc = toDoc();
        if (doc) storyRepo.save(doc);
        setSavedAt(new Date());
        toast.success("Đã lưu");
        return;
      }
      if (typing || (preview && !preview.docked)) return;
      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (mod && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
      } else if (mod && e.key.toLowerCase() === "d") {
        e.preventDefault();
        duplicate(selected.map((n) => n.id));
      } else if (!mod && !e.altKey && !preview && !quickAdd) {
        const kind = ADDABLE_KINDS.find((k) => KIND_META[k].shortcut === e.key);
        if (kind) addAtCenter(kind);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [preview, quickAdd, selected, toDoc, undo, redo, duplicate, addAtCenter]);

  if (status === "missing") {
    return (
      <div className="grid h-full place-items-center p-8 text-center">
        <div>
          <p className="text-[18px] font-bold">Không tìm thấy kịch bản</p>
          <Link href={ROUTES.STAFF.STORIES} className="mt-3 inline-block text-[14px] font-semibold text-[var(--accent-gold)] underline">
            Về danh sách kịch bản
          </Link>
        </div>
      </div>
    );
  }

  return (
    <EditorContext.Provider value={editorContext}>
      <div className="flex h-full min-h-0 flex-col">
        {/* Toolbar */}
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-[var(--border-strong)] bg-[var(--bg-surface)] px-3">
          <Link
            href={ROUTES.STAFF.STORIES}
            aria-label="Về danh sách"
            className="grid size-9 place-items-center rounded-sm text-[var(--text-secondary)] hover:bg-[var(--bg-deep)]"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <input
                value={meta?.title ?? ""}
                onChange={(e) => updateMeta({ title: e.target.value })}
                aria-label="Tên kịch bản"
                className="field-sizing-content min-w-[120px] max-w-[420px] truncate rounded-sm border border-transparent bg-transparent px-1.5 py-0.5 text-[15px] font-bold outline-none hover:border-[var(--border-strong)] focus:border-[var(--text-primary)] focus:bg-[var(--bg-elevated)]"
              />
              <span
                className={cn(
                  "shrink-0 rounded-sm px-1.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wider",
                  meta?.status === "published"
                    ? "bg-[var(--accent-teal)]/15 text-[var(--accent-teal)]"
                    : "bg-[var(--bg-deep)] text-[var(--text-tertiary)]",
                )}
              >
                {meta?.status === "published" ? "Đã xuất bản" : "Nháp"}
              </span>
            </div>
            <div className="flex items-center gap-3 px-1.5">
              <span className="truncate text-[12px] text-[var(--text-muted)]">{meta?.contextName}</span>
              <SaveStatus saving={saving} savedAt={savedAt} />
            </div>
          </div>

          <div className="flex items-center gap-0.5 border-r border-[var(--border-default)] pr-2">
            <ToolButton label="Hoàn tác (Ctrl Z)" onClick={undo} disabled={!canUndo}>
              <Undo2 className="size-4" />
            </ToolButton>
            <ToolButton label="Làm lại (Ctrl Y)" onClick={redo} disabled={!canRedo}>
              <Redo2 className="size-4" />
            </ToolButton>
            <ToolButton
              label="Tự sắp xếp"
              onClick={() => {
                layout();
                requestAnimationFrame(() => flow.fitView({ padding: 0.2, duration: 500, maxZoom: 1 }));
              }}
            >
              <Wand2 className="size-4" />
            </ToolButton>
          </div>

          <button
            type="button"
            onClick={() => select(null)}
            title="Xem danh sách lỗi"
            className={cn(
              "flex h-9 cursor-pointer items-center gap-1.5 rounded-sm px-2.5 text-[12.5px] font-semibold",
              errorCount ? "text-[var(--accent-gold)] hover:bg-[var(--accent-gold-active-bg)]" : "text-[var(--accent-teal)] hover:bg-[var(--bg-deep)]",
            )}
          >
            <CircleAlert className="size-4" />
            {errorCount ? `${errorCount} lỗi` : "Không lỗi"}
          </button>

          {canUseAi && (
            <button
              type="button"
              onClick={() => setAiOpen(true)}
              title="AI viết kịch bản, viết tiếp, thêm câu hỏi hoặc viết lại theo tài liệu của bối cảnh"
              className="flex h-9 cursor-pointer items-center gap-1.5 rounded-sm border border-[var(--border-strong)] px-3 text-[13px] font-semibold hover:border-[var(--text-primary)]"
            >
              <Sparkles className="size-4" /> AI soạn
            </button>
          )}
          <button
            type="button"
            onClick={() => openPreview()}
            className="flex h-9 cursor-pointer items-center gap-1.5 rounded-sm border border-[var(--text-primary)] px-3 text-[13px] font-semibold hover:bg-[var(--text-primary)] hover:text-[var(--text-inverse)]"
          >
            <Play className="size-4" /> Xem thử
          </button>
          <button
            type="button"
            onClick={publish}
            className="flex h-9 cursor-pointer items-center gap-1.5 rounded-sm bg-[var(--accent-gold)] px-3 text-[13px] font-semibold text-[var(--text-inverse)] hover:bg-[var(--accent-bronze)]"
          >
            <Rocket className="size-4" /> Xuất bản
          </button>
        </header>
        {canUseAi && <StoryAiDialog open={aiOpen} onOpenChange={setAiOpen} />}

        <div className="flex min-h-0 flex-1">
          <NodePalette onAdd={addAtCenter} />

          <div
            ref={wrapperRef}
            className="relative min-w-0 flex-1"
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
            }}
            onDrop={onDrop}
            onDoubleClick={(e: ReactMouseEvent) => {
              if ((e.target as HTMLElement).classList.contains("react-flow__pane")) openQuickAdd(e.clientX, e.clientY);
            }}
          >
            <ReactFlow<StoryFlowNode>
              className="story-flow"
              nodes={displayNodes}
              edges={edges}
              nodeTypes={storyNodeTypes}
              edgeTypes={edgeTypes}
              defaultEdgeOptions={defaultEdgeOptions}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={connect}
              onConnectEnd={onConnectEnd}
              isValidConnection={isValidConnection}
              onNodeDragStart={() => commit()}
              onPaneClick={() => setQuickAdd(null)}
              deleteKeyCode={["Delete", "Backspace"]}
              multiSelectionKeyCode={["Shift", "Meta", "Control"]}
              zoomOnDoubleClick={false}
              snapToGrid
              snapGrid={[8, 8]}
              minZoom={0.2}
              maxZoom={1.8}
              proOptions={{ hideAttribution: true }}
            >
              <Background variant={BackgroundVariant.Dots} gap={20} size={1.4} color="var(--story-canvas-dot)" />
              <Controls showInteractive={false} position="bottom-left" />
              <MiniMap
                pannable
                zoomable
                position="bottom-right"
                nodeBorderRadius={4}
                nodeColor={(n) => KIND_META[(n.type as StoryNodeKind) ?? "line"].color}
                style={{ width: 180, height: 120 }}
              />
              {nodes.length <= 3 && (
                <Panel position="top-center">
                  <div className="story-fade-in rounded-md border border-dashed border-[var(--border-strong)] bg-[var(--bg-elevated)]/90 px-4 py-2.5 text-center text-[12.5px] text-[var(--text-tertiary)] backdrop-blur">
                    Kéo các bước từ cột trái vào đây · Kéo từ <span className="font-semibold text-[var(--accent-gold)]">chấm tròn</span> ra chỗ trống để tạo bước nối tiếp · Nhấp đúp để thêm nhanh
                  </div>
                </Panel>
              )}
            </ReactFlow>

            {quickAdd && <QuickAddMenu menu={quickAdd} onPick={pickQuickAdd} onClose={() => setQuickAdd(null)} />}
          </div>

          <NodeInspector selected={selected} issues={issues} issuesByNode={issuesByNode} onFocus={focusNode} onPreview={openPreview} />
        </div>
      </div>

      {/*
        One player for both modes (same tree, only classes change) so switching
        between full screen and docked keeps the learner's progress.
        Docked: the canvas stays usable and the live step lights up on it.
      */}
      {preview && (
        <div
          className={cn(
            "fixed flex flex-col",
            preview.docked
              ? "story-fade-in bottom-[150px] right-[356px] z-[70] w-[440px] overflow-hidden rounded-md border border-[var(--border-strong)] bg-black shadow-2xl max-md:right-4"
              : "inset-0 z-[80] bg-[#0B0A09]/95 p-4 backdrop-blur-sm md:p-8",
          )}
        >
          <div className={cn("flex items-center gap-2 text-[#F5F2EA]", preview.docked ? "bg-[#14110F] px-2 py-1" : "mb-3")}>
            <p className={cn("min-w-0 truncate text-white/60", preview.docked ? "px-1 text-[11px] font-bold uppercase tracking-wider" : "text-[13px]")}>
              {preview.docked ? (
                "Xem thử"
              ) : (
                <>
                  Xem thử như học sinh · <kbd className="font-mono">Space</kbd> tiếp · <kbd className="font-mono">1–4</kbd> chọn ·{" "}
                  <kbd className="font-mono">H</kbd> hỏi nhân vật · <kbd className="font-mono">A</kbd> tự động ·{" "}
                  <kbd className="font-mono">L</kbd> nhật ký
                </>
              )}
            </p>
            <button
              type="button"
              onClick={() => setPreview({ ...preview, docked: !preview.docked })}
              title={preview.docked ? "Phóng to" : "Thu nhỏ để vừa xem vừa sửa, bước đang phát sẽ sáng lên trên khung vẽ"}
              className={cn(
                "ml-auto flex shrink-0 cursor-pointer items-center gap-1.5 rounded-sm",
                preview.docked ? "p-1 hover:bg-white/10" : "border border-white/25 px-3 py-1.5 text-[12.5px] font-semibold hover:border-white",
              )}
            >
              {preview.docked ? <Maximize2 className="size-3.5" /> : <Minimize2 className="size-3.5" />}
              {!preview.docked && "Vừa xem vừa sửa"}
            </button>
            {preview.docked && (
              <button type="button" aria-label="Đóng" title="Đóng" onClick={closePreview} className="cursor-pointer rounded-sm p-1 hover:bg-white/10">
                <X className="size-3.5" />
              </button>
            )}
          </div>
          <div className={preview.docked ? "aspect-video" : "min-h-0 flex-1"}>
            <ScaledStage>
              <StoryPlayer nodes={nodes} edges={edges} title={meta?.title ?? ""} startAt={preview.from} onClose={closePreview} onNodeChange={setLiveId} />
            </ScaledStage>
          </div>
        </div>
      )}
    </EditorContext.Provider>
  );
}

export function StoryEditor({ storyId }: { storyId: string }) {
  return (
    <ReactFlowProvider>
      <EditorInner storyId={storyId} />
    </ReactFlowProvider>
  );
}
