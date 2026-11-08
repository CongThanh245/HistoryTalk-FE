"use client";

import { Loader2, MessageCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { isValidUrl } from "@/lib/utils/url";
import type { ChatScenario } from "@/services/chat.service";

const yearLabel = (year?: number | null) => (year == null ? null : year < 0 ? `${-year} TCN` : String(year));

/**
 * Roleplay assignments name only the character: the learner picks which of its contexts to chat in
 * (GET /chat/scenarios), so the session starts on a pair the backend accepts.
 */
export function AssignmentScenarioPicker({
  open,
  characterName,
  scenarios,
  loading,
  busy,
  onPick,
  onOpenChange,
}: {
  open: boolean;
  characterName: string;
  /** Scenarios of the assigned character only. */
  scenarios: ChatScenario[];
  loading: boolean;
  /** The assignment is being started. */
  busy: boolean;
  onPick: (scenario: ChatScenario) => void;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Chọn bối cảnh để trò chuyện với {characterName}</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed text-content-text">
            {characterName} sẽ nhập vai đúng thời điểm của bối cảnh bạn chọn. Tin nhắn ở bối cảnh nào cũng được tính cho bài
            tập.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <p className="flex items-center gap-2 py-6 text-sm text-content-muted">
            <Loader2 className="h-4 w-4 animate-spin text-[var(--accent-gold)]" aria-hidden="true" /> Đang tải các bối cảnh...
          </p>
        ) : (
          <ul className="grid max-h-[60vh] gap-3 overflow-y-auto sm:grid-cols-2">
            {scenarios.map((s) => (
              <li key={s.scenarioId}>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onPick(s)}
                  className="group flex h-full w-full flex-col overflow-hidden rounded-sm border border-[var(--border-strong)] bg-[var(--bg-surface)] text-left transition-colors hover:border-[var(--accent-gold)] disabled:cursor-wait disabled:opacity-60"
                >
                  <span className="relative block aspect-[16/7] w-full bg-[var(--bg-main)]">
                    {isValidUrl(s.contextImage) && (
                      // eslint-disable-next-line @next/next/no-img-element -- context images come from several storage hosts
                      <img src={s.contextImage!} alt="" className="absolute inset-0 h-full w-full object-cover" />
                    )}
                  </span>
                  <span className="flex flex-1 flex-col gap-1 p-3">
                    <span className="text-sm font-bold text-content-heading">{s.contextName}</span>
                    {yearLabel(s.contextYear) && <span className="text-xs text-content-muted">{yearLabel(s.contextYear)}</span>}
                    {s.contextSummary && <span className="line-clamp-3 text-xs leading-relaxed text-content-text">{s.contextSummary}</span>}
                    <span className="mt-auto inline-flex items-center gap-1.5 pt-2 text-xs font-semibold text-[var(--accent-gold)]">
                      <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" /> Trò chuyện trong bối cảnh này
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
