"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils/cn";
import { getApiErrorMessage } from "@/lib/utils/api-error";
import { AI_STAGE_LABELS, aiAuthoringService, waitForJob, type AiJob } from "@/services/ai-authoring.service";
import { characterService } from "@/services/character.service";
import { eventService } from "@/services/event.service";
import { useStoryEditor } from "@/features/story/editor-store";
import { draftToStory, insertSteps, nodeToStep, stepsLeadingTo, type AiStoryDraft } from "@/features/story/ai-draft";
import { MOCK_BACKGROUNDS, registerCharacters } from "@/features/story/mock-data";
import type { StoryCharacter } from "@/features/story/types";

type Mode = "full" | "continue" | "quiz" | "rewrite";
type Option = { id: string; name: string };

const MODES: { id: Mode; label: string; hint: string }[] = [
  { id: "full", label: "Tạo cả kịch bản", hint: "Viết mới toàn bộ, thay cho kịch bản hiện tại." },
  { id: "continue", label: "Viết tiếp từ bước đang chọn", hint: "Thêm vài lời thoại nối tiếp, rồi quay lại mạch cũ." },
  { id: "quiz", label: "Thêm câu hỏi sau bước đang chọn", hint: "Một câu hỏi về điều vừa được kể." },
  { id: "rewrite", label: "Viết lại lời thoại đang chọn", hint: "Giữ ý, đổi cách nói theo yêu cầu." },
];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const backgrounds = MOCK_BACKGROUNDS.map((b) => ({ id: b.id, name: b.name }));

/**
 * AI drafting for the story editor. The AI writes from the documents of a real historical context, so the story
 * is tied to one (the sample contexts have no documents). Its characters join the editor's character list.
 */
