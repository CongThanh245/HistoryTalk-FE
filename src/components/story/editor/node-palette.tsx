"use client";

import type { DragEvent } from "react";
import { ADDABLE_KINDS, KIND_META } from "@/features/story/story-meta";
import type { StoryNodeKind } from "@/features/story/types";

export const DRAG_MIME = "application/x-story-node";

const TIPS: [string, string][] = [
  ["Kéo", "chấm tròn bên phải sang bước khác để nối"],
  ["Thả", "dây nối ra chỗ trống để tạo bước mới"],
  ["Ctrl Z / Ctrl Y", "hoàn tác / làm lại"],
  ["Ctrl D", "nhân bản bước đang chọn"],
  ["Delete", "xóa bước hoặc dây nối"],
  ["Space + kéo", "di chuyển khung vẽ"],
];

export function NodePalette({ onAdd }: { onAdd: (kind: StoryNodeKind) => void }) {
  const onDragStart = (e: DragEvent, kind: StoryNodeKind) => {
    e.dataTransfer.setData(DRAG_MIME, kind);
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <aside className="hidden w-[232px] shrink-0 flex-col border-r border-[var(--border-strong)] bg-[var(--bg-surface)] lg:flex">
      <div className="border-b border-[var(--border-default)] px-4 py-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">Thêm bước</p>
        <p className="mt-0.5 text-[12px] text-[var(--text-muted)]">Kéo vào khung vẽ hoặc bấm để thêm</p>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {ADDABLE_KINDS.map((kind) => {
          const meta = KIND_META[kind];
          const Icon = meta.icon;
          return (
            <button
              key={kind}
              type="button"
              draggable
              onDragStart={(e) => onDragStart(e, kind)}
              onClick={() => onAdd(kind)}
              className="group flex w-full cursor-grab items-start gap-2.5 rounded-md border border-[var(--border-strong)] bg-[var(--bg-elevated)] p-2.5 text-left transition-all hover:-translate-y-px hover:border-[var(--text-primary)] hover:shadow-[0_6px_14px_-10px_rgba(0,0,0,0.5)] active:cursor-grabbing"
            >
              <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-sm text-white" style={{ background: meta.color }}>
                <Icon className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 text-[13px] font-semibold text-[var(--text-primary)]">
                  {meta.label}
                  {meta.shortcut && (
                    <kbd className="ml-auto rounded-[3px] border border-[var(--border-strong)] px-1 font-mono text-[10px] font-normal text-[var(--text-muted)]">
                      {meta.shortcut}
                    </kbd>
                  )}
                </span>
                <span className="mt-0.5 block text-[11.5px] leading-snug text-[var(--text-tertiary)]">{meta.hint}</span>
              </span>
            </button>
          );
        })}
      </div>
      <div className="border-t border-[var(--border-default)] p-4">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">Thao tác nhanh</p>
        <ul className="space-y-1.5 text-[11.5px] leading-snug text-[var(--text-tertiary)]">
          {TIPS.map(([key, text]) => (
            <li key={key}>
              <span className="font-semibold text-[var(--text-secondary)]">{key}</span> {text}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
