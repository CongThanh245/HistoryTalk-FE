"use client";

import { useState, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Check,
  CircleAlert,
  Copy,
  Crosshair,
  Play,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils/cn";
import { useStoryEditor } from "@/features/story/editor-store";
import { option, storyStats } from "@/features/story/graph-utils";
import { MOCK_BACKGROUNDS, MOCK_CONTEXTS, storyCharacters } from "@/features/story/mock-data";
import { EXPRESSIONS, KIND_META, NARRATOR_LABEL } from "@/features/story/story-meta";
import type { StoryFlowNode, StoryIssue, StoryNodeData, StoryOption } from "@/features/story/types";
import { CharacterAvatar } from "../character-avatar";

// ── Small building blocks ─────────────────────────────────

function Field({ label, hint, count, max, children }: { label: string; hint?: string; count?: number; max?: number; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <label className="text-[12px] font-semibold text-[var(--text-secondary)]">{label}</label>
        {count !== undefined && (
          <span className={cn("text-[11px] tabular-nums text-[var(--text-muted)]", max && count > max && "font-semibold text-[var(--accent-gold)]")}>
            {count}
            {max ? `/${max}` : ""}
          </span>
        )}
      </div>
      {children}
      {hint && <p className="text-[11px] leading-snug text-[var(--text-muted)]">{hint}</p>}
    </div>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">{children}</p>;
}

function IconButton({ label, onClick, children, danger, disabled }: { label: string; onClick: () => void; children: ReactNode; danger?: boolean; disabled?: boolean }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "grid size-8 shrink-0 cursor-pointer place-items-center rounded-sm border border-transparent text-[var(--text-tertiary)] transition-colors hover:border-[var(--border-strong)] hover:bg-[var(--bg-deep)] hover:text-[var(--text-primary)] disabled:pointer-events-none disabled:opacity-35",
        danger && "hover:border-[var(--accent-gold)] hover:bg-[var(--accent-gold-active-bg)] hover:text-[var(--accent-gold)]",
      )}
    >
      {children}
    </button>
  );
}

