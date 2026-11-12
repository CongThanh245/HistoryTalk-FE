"use client";

import { memo, type ReactNode } from "react";
import { Handle, Position, type NodeProps, type NodeTypes } from "@xyflow/react";
import { AlertTriangle, Check, CircleAlert, Unlock, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { outputHandles, type OutputHandle } from "@/features/story/graph-utils";
import { findBackground, findCharacter } from "@/features/story/mock-data";
import { EXPRESSIONS, KIND_META, NARRATOR_LABEL } from "@/features/story/story-meta";
import type { StoryFlowNode, StoryNodeData } from "@/features/story/types";
import { useEditorContext } from "./editor-context";
import { CharacterAvatar } from "../character-avatar";

type Props = NodeProps<StoryFlowNode>;

function IssueBadge({ id }: { id: string }) {
  const issues = useEditorContext().issuesByNode.get(id) ?? [];
  if (!issues.length) return null;
  const hasError = issues.some((i) => i.level === "error");
  const Icon = hasError ? CircleAlert : AlertTriangle;
  return (
    <span
      title={issues.map((i) => `• ${i.message}`).join("\n")}
      className={cn(
        "ml-auto inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold",
        hasError
          ? "bg-[var(--accent-gold)] text-[var(--text-inverse)]"
          : "bg-[var(--accent-brass-soft)] text-[var(--accent-brass)]",
      )}
    >
      <Icon className="size-3" />
      {issues.length}
    </span>
  );
}

function Shell({ id, data, selected, children, wide }: { id: string; data: StoryNodeData; selected: boolean; children: ReactNode; wide?: boolean }) {
  const meta = KIND_META[data.kind];
  const Icon = meta.icon;
  return (
    <div
      className={cn(
        "relative rounded-md border bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-[0_1px_0_rgba(0,0,0,0.04),0_6px_18px_-10px_rgba(0,0,0,0.35)] transition-[box-shadow,border-color] duration-150",
        wide ? "w-[280px]" : "w-[260px]",
        selected ? "border-[var(--accent-gold)] ring-2 ring-[var(--accent-gold)]/35" : "border-[var(--border-strong)] hover:border-[var(--text-tertiary)]",
      )}
      style={{ borderTopColor: meta.color, borderTopWidth: 3 }}
    >
      {data.kind !== "start" && (
        <Handle type="target" id="in" position={Position.Left} style={{ top: 22 }} />
      )}
      <div className="flex items-center gap-2 px-3 pt-2.5 pb-1.5">
        <span
          className="grid size-5 shrink-0 place-items-center rounded-sm text-white"
          style={{ background: meta.color }}
        >
          <Icon className="size-3" strokeWidth={2.5} />
        </span>
        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-tertiary)]">{meta.label}</span>
        <IssueBadge id={id} />
      </div>
      <div className="px-3 pb-3 text-[12.5px] leading-snug">{children}</div>
    </div>
  );
}

/** A labelled output row whose handle sits on the node's right edge. */
function OutputRow({ nodeId, handle, children }: { nodeId: string; handle: OutputHandle; children?: ReactNode }) {
  const connected = useEditorContext().connectedHandles.has(`${nodeId}:${handle.id}`);
  return (
    <div
      className={cn(
        "relative -mx-3 flex items-center gap-2 border-t border-[var(--border-default)] px-3 py-1.5 text-[12px]",
        handle.tone === "good" && "text-[var(--accent-teal)]",
        handle.tone === "bad" && "text-[var(--accent-gold)]",
      )}
    >
      {children ?? <span className="truncate font-medium">{handle.label}</span>}
      {!connected && (
        <span className="ml-auto shrink-0 text-[10px] italic text-[var(--text-muted)]">chưa nối</span>
      )}
      <Handle
        type="source"
        id={handle.id}
        position={Position.Right}
        style={{ top: "50%" }}
        className={connected ? undefined : "story-handle-open"}
      />
    </div>
  );
}

function SingleOutput({ nodeId }: { nodeId: string }) {
  const connected = useEditorContext().connectedHandles.has(`${nodeId}:next`);
  return (
    <Handle
      type="source"
      id="next"
      position={Position.Right}
      style={{ top: 22 }}
      className={connected ? undefined : "story-handle-open"}
      title={connected ? undefined : "Chưa nối: kéo từ đây sang bước tiếp theo, hoặc thả ra chỗ trống để tạo mới"}
    />
  );
}

function Speaker({ speakerId, expression }: { speakerId: string | null; expression?: string }) {
  const character = findCharacter(speakerId);
  const emoji = EXPRESSIONS.find((e) => e.id === expression)?.emoji;
  return (
    <div className="mb-1.5 flex items-center gap-1.5">
      <CharacterAvatar character={character} size={20} />
      <span className={cn("truncate text-[12px] font-semibold", !character && "italic text-[var(--text-tertiary)]")}>
        {character?.name ?? NARRATOR_LABEL}
      </span>
      {emoji && expression !== "neutral" && <span className="text-[12px]" title={expression}>{emoji}</span>}
    </div>
  );
}