export function StoryAiDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const meta = useStoryEditor((s) => s.meta);
  const nodes = useStoryEditor((s) => s.nodes);
  const selected = nodes.find((n) => n.selected) ?? null;
  const kind = selected?.data.kind;

  const available = useMemo<Record<Mode, boolean>>(() => ({
    full: true,
    continue: kind === "start" || kind === "line" || kind === "quiz",
    quiz: kind === "start" || kind === "line" || kind === "quiz",
    rewrite: kind === "line",
  }), [kind]);

  const [mode, setMode] = useState<Mode>("full");
  const [contexts, setContexts] = useState<Option[]>([]);
  const [contextId, setContextId] = useState("");
  const [characters, setCharacters] = useState<StoryCharacter[]>([]);
  const [narratorId, setNarratorId] = useState("");
  const [minutes, setMinutes] = useState(3);
  const [choiceCount, setChoiceCount] = useState(1);
  const [quizCount, setQuizCount] = useState(1);
  const [notes, setNotes] = useState("");
  const [instruction, setInstruction] = useState("ngắn hơn, đúng giọng nhân vật");
  const [busy, setBusy] = useState(false);
  const [job, setJob] = useState<AiJob<AiStoryDraft> | null>(null);
  const [error, setError] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const jobIdRef = useRef<string | null>(null);

  // Opening picks the best mode for the selection and the story's own context when it is a real one.
  useEffect(() => {
    if (!open) return;
    setError("");
    setMode(kind === "line" || kind === "quiz" || kind === "start" ? "continue" : "full");
    if (meta && UUID.test(meta.contextId)) setContextId(meta.contextId);
    eventService.getAllClient({ page: 1, limit: 200 })
      .then((res) => setContexts(res.content.map((c) => ({ id: c.id, name: c.title }))))
      .catch(() => setError("Không tải được danh sách bối cảnh."));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per opening
  }, [open]);

  useEffect(() => {
    if (!contextId) return;
    characterService.getByContext(contextId)
      .then((list) => {
        const mapped = list.map((c) => ({ id: c.id, name: c.name, title: c.title ?? "", portraitUrl: c.imageUrl ?? null, accent: "#7A5C2E" }));
        setCharacters(mapped);
        setNarratorId((current) => (mapped.some((c) => c.id === current) ? current
          : mapped.find((c) => c.id === meta?.narratorId)?.id ?? mapped[0]?.id ?? ""));
      })
      .catch(() => setCharacters([]));
  }, [contextId, meta?.narratorId]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const close = (next: boolean) => {
    if (!next && jobIdRef.current) {
      abortRef.current?.abort();
      void aiAuthoringService.cancelJob(jobIdRef.current).catch(() => {});
      jobIdRef.current = null;
    }
    onOpenChange(next);
  };

  const contextName = contexts.find((c) => c.id === contextId)?.name ?? meta?.contextName ?? "";
  const base = { contextId, narratorId: narratorId || null, backgrounds };

  const finish = (draft: AiStoryDraft, applied: string) => {
    registerCharacters(characters);
    if (draft.warnings.length) toast.warning(`${applied}, còn ${draft.warnings.length} lỗi cần xem lại.`, { description: draft.warnings.slice(0, 3).join(" · ") });
    else toast.success(`${applied}. Ctrl Z để hoàn tác.`);
    onOpenChange(false);
  };

  const run = async () => {
    if (!contextId) { setError("Chọn bối cảnh có tài liệu để AI viết theo."); return; }
    setBusy(true);
    setError("");
    setJob(null);
    const editor = useStoryEditor.getState();
    try {
      if (mode === "full") {
        if (editor.nodes.length > 1 && !window.confirm("Thay toàn bộ kịch bản hiện tại bằng bản AI viết? Có thể hoàn tác bằng Ctrl Z.")) return;
        const controller = new AbortController();
        abortRef.current = controller;
        const jobId = await aiAuthoringService.startStory({
          ...base, options: { targetMinutes: minutes, choiceCount, quizCount, notes: notes.trim() || undefined },
        });
        jobIdRef.current = jobId;
        const done = await waitForJob<AiStoryDraft>(jobId, setJob, controller.signal);
        jobIdRef.current = null;
        if (done.status !== "succeeded" || !done.result) { setError(done.error ?? "Không tạo được kịch bản."); return; }
        const story = draftToStory(done.result);
        editor.commit();
        useStoryEditor.setState({ nodes: story.nodes, edges: story.edges, revision: useStoryEditor.getState().revision + 1 });
        editor.updateMeta({ contextId, contextName, narratorId: narratorId || null, ...(done.result.title && { title: done.result.title }) });
        finish(done.result, "Đã tạo kịch bản");
        return;
      }

      if (!selected) return;
      if (mode === "rewrite") {
        const draft = await aiAuthoringService.generateStoryPart({ ...base, mode, step: nodeToStep(selected), instruction });
        const step = draft.steps[0];
        if (step?.type !== "line") { setError("AI không trả về lời thoại."); return; }
        editor.updateData(selected.id, { text: step.text, expression: step.expression });
        finish(draft, "Đã viết lại lời thoại");
        return;
      }

      const previousSteps = stepsLeadingTo(editor.nodes, editor.edges, selected.id);
      const draft = await aiAuthoringService.generateStoryPart({
        ...base, mode, previousSteps: previousSteps.length ? previousSteps : [{ id: "intro", type: "line", speaker: "narrator", text: contextName }],
        ...(mode === "continue" && { count: 4 }),
      });
      // A quiz continues through "correct"; anything else through "next".
      const handle = kind === "quiz" ? "correct" : "next";
      const next = insertSteps(editor.nodes, editor.edges, draft.steps, draft.startId, selected.id, handle);
      editor.commit();
      useStoryEditor.setState({ nodes: next.nodes, edges: next.edges, revision: useStoryEditor.getState().revision + 1 });
      finish(draft, mode === "quiz" ? "Đã thêm câu hỏi" : `Đã viết tiếp ${draft.steps.length} bước`);
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      setError((e as { response?: { status?: number } }).response?.status === 404 && mode === "full"
        ? "Phiên tạo đã hết hạn. Vui lòng tạo lại."
        : getApiErrorMessage(e, "AI chưa viết được. Vui lòng thử lại."));
    } finally {
      setBusy(false);
    }
  };

  const select = "h-9 w-full rounded-sm border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-2 text-[13px]";

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5" aria-hidden="true" /> AI soạn kịch bản</DialogTitle>
          <DialogDescription className="text-sm text-content-text">
            AI chỉ viết theo tài liệu của bối cảnh. Bản AI viết là bản nháp: hãy đọc lại trước khi xuất bản.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-[13px]">
          <div className="grid gap-1.5">
            {MODES.map((m) => (
              <label key={m.id} className={cn("flex cursor-pointer items-start gap-2 rounded-sm border px-3 py-2",
                mode === m.id ? "border-[var(--text-primary)]" : "border-[var(--border-default)]",
                !available[m.id] && "cursor-not-allowed opacity-50")}>
                <input type="radio" name="story-ai-mode" checked={mode === m.id} disabled={!available[m.id] || busy} onChange={() => setMode(m.id)} className="mt-1" />
                <span><strong className="block">{m.label}</strong><span className="text-[12px] text-[var(--text-muted)]">{m.hint}</span></span>
              </label>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1 font-semibold">Bối cảnh
              <select value={contextId} onChange={(e) => setContextId(e.target.value)} className={select} disabled={busy}>
                <option value="">Chọn bối cảnh…</option>
                {contexts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <label className="grid gap-1 font-semibold">Nhân vật kể
              <select value={narratorId} onChange={(e) => setNarratorId(e.target.value)} className={select} disabled={busy || !characters.length}>
                <option value="">Người dẫn truyện</option>
                {characters.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
          </div>

          {mode === "full" && (
            <div className="grid grid-cols-3 gap-3">
              <label className="grid gap-1 font-semibold">Thời lượng
                <select value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} className={select} disabled={busy}>
                  {[2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n} phút</option>)}
                </select>
              </label>
              <label className="grid gap-1 font-semibold">Lựa chọn
                <select value={choiceCount} onChange={(e) => setChoiceCount(Number(e.target.value))} className={select} disabled={busy}>
                  {[0, 1, 2, 3].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </label>
              <label className="grid gap-1 font-semibold">Câu hỏi
                <select value={quizCount} onChange={(e) => setQuizCount(Number(e.target.value))} className={select} disabled={busy}>
                  {[0, 1, 2, 3].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </label>
              <label className="col-span-3 grid gap-1 font-semibold">Ghi chú cho AI
                <textarea value={notes} maxLength={500} rows={2} onChange={(e) => setNotes(e.target.value)} disabled={busy}
                  placeholder="Ví dụ: Nhấn mạnh vai trò của thuỷ triều" className="rounded-sm border border-[var(--border-strong)] bg-transparent p-2 font-normal" />
              </label>
            </div>
          )}
          {mode === "rewrite" && (
            <label className="grid gap-1 font-semibold">Yêu cầu
              <input value={instruction} maxLength={300} onChange={(e) => setInstruction(e.target.value)} className={select} disabled={busy} />
            </label>
          )}

          {busy && mode === "full" && (
            <div role="status" className="space-y-1.5">
              <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> {job ? AI_STAGE_LABELS[job.stage] : "Đang gửi yêu cầu"}… (thường khoảng 30 giây)</span>
              <div className="h-1.5 bg-[var(--border-default)]"><div className="h-full bg-[var(--text-primary)] transition-all" style={{ width: `${job?.progress ?? 5}%` }} /></div>
            </div>
          )}
          {error && <p role="alert" className="text-[var(--accent-danger)]">{error}</p>}
        </div>

        <DialogFooter>
          <button type="button" className="btn-line" onClick={() => close(false)}>{busy ? "Huỷ" : "Đóng"}</button>
          <button type="button" className="btn-ink" disabled={busy || !available[mode]} onClick={() => void run()}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} {busy ? "AI đang viết…" : "Viết"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
