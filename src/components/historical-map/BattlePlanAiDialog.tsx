"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Loader2, MapPin, Sparkles, X } from "lucide-react";
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
import type { BattleMap } from "./battle-map.types";
import { compileBattlePlan, type AnchorPositions, type BattlePlan } from "./battle-plan";

type Step = "options" | "running" | "anchors";

const PHASE_COUNTS = [3, 4, 5, 6, 7, 8];

/**
 * "Tạo bằng AI": the AI plans sides, landmarks and phases from the context's documents; the author places each
 * landmark on the map (the AI can suggest where), and the symbols are drawn from those positions. The result is
 * added to the map as one undoable step.
 */
export function BattlePlanAiDialog({ open, onOpenChange, contextId, map, onApply }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contextId: string;
  map: BattleMap;
  onApply: (map: BattleMap, skipped: number) => void;
}) {
  const [step, setStep] = useState<Step>("options");
  const [phaseCount, setPhaseCount] = useState(5);
  const [notes, setNotes] = useState("");
  const [job, setJob] = useState<AiJob<BattlePlan> | null>(null);
  const [plan, setPlan] = useState<BattlePlan | null>(null);
  const [positions, setPositions] = useState<AnchorPositions>({});
  const [activeAnchor, setActiveAnchor] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const jobIdRef = useRef<string | null>(null);

  // Closing the dialog stops polling and cancels the job, so nothing keeps running on the AI server.
  useEffect(() => () => abortRef.current?.abort(), []);

  const cancelRunning = () => {
    abortRef.current?.abort();
    if (jobIdRef.current) void aiAuthoringService.cancelJob(jobIdRef.current).catch(() => {});
    jobIdRef.current = null;
  };

  const close = (next: boolean) => {
    if (!next) cancelRunning();
    onOpenChange(next);
  };

  const startPlan = async () => {
    setError("");
    setStep("running");
    setJob(null);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const jobId = await aiAuthoringService.startBattlePlan({
        contextId,
        options: { phaseCount, notes: notes.trim() || undefined },
        existingFactions: map.factions.map(f => ({ id: f.id, name: f.name, color: f.color })),
      });
      jobIdRef.current = jobId;
      const done = await waitForJob<BattlePlan>(jobId, setJob, controller.signal);
      jobIdRef.current = null;
      if (done.status !== "succeeded" || !done.result) {
        setError(done.error ?? "Không tạo được kế hoạch lược đồ.");
        setStep("options");
        return;
      }
      setPlan(done.result);
      setPositions({});
      setActiveAnchor(done.result.anchors[0]?.id ?? null);
      setStep("anchors");
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      setError((e as { response?: { status?: number } }).response?.status === 404
        ? "Phiên tạo đã hết hạn. Vui lòng tạo lại."
        : getApiErrorMessage(e, "Không tạo được kế hoạch lược đồ."));
      setStep("options");
    }
  };

  const locate = async () => {
    if (!plan || !map.imageUrl) return;
    setLocating(true);
    setError("");
    try {
      const found = await aiAuthoringService.locateAnchors(map.imageUrl, plan.anchors.map(a => ({ id: a.id, name: a.name, hint: a.hint })));
      const suggested = Object.fromEntries(found.filter(a => a.found && a.x !== undefined && a.y !== undefined).map(a => [a.id, { x: a.x!, y: a.y! }]));
      // Positions the author already set win over the suggestion.
      setPositions(p => ({ ...suggested, ...p }));
      const missing = found.filter(a => !a.found).length;
      if (missing) setError(`AI chưa tìm được ${missing} điểm mốc, hãy tự bấm lên ảnh để đặt.`);
    } catch (e) {
      setError(getApiErrorMessage(e, "Chưa đoán được vị trí. Hãy tự đặt các điểm mốc."));
    } finally {
      setLocating(false);
    }
  };

  const placeAt = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!plan || !activeAnchor) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.round(((event.clientX - rect.left) / rect.width) * 1000) / 10;
    const y = Math.round(((event.clientY - rect.top) / rect.height) * 1000) / 10;
    setPositions(p => ({ ...p, [activeAnchor]: { x, y } }));
    // Move on to the next landmark that still has no place.
    const next = plan.anchors.find(a => a.id !== activeAnchor && !positions[a.id]);
    setActiveAnchor(next?.id ?? activeAnchor);
  };

  const apply = () => {
    if (!plan) return;
    const { map: next, skipped } = compileBattlePlan(plan, positions, map);
    onApply(next, skipped);
    onOpenChange(false);
    setStep("options");
    setPlan(null);
  };

  const placed = plan ? plan.anchors.filter(a => positions[a.id]).length : 0;
  const symbolCount = plan?.phases.reduce((n, p) => n + p.symbols.length, 0) ?? 0;

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className={cn(step === "anchors" ? "sm:max-w-5xl" : "sm:max-w-md")}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 shrink-0" aria-hidden="true" /> Tạo lược đồ bằng AI
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed text-content-text">
            {step === "anchors"
              ? "Đặt từng điểm mốc lên ảnh: chọn điểm mốc ở danh sách rồi bấm vào vị trí trên ảnh. Ký hiệu sẽ được vẽ từ các điểm này."
              : "AI đọc tài liệu của trận đánh để lập các phe, điểm mốc và diễn biến từng giai đoạn. Bạn chỉ cần đặt điểm mốc lên ảnh."}
          </DialogDescription>
        </DialogHeader>

        {step === "options" && (
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-content-heading">
              Số giai đoạn
              <span className="mt-2 flex flex-wrap gap-2">
                {PHASE_COUNTS.map(n => (
                  <button key={n} type="button" onClick={() => setPhaseCount(n)} aria-pressed={phaseCount === n}
                    className={cn("h-9 w-9 border text-sm cursor-pointer", phaseCount === n
                      ? "border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--text-inverse)]"
                      : "border-[var(--border-strong)] text-content-text")}>
                    {n}
                  </button>
                ))}
              </span>
            </label>
            <label className="block text-sm font-semibold text-content-heading">
              Ghi chú cho AI (không bắt buộc)
              <textarea value={notes} maxLength={500} rows={3} onChange={e => setNotes(e.target.value)}
                placeholder="Ví dụ: Nhấn mạnh việc nhử địch vào lúc triều lên"
                className="mt-2 w-full border border-[var(--border-strong)] bg-transparent p-2 text-sm font-normal" />
            </label>
            {!map.imageUrl && <p className="text-xs text-content-muted">Chưa có ảnh nền: vẫn tạo được kế hoạch, nhưng cần ảnh để đặt điểm mốc.</p>}
          </div>
        )}

        {step === "running" && (
          <div className="space-y-3 py-2" role="status">
            <div className="flex items-center gap-2 text-sm text-content-text">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              {job ? AI_STAGE_LABELS[job.stage] : "Đang gửi yêu cầu"}…
            </div>
            <div className="h-1.5 w-full bg-[var(--border-default)]">
              <div className="h-full bg-[var(--text-primary)] transition-all" style={{ width: `${job?.progress ?? 5}%` }} />
            </div>
            <p className="text-xs text-content-muted">Thường mất khoảng 30 giây.</p>
          </div>
        )}

        {step === "anchors" && plan && (
          <div className="grid gap-4 md:grid-cols-[260px_1fr]">
            <div className="space-y-3">
              <p className="text-xs text-content-muted">
                {plan.factions.length} phe · {plan.phases.length} giai đoạn · {symbolCount} ký hiệu · đã đặt {placed}/{plan.anchors.length} điểm mốc
              </p>
              <ul className="space-y-1.5">
                {plan.anchors.map(a => (
                  <li key={a.id}>
                    <button type="button" onClick={() => setActiveAnchor(a.id)} aria-pressed={activeAnchor === a.id}
                      className={cn("w-full border px-2.5 py-2 text-left text-sm cursor-pointer", activeAnchor === a.id
                        ? "border-[var(--text-primary)] bg-[var(--status-neutral-bg)]" : "border-[var(--border-default)]")}>
                      <span className="flex items-center gap-1.5 font-semibold text-content-heading">
                        {positions[a.id] ? <Check className="h-3.5 w-3.5 text-[var(--status-success)]" aria-label="Đã đặt" /> : <MapPin className="h-3.5 w-3.5" aria-hidden="true" />}
                        {a.name}
                        {positions[a.id] && (
                          <X className="ml-auto h-3.5 w-3.5 opacity-60 hover:opacity-100" aria-label={`Bỏ vị trí ${a.name}`}
                            onClick={e => { e.stopPropagation(); setPositions(p => { const rest = { ...p }; delete rest[a.id]; return rest; }); }} />
                        )}
                      </span>
                      {a.hint && <span className="mt-0.5 block text-xs text-content-muted">{a.hint}</span>}
                    </button>
                  </li>
                ))}
              </ul>
              {map.imageUrl && (
                <button type="button" onClick={() => void locate()} disabled={locating} className="btn-line w-full justify-center">
                  {locating ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Sparkles className="h-4 w-4" aria-hidden="true" />}
                  {locating ? "AI đang tìm trên ảnh…" : "AI đoán vị trí"}
                </button>
              )}
              {plan.warnings.length > 0 && (
                <details className="text-xs text-content-muted">
                  <summary className="cursor-pointer">{plan.warnings.length} lưu ý từ AI</summary>
                  <ul className="mt-1 list-disc pl-4">{plan.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
                </details>
              )}
            </div>

            {map.imageUrl ? (
              <div className="relative cursor-crosshair select-none self-start border border-[var(--border-default)]" onClick={placeAt}>
                {/* eslint-disable-next-line @next/next/no-img-element -- any URL or data: URL the author picked */}
                <img src={map.imageUrl} alt="Ảnh nền lược đồ" className="block w-full" draggable={false} />
                {plan.anchors.filter(a => positions[a.id]).map(a => (
                  <span key={a.id} style={{ left: `${positions[a.id].x}%`, top: `${positions[a.id].y}%` }}
                    className={cn("pointer-events-none absolute -translate-x-1/2 -translate-y-full whitespace-nowrap px-1.5 py-0.5 text-[11px] font-semibold",
                      a.id === activeAnchor ? "bg-[var(--text-primary)] text-[var(--text-inverse)]" : "bg-white/90 text-black")}>
                    <MapPin className="inline h-3 w-3" aria-hidden="true" /> {a.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="self-center text-sm text-content-muted">Thêm ảnh nền ở thẻ “Ảnh nền” rồi tạo lại để đặt điểm mốc.</p>
            )}
          </div>
        )}

        {error && <p className="text-sm text-[var(--accent-danger)]" role="alert">{error}</p>}

        <DialogFooter>
          {step === "options" && (
            <button type="button" className="btn-ink" onClick={() => void startPlan()}>
              <Sparkles className="h-4 w-4" aria-hidden="true" /> Lập kế hoạch
            </button>
          )}
          {step === "running" && (
            <button type="button" className="btn-line" onClick={() => { cancelRunning(); setStep("options"); }}>Huỷ</button>
          )}
          {step === "anchors" && (
            <>
              <button type="button" className="btn-line" onClick={() => setStep("options")}>Tạo lại</button>
              <button type="button" className="btn-ink" disabled={placed === 0} onClick={apply}>
                Đưa vào bản đồ
              </button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