function Text({ value, empty, lines = 3 }: { value: string; empty: string; lines?: 2 | 3 }) {
  return value.trim() ? (
    <p className={cn("whitespace-pre-line text-[var(--text-secondary)]", lines === 2 ? "line-clamp-2" : "line-clamp-3")}>{value}</p>
  ) : (
    <p className="italic text-[var(--accent-gold)]/80">{empty}</p>
  );
}

const StartNode = memo(function StartNode({ id, data, selected }: Props) {
  if (data.kind !== "start") return null;
  return (
    <div
      className={cn(
        "relative flex w-[180px] items-center gap-2 rounded-full border-2 bg-[var(--bg-elevated)] px-4 py-2.5",
        selected ? "border-[var(--accent-gold)]" : "border-[var(--story-start)]",
      )}
    >
      <span className="grid size-6 place-items-center rounded-full bg-[var(--story-start)] text-white">
        <KIND_META.start.icon className="size-3.5" />
      </span>
      <span className="text-[13px] font-bold">Bắt đầu</span>
      <IssueBadge id={id} />
      <Handle type="source" id="next" position={Position.Right} />
    </div>
  );
});

const LineNode = memo(function LineNode({ id, data, selected }: Props) {
  if (data.kind !== "line") return null;
  const bg = data.background ? findBackground(data.background) : null;
  return (
    <Shell id={id} data={data} selected={selected}>
      <SingleOutput nodeId={id} />
      <Speaker speakerId={data.speakerId} expression={data.expression} />
      <Text value={data.text} empty="Chưa có lời thoại" />
      {bg && (
        <div className="mt-2 flex items-center gap-1.5 text-[10.5px] text-[var(--text-tertiary)]">
          <span className="h-3 w-5 rounded-[2px] border border-[var(--border-default)]" style={{ background: bg.css }} />
          Cảnh: {bg.name}
        </div>
      )}
    </Shell>
  );
});

const ChoiceNode = memo(function ChoiceNode({ id, data, selected }: Props) {
  if (data.kind !== "choice") return null;
  return (
    <Shell id={id} data={data} selected={selected} wide>
      <Speaker speakerId={data.speakerId} />
      <div className="mb-2">
        <Text value={data.prompt} empty="Chưa có câu dẫn" lines={2} />
      </div>
      {outputHandles(data).map((h, i) => (
        <OutputRow key={h.id} nodeId={id} handle={h}>
          <span className="grid size-4 shrink-0 place-items-center rounded-sm bg-[var(--story-choice)] text-[9px] font-bold text-white">
            {i + 1}
          </span>
          <span className="truncate font-medium">{h.label}</span>
        </OutputRow>
      ))}
    </Shell>
  );
});

const QuizNode = memo(function QuizNode({ id, data, selected }: Props) {
  if (data.kind !== "quiz") return null;
  return (
    <Shell id={id} data={data} selected={selected} wide>
      <Speaker speakerId={data.speakerId} />
      <div className="mb-1.5">
        <Text value={data.question} empty="Chưa có câu hỏi" lines={2} />
      </div>
      <ul className="mb-2 space-y-0.5">
        {data.answers.map((a, i) => (
          <li key={a.id} className="flex items-center gap-1.5 text-[11.5px] text-[var(--text-tertiary)]">
            {a.id === data.correctId ? (
              <Check className="size-3 shrink-0 text-[var(--accent-teal)]" strokeWidth={3} />
            ) : (
              <span className="w-3 shrink-0 text-center text-[10px]">{String.fromCharCode(65 + i)}</span>
            )}
            <span className={cn("truncate", a.id === data.correctId && "font-semibold text-[var(--text-primary)]")}>
              {a.label || <em className="text-[var(--accent-gold)]/80">(trống)</em>}
            </span>
          </li>
        ))}
      </ul>
      {outputHandles(data).map((h) => (
        <OutputRow key={h.id} nodeId={id} handle={h}>
          {h.tone === "good" ? <Check className="size-3.5" strokeWidth={3} /> : <X className="size-3.5" strokeWidth={3} />}
          <span className="font-semibold">{h.label}</span>
        </OutputRow>
      ))}
    </Shell>
  );
});

const EndNode = memo(function EndNode({ id, data, selected }: Props) {
  if (data.kind !== "end") return null;
  return (
    <Shell id={id} data={data} selected={selected}>
      <p className="mb-1 font-display text-[15px] font-bold leading-tight">{data.title || "Kết thúc"}</p>
      <Text value={data.summary} empty="Chưa có lời tổng kết" lines={2} />
      <div className="mt-2 flex flex-wrap gap-1 text-[10.5px] font-semibold">
        <span className="rounded-sm bg-[var(--accent-brass-soft)] px-1.5 py-0.5 text-[var(--accent-brass)]">+{data.xp} XP</span>
        {data.unlockCharacters && (
          <span className="inline-flex items-center gap-1 rounded-sm bg-[var(--bg-deep)] px-1.5 py-0.5 text-[var(--text-tertiary)]">
            <Unlock className="size-3" /> Mở trò chuyện
          </span>
        )}
      </div>
    </Shell>
  );
});

export const storyNodeTypes: NodeTypes = {
  start: StartNode,
  line: LineNode,
  choice: ChoiceNode,
  quiz: QuizNode,
  end: EndNode,
};