function IssueList({ issues, onFocus }: { issues: StoryIssue[]; onFocus?: (id: string) => void }) {
  if (!issues.length) return null;
  return (
    <ul className="space-y-1.5">
      {issues.map((issue, i) => {
        const error = issue.level === "error";
        const Icon = error ? CircleAlert : AlertTriangle;
        const body = (
          <>
            <Icon className={cn("mt-0.5 size-3.5 shrink-0", error ? "text-[var(--accent-gold)]" : "text-[var(--accent-brass)]")} />
            <span className="flex-1">{issue.message}</span>
            {onFocus && issue.nodeId && <Crosshair className="mt-0.5 size-3 shrink-0 opacity-0 group-hover:opacity-60" />}
          </>
        );
        const cls = cn(
          "group flex w-full items-start gap-2 rounded-sm border px-2.5 py-2 text-left text-[12px] leading-snug",
          error
            ? "border-[var(--accent-gold)]/30 bg-[var(--accent-gold-active-bg)] text-[var(--text-secondary)]"
            : "border-[var(--accent-brass)]/30 bg-[var(--accent-brass-soft)] text-[var(--text-secondary)]",
        );
        return (
          <li key={`${issue.nodeId}-${i}`}>
            {onFocus && issue.nodeId ? (
              <button type="button" className={cn(cls, "cursor-pointer hover:border-[var(--text-primary)]")} onClick={() => onFocus(issue.nodeId)}>
                {body}
              </button>
            ) : (
              <div className={cls}>{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function SpeakerPicker({ value, onChange }: { value: string | null; onChange: (id: string | null) => void }) {
  const characters = storyCharacters();
  const choices = [{ id: null, name: NARRATOR_LABEL }, ...characters];
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {choices.map((c) => {
        const active = value === c.id;
        const character = c.id ? characters.find((m) => m.id === c.id)! : null;
        return (
          <button
            key={c.id ?? "narrator"}
            type="button"
            onClick={() => onChange(c.id)}
            className={cn(
              "flex cursor-pointer items-center gap-2 rounded-sm border px-2 py-1.5 text-left text-[12px] transition-colors",
              active
                ? "border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--text-inverse)]"
                : "border-[var(--border-strong)] bg-[var(--bg-elevated)] hover:border-[var(--text-primary)]",
            )}
          >
            <CharacterAvatar character={character} size={22} />
            <span className="truncate font-medium">{c.name}</span>
          </button>
        );
      })}
    </div>
  );
}

function OptionsEditor({
  items,
  onChange,
  correctId,
  onCorrect,
  min = 2,
  max = 4,
  placeholder,
}: {
  items: StoryOption[];
  onChange: (items: StoryOption[]) => void;
  correctId?: string | null;
  onCorrect?: (id: string) => void;
  min?: number;
  max?: number;
  placeholder: (i: number) => string;
}) {
  const [focusId, setFocusId] = useState<string | null>(null);
  const update = (id: string, label: string) => onChange(items.map((o) => (o.id === id ? { ...o, label } : o)));
  const move = (i: number, d: -1 | 1) => {
    const next = [...items];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    onChange(next);
  };
  const add = () => {
    const o = option("");
    setFocusId(o.id);
    onChange([...items, o]);
  };

  return (
    <div className="space-y-1.5">
      {items.map((o, i) => (
        <div key={o.id} className="group flex items-center gap-1">
          {onCorrect ? (
            <button
              type="button"
              title="Đánh dấu là đáp án đúng"
              onClick={() => onCorrect(o.id)}
              className={cn(
                "grid size-7 shrink-0 cursor-pointer place-items-center rounded-full border-2 transition-colors",
                correctId === o.id
                  ? "border-[var(--accent-teal)] bg-[var(--accent-teal)] text-white"
                  : "border-[var(--border-strong)] text-transparent hover:border-[var(--accent-teal)] hover:text-[var(--accent-teal)]",
              )}
            >
              <Check className="size-3.5" strokeWidth={3} />
            </button>
          ) : (
            <span className="grid size-7 shrink-0 place-items-center rounded-sm bg-[var(--story-choice)] text-[11px] font-bold text-white">{i + 1}</span>
          )}
          <Input
            value={o.label}
            autoFocus={focusId === o.id}
            placeholder={placeholder(i)}
            onChange={(e) => update(o.id, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && items.length < max) {
                e.preventDefault();
                add();
              }
            }}
            className="h-8 text-[13px]"
          />
          <div className="flex opacity-40 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
            <IconButton label="Lên" onClick={() => move(i, -1)} disabled={i === 0}>
              <ArrowUp className="size-3.5" />
            </IconButton>
            <IconButton label="Xuống" onClick={() => move(i, 1)} disabled={i === items.length - 1}>
              <ArrowDown className="size-3.5" />
            </IconButton>
            <IconButton label="Xóa" danger onClick={() => onChange(items.filter((x) => x.id !== o.id))} disabled={items.length <= min}>
              <X className="size-3.5" />
            </IconButton>
          </div>
        </div>
      ))}
      {items.length < max && (
        <button
          type="button"
          onClick={add}
          className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-sm border border-dashed border-[var(--border-strong)] py-1.5 text-[12px] font-medium text-[var(--text-tertiary)] transition-colors hover:border-[var(--text-primary)] hover:text-[var(--text-primary)]"
        >
          <Plus className="size-3.5" /> Thêm ({items.length}/{max})
        </button>
      )}
    </div>
  );
}

// ── Per-kind forms ────────────────────────────────────────

function NodeForm({ node }: { node: StoryFlowNode }) {
  const updateData = useStoryEditor((s) => s.updateData);
  const d = node.data;
  const set = (patch: Partial<StoryNodeData>, key?: string) => updateData(node.id, patch, key);

  switch (d.kind) {
    case "start":
      return (
        <Field label="Ghi chú cho người soạn" hint="Không hiển thị với học sinh.">
          <Textarea value={d.note} onChange={(e) => set({ note: e.target.value }, "note")} placeholder="Ví dụ: phát khi học sinh mở bối cảnh" />
        </Field>
      );

    case "line":
      return (
        <>
          <Field label="Người nói">
            <SpeakerPicker value={d.speakerId} onChange={(speakerId) => set({ speakerId })} />
          </Field>
          <Field label="Lời thoại" count={d.text.length} max={220} hint="Mỗi bước nên là 1–2 câu ngắn để học sinh dễ theo dõi.">
            <Textarea
              value={d.text}
              autoFocus={!d.text}
              rows={5}
              onChange={(e) => set({ text: e.target.value }, "text")}
              placeholder={d.speakerId ? "Nhân vật nói gì?" : "Người dẫn truyện kể gì?"}
              className="min-h-28 text-[14px] leading-relaxed"
            />
          </Field>
          {d.speakerId && (
            <Field label="Biểu cảm">
              <div className="grid grid-cols-3 gap-1.5">
                {EXPRESSIONS.map((ex) => (
                  <button
                    key={ex.id}
                    type="button"
                    onClick={() => set({ expression: ex.id })}
                    className={cn(
                      "flex cursor-pointer items-center justify-center gap-1 rounded-sm border px-1.5 py-1.5 text-[11.5px] transition-colors",
                      d.expression === ex.id
                        ? "border-[var(--text-primary)] bg-[var(--text-primary)] font-semibold text-[var(--text-inverse)]"
                        : "border-[var(--border-strong)] hover:border-[var(--text-primary)]",
                    )}
                  >
                    <span>{ex.emoji}</span>
                    {ex.label}
                  </button>
                ))}
              </div>
            </Field>
          )}
          <Field label="Cảnh nền" hint="Để trống thì giữ cảnh của bước trước.">
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => set({ background: null })}
                className={cn(
                  "grid aspect-video cursor-pointer place-items-center rounded-sm border-2 border-dashed text-center text-[10.5px] leading-tight text-[var(--text-tertiary)]",
                  d.background === null ? "border-[var(--accent-gold)] text-[var(--text-primary)]" : "border-[var(--border-strong)] hover:border-[var(--text-primary)]",
                )}
              >
                Giữ cảnh trước
              </button>
              {MOCK_BACKGROUNDS.map((bg) => (
                <button
                  key={bg.id}
                  type="button"
                  title={bg.name}
                  onClick={() => set({ background: bg.id })}
                  className={cn(
                    "relative aspect-video cursor-pointer overflow-hidden rounded-sm border-2 transition-transform hover:scale-[1.03]",
                    d.background === bg.id ? "border-[var(--accent-gold)]" : "border-transparent",
                  )}
                  style={{ background: bg.css }}
                >
                  <span className="absolute inset-x-0 bottom-0 truncate bg-black/55 px-1 py-px text-[9.5px] text-white">{bg.name}</span>
                </button>
              ))}
            </div>
          </Field>
        </>
      );

    case "choice":
      return (
        <>
          <Field label="Người hỏi">
            <SpeakerPicker value={d.speakerId} onChange={(speakerId) => set({ speakerId })} />
          </Field>
          <Field label="Câu dẫn" hint="Hiện phía trên các lựa chọn.">
            <Textarea value={d.prompt} onChange={(e) => set({ prompt: e.target.value }, "prompt")} placeholder="Ngươi muốn nghe điều gì trước?" />
          </Field>
          <Field label="Các lựa chọn" hint="Mỗi lựa chọn là một nhánh, nối nó tới bước tiếp theo trên khung vẽ. Enter để thêm nhanh.">
            <OptionsEditor items={d.options} onChange={(options) => set({ options }, "options")} placeholder={(i) => `Lựa chọn ${i + 1}`} />
          </Field>
        </>
      );

    case "quiz":
      return (
        <>
          <Field label="Người hỏi">
            <SpeakerPicker value={d.speakerId} onChange={(speakerId) => set({ speakerId })} />
          </Field>
          <Field label="Câu hỏi">
            <Textarea value={d.question} onChange={(e) => set({ question: e.target.value }, "question")} placeholder="Ví dụ: Ngô Quyền dựa vào yếu tố tự nhiên nào?" />
          </Field>
          <Field label="Đáp án" hint="Bấm vòng tròn để chọn đáp án đúng.">
            <OptionsEditor
              items={d.answers}
              correctId={d.correctId}
              onCorrect={(correctId) => set({ correctId })}
              onChange={(answers) =>
                set({ answers, correctId: answers.some((a) => a.id === d.correctId) ? d.correctId : (answers[0]?.id ?? null) }, "answers")
              }
              placeholder={(i) => `Đáp án ${String.fromCharCode(65 + i)}`}
            />
          </Field>
          <Field label="Giải thích" hint="Hiện ngay sau khi học sinh trả lời, đúng hay sai đều thấy.">
            <Textarea value={d.explanation} onChange={(e) => set({ explanation: e.target.value }, "explanation")} placeholder="Vì sao đáp án này đúng?" />
          </Field>
        </>
      );

    case "end":
      return (
        <>
          <Field label="Tiêu đề">
            <Input value={d.title} onChange={(e) => set({ title: e.target.value }, "title")} />
          </Field>
          <Field label="Tổng kết" hint="Ý chính học sinh cần nhớ sau câu chuyện.">
            <Textarea value={d.summary} onChange={(e) => set({ summary: e.target.value }, "summary")} rows={4} />
          </Field>
          <Field label="Điểm kinh nghiệm">
            <div className="flex gap-1.5">
              {[10, 30, 50, 100].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => set({ xp: n })}
                  className={cn(
                    "h-8 flex-1 cursor-pointer rounded-sm border text-[13px] font-semibold",
                    d.xp === n ? "border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--text-inverse)]" : "border-[var(--border-strong)] hover:border-[var(--text-primary)]",
                  )}
                >
                  +{n}
                </button>
              ))}
            </div>
          </Field>
          <label className="flex cursor-pointer items-start justify-between gap-3 rounded-sm border border-[var(--border-strong)] p-3">
            <span>
              <span className="block text-[13px] font-semibold">Mở trò chuyện với nhân vật</span>
              <span className="block text-[11.5px] text-[var(--text-muted)]">Như khi xem xong video giới thiệu hiện nay.</span>
            </span>
            <Switch checked={d.unlockCharacters} onCheckedChange={(unlockCharacters) => set({ unlockCharacters })} />
          </label>
        </>
      );
  }
}

// ── Panels ────────────────────────────────────────────────

function StorySettings({ issues, onFocus }: { issues: StoryIssue[]; onFocus: (id: string) => void }) {
  const meta = useStoryEditor((s) => s.meta);
  const nodes = useStoryEditor((s) => s.nodes);
  const updateMeta = useStoryEditor((s) => s.updateMeta);
  if (!meta) return null;
  const stats = storyStats(nodes);
  const errors = issues.filter((i) => i.level === "error").length;

  return (
    <div className="space-y-5 p-4">
      <div className="space-y-3">
        <SectionTitle>Kịch bản</SectionTitle>
        <Field label="Tên kịch bản">
          <Input value={meta.title} onChange={(e) => updateMeta({ title: e.target.value })} />
        </Field>
        <Field label="Gắn với bối cảnh">
          <select
            value={meta.contextId}
            onChange={(e) => {
              const ctx = MOCK_CONTEXTS.find((c) => c.id === e.target.value);
              if (ctx) updateMeta({ contextId: ctx.id, contextName: ctx.name });
            }}
            className="h-9 w-full cursor-pointer rounded-sm border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-2 text-[13px] text-[var(--text-primary)] outline-none hover:border-[var(--text-primary)]"
          >
            {[...MOCK_CONTEXTS, ...(MOCK_CONTEXTS.some((c) => c.id === meta.contextId) ? [] : [{ id: meta.contextId, name: meta.contextName }])].map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Nhân vật kể chính" hint="Bước mới sẽ mặc định do nhân vật này nói.">
          <SpeakerPicker value={meta.narratorId} onChange={(narratorId) => updateMeta({ narratorId })} />
        </Field>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          [String(stats.lines), "lời thoại"],
          [String(stats.interactions), "tương tác"],
          stats.seconds < 60 ? [`${stats.seconds}s`, "ước tính"] : [`~${Math.round(stats.seconds / 60)}`, "phút"],
        ].map(([value, label]) => (
          <div key={label} className="rounded-sm border border-[var(--border-default)] bg-[var(--bg-elevated)] px-2 py-2.5 text-center">
            <p className="font-display text-[20px] font-bold leading-none">{value}</p>
            <p className="mt-1 text-[10.5px] uppercase tracking-wider text-[var(--text-muted)]">{label}</p>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <SectionTitle>Kiểm tra</SectionTitle>
          <span className={cn("text-[11.5px] font-semibold", errors ? "text-[var(--accent-gold)]" : "text-[var(--accent-teal)]")}>
            {issues.length === 0 ? "Sẵn sàng xuất bản" : `${errors} lỗi · ${issues.length - errors} lưu ý`}
          </span>
        </div>
        {issues.length === 0 ? (
          <div className="flex items-center gap-2 rounded-sm border border-[var(--accent-teal)]/30 bg-[var(--accent-teal)]/10 px-3 py-2.5 text-[12.5px]">
            <Check className="size-4 text-[var(--accent-teal)]" /> Mọi nhánh đều đi tới kết thúc.
          </div>
        ) : (
          <IssueList issues={issues} onFocus={onFocus} />
        )}
      </div>
    </div>
  );
}

export function NodeInspector({
  selected,
  issues,
  issuesByNode,
  onFocus,
  onPreview,
}: {
  selected: StoryFlowNode[];
  issues: StoryIssue[];
  issuesByNode: Map<string, StoryIssue[]>;
  onFocus: (id: string) => void;
  onPreview: (fromId?: string) => void;
}) {
  const duplicate = useStoryEditor((s) => s.duplicate);
  const remove = useStoryEditor((s) => s.remove);

  let body: ReactNode;
  let header: ReactNode;

  if (selected.length === 0) {
    header = <SectionTitle>Thiết lập chung</SectionTitle>;
    body = <StorySettings issues={issues} onFocus={onFocus} />;
  } else if (selected.length > 1) {
    const ids = selected.map((n) => n.id);
    header = <SectionTitle>Đã chọn {selected.length} bước</SectionTitle>;
    body = (
      <div className="space-y-2 p-4">
        <p className="text-[12.5px] text-[var(--text-tertiary)]">Kéo để di chuyển cả nhóm, hoặc:</p>
        <button type="button" onClick={() => duplicate(ids)} className="flex w-full cursor-pointer items-center gap-2 rounded-sm border border-[var(--border-strong)] px-3 py-2 text-[13px] hover:border-[var(--text-primary)]">
          <Copy className="size-4" /> Nhân bản
        </button>
        <button type="button" onClick={() => remove(ids)} className="flex w-full cursor-pointer items-center gap-2 rounded-sm border border-[var(--border-strong)] px-3 py-2 text-[13px] text-[var(--accent-gold)] hover:border-[var(--accent-gold)]">
          <Trash2 className="size-4" /> Xóa các bước đã chọn
        </button>
      </div>
    );
  } else {
    const node = selected[0];
    const meta = KIND_META[node.data.kind];
    const Icon = meta.icon;
    const isStart = node.data.kind === "start";
    header = (
      <>
        <span className="grid size-6 place-items-center rounded-sm text-white" style={{ background: meta.color }}>
          <Icon className="size-3.5" />
        </span>
        <span className="text-[13px] font-bold">{meta.label}</span>
        <div className="ml-auto flex">
          <IconButton label="Xem thử từ bước này" onClick={() => onPreview(isStart ? undefined : node.id)}>
            <Play className="size-4" />
          </IconButton>
          {!isStart && (
            <>
              <IconButton label="Nhân bản (Ctrl D)" onClick={() => duplicate([node.id])}>
                <Copy className="size-4" />
              </IconButton>
              <IconButton label="Xóa (Delete)" danger onClick={() => remove([node.id])}>
                <Trash2 className="size-4" />
              </IconButton>
            </>
          )}
        </div>
      </>
    );
    body = (
      <div key={node.id} className="space-y-4 p-4">
        <IssueList issues={issuesByNode.get(node.id) ?? []} />
        <NodeForm node={node} />
      </div>
    );
  }

  return (
    <aside className="flex w-[340px] shrink-0 flex-col border-l border-[var(--border-strong)] bg-[var(--bg-surface)] max-md:hidden">
      <div className="flex h-12 shrink-0 items-center gap-2 border-b border-[var(--border-default)] px-4">{header}</div>
      <div className="min-h-0 flex-1 overflow-y-auto">{body}</div>
    </aside>
  );
}
