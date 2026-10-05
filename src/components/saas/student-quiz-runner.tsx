"use client";

import * as React from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock, RotateCcw, XCircle } from "lucide-react";
import type { LocalQuizQuestion } from "@/features/saas/types";
import { ConfirmDialog } from "@/components/commons/confirm-dialog";
import { ScoreChip, formatScore } from "@/components/saas/student-ui";
import { cn } from "@/lib/utils/cn";

/**
 * Takes a quiz inline, one question per step.
 * - "graded": single attempt with a countdown (auto-submits at 0); the parent stores answers + score.
 * - "practice": no timer, unlimited retries, nothing is stored.
 * Passing `result` renders the read-only result (correct answers + explanations).
 */

export interface QuizResultData {
  answers?: number[];
  score?: number;
}

const OPTION_KEYS = ["A", "B", "C", "D", "E", "F"];
const TEST = "var(--men-lam)";

export const scoreOf = (questions: LocalQuizQuestion[], answers: number[], maxScore: number) => {
  const correct = questions.filter((q, i) => answers[i] === q.correctIndex).length;
  return { correct, score: questions.length ? Math.round((correct / questions.length) * maxScore * 10) / 10 : 0 };
};

const formatClock = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};

interface RunState {
  startedAt: number;
  answers: number[];
}

function readRun(key: string | undefined): RunState | null {
  if (!key) return null;
  try {
    const raw = window.sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as RunState) : null;
  } catch {
    return null;
  }
}

function writeRun(key: string | undefined, run: RunState | null) {
  if (!key) return;
  try {
    if (run) window.sessionStorage.setItem(key, JSON.stringify(run));
    else window.sessionStorage.removeItem(key);
  } catch {
    // Storage blocked: the attempt simply is not restored after a reload.
  }
}

export function StudentQuizRunner({
  title,
  questions,
  mode,
  durationMinutes,
  maxScore = 10,
  result,
  storageKey,
  onStart,
  onSubmit,
}: {
  title: string;
  questions: LocalQuizQuestion[];
  mode: "graded" | "practice";
  durationMinutes?: number;
  maxScore?: number;
  /** Already submitted: show the result read-only. */
  result?: QuizResultData | null;
  /** sessionStorage key that keeps an in-progress graded attempt (timer + answers) across reloads. */
  storageKey?: string;
  onStart?: () => void;
  onSubmit?: (answers: number[], score: number) => void;
}) {
  const graded = mode === "graded";
  const [run, setRun] = React.useState<RunState | null>(() => (graded && typeof window !== "undefined" ? readRun(storageKey) : null));
  const [step, setStep] = React.useState(0);
  const [practiceResult, setPracticeResult] = React.useState<number[] | null>(null);
  const [now, setNow] = React.useState(() => Date.now());
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  const deadline = run && graded && durationMinutes ? run.startedAt + durationMinutes * 60_000 : null;
  const remaining = deadline ? deadline - now : null;

  const submit = React.useCallback(
    (answers: number[]) => {
      const { score } = scoreOf(questions, answers, maxScore);
      writeRun(storageKey, null);
      setRun(null);
      if (graded) onSubmit?.(answers, score);
      else setPracticeResult(answers);
    },
    [questions, maxScore, storageKey, graded, onSubmit],
  );

  const submitRef = React.useRef(submit);
  React.useEffect(() => {
    submitRef.current = submit;
  }, [submit]);

  React.useEffect(() => {
    if (!deadline) return;
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [deadline]);

  // Time is up: hand in whatever is answered.
  React.useEffect(() => {
    if (run && remaining !== null && remaining <= 0) submitRef.current(run.answers);
  }, [remaining, run]);

  function start() {
    const fresh: RunState = { startedAt: Date.now(), answers: Array(questions.length).fill(-1) };
    setNow(fresh.startedAt);
    setRun(fresh);
    setStep(0);
    setPracticeResult(null);
    writeRun(graded ? storageKey : undefined, fresh);
    onStart?.();
  }

  function choose(qIndex: number, option: number) {
    setRun((r) => {
      if (!r) return r;
      const answers = r.answers.slice();
      answers[qIndex] = option;
      const next = { ...r, answers };
      writeRun(graded ? storageKey : undefined, next);
      return next;
    });
  }

  // ── Result ──
  const shownResult: QuizResultData | null = result ?? (practiceResult ? { answers: practiceResult, score: scoreOf(questions, practiceResult, maxScore).score } : null);
  if (shownResult) {
    return (
      <QuizResult
        questions={questions}
        result={shownResult}
        maxScore={maxScore}
        onRetry={graded ? undefined : start}
      />
    );
  }

  // ── Intro ──
  if (!run) {
    return (
      <div className="space-y-4 rounded-[2px] border border-[var(--text-primary)] bg-[var(--bg-surface)] p-4 sm:p-6">
        <div className="space-y-1">
          <p className="archive-title is-plain text-2xl">{title}</p>
          <p className="text-[13px] text-content-muted">
            {questions.length} câu hỏi
            {graded && durationMinutes ? ` · ${durationMinutes} phút` : ""}
            {graded ? ` · Thang điểm ${maxScore}` : " · Luyện tập, không tính điểm"}
          </p>
        </div>
        {graded && (
          <ul className="list-disc space-y-1 pl-5 text-[13px] text-content-text">
            <li>Chỉ được làm một lần. Bài tự nộp khi hết giờ.</li>
            <li>Đáp án và giải thích hiện sau khi nộp bài.</li>
          </ul>
        )}
        <button type="button" className="btn-crimson" onClick={start} disabled={questions.length === 0}>
          {graded ? "Bắt đầu làm bài" : "Bắt đầu luyện tập"}
        </button>
      </div>
    );
  }

  // ── Running ──
  const q = questions[step];
  const answered = run.answers.filter((a) => a >= 0).length;
  const last = step === questions.length - 1;
  const lowTime = remaining !== null && remaining < 60_000;

  return (
    <div className="space-y-4 rounded-[2px] border border-[var(--text-primary)] bg-[var(--bg-surface)] p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-default)] pb-3">
        <span className="text-[13px] font-bold text-content-muted">
          Câu {step + 1} / {questions.length} · Đã trả lời {answered}
        </span>
        {remaining !== null && (
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-[2px] border px-2.5 py-1 font-display text-lg font-extrabold tabular-nums",
              lowTime ? "border-[var(--accent-danger)] text-[var(--accent-danger)]" : "border-[var(--border-strong)] text-[var(--men-lam)]",
            )}
            role="timer"
            aria-label={`Thời gian còn lại ${formatClock(remaining)}`}
          >
            <Clock className="h-4 w-4" aria-hidden="true" />
            {formatClock(remaining)}
          </span>
        )}
      </div>

      <nav className="flex flex-wrap gap-1.5" aria-label="Chọn câu hỏi">
        {questions.map((item, i) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setStep(i)}
            aria-label={`Câu ${i + 1}${run.answers[i] >= 0 ? ", đã trả lời" : ""}`}
            aria-current={i === step ? "step" : undefined}
            className={cn(
              "grid h-8 w-8 place-items-center rounded-[2px] border text-[12px] font-bold tabular-nums",
              i === step
                ? "border-[var(--men-lam)] bg-[var(--men-lam)] text-white"
                : run.answers[i] >= 0
                  ? "border-[var(--men-lam)] text-[var(--men-lam)]"
                  : "border-[var(--border-strong)] text-content-muted",
            )}
          >
            {i + 1}
          </button>
        ))}
      </nav>

      <fieldset className="space-y-3">
        <legend className="mb-3 text-[16px] font-semibold leading-snug text-content-text">{q.prompt}</legend>
        <div role="radiogroup" aria-label={q.prompt} className="grid gap-2">
          {q.options.map((opt, oi) => {
            const selected = run.answers[step] === oi;
            return (
              <button
                key={oi}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => choose(step, oi)}
                className={cn(
                  "flex items-center gap-3 rounded-[2px] border px-3 py-2.5 text-left text-[14px] motion-safe:transition-colors",
                  selected
                    ? "border-[var(--men-lam)] bg-[color-mix(in_srgb,var(--men-lam)_10%,transparent)] text-content-text"
                    : "border-[var(--border-strong)] text-content-text hover:border-[var(--text-primary)]",
                )}
              >
                <span
                  className={cn(
                    "grid h-7 w-7 shrink-0 place-items-center rounded-[2px] border text-[12px] font-bold",
                    selected ? "border-[var(--men-lam)] bg-[var(--men-lam)] text-white" : "border-[var(--border-strong)] text-content-muted",
                  )}
                  aria-hidden="true"
                >
                  {OPTION_KEYS[oi] ?? oi + 1}
                </span>
                {opt}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border-default)] pt-4">
        <button type="button" className="btn-line disabled:opacity-40" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Câu trước
        </button>
        {last ? (
          <button
            type="button"
            className="btn-crimson"
            onClick={() => (answered < questions.length ? setConfirmOpen(true) : submit(run.answers))}
          >
            {graded ? "Nộp bài" : "Xem kết quả"}
          </button>
        ) : (
          <button type="button" className="btn-ink" onClick={() => setStep((s) => s + 1)}>
            Câu tiếp <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Nộp bài khi chưa trả lời hết?"
        description={`Còn ${questions.length - answered} câu chưa trả lời. Câu bỏ trống được tính là sai.`}
        confirmLabel={graded ? "Nộp bài" : "Xem kết quả"}
        cancelLabel="Làm tiếp"
        variant="warning"
        onConfirm={() => {
          setConfirmOpen(false);
          submit(run.answers);
        }}
      />
    </div>
  );
}

function QuizResult({
  questions,
  result,
  maxScore,
  onRetry,
}: {
  questions: LocalQuizQuestion[];
  result: QuizResultData;
  maxScore: number;
  onRetry?: () => void;
}) {
  const answers = result.answers;
  const correct = answers ? questions.filter((q, i) => answers[i] === q.correctIndex).length : null;
  const score = result.score ?? (answers ? scoreOf(questions, answers, maxScore).score : null);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-x-8 gap-y-4 rounded-[2px] border border-[var(--text-primary)] bg-[color-mix(in_srgb,var(--gold-leaf)_9%,var(--bg-surface))] p-4 sm:p-6">
        <div>
          <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-content-muted">Điểm của em</p>
          {score !== null ? <ScoreChip score={score} max={maxScore} size="lg" /> : <p className="text-2xl font-bold">—</p>}
        </div>
        {correct !== null && (
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-content-muted">Câu đúng</p>
            <p className="font-display text-4xl font-extrabold tabular-nums" style={{ color: TEST }}>
              {correct}
              <span className="text-base text-content-muted"> / {questions.length}</span>
            </p>
          </div>
        )}
        {onRetry && (
          <button type="button" className="btn-line ml-auto" onClick={onRetry}>
            <RotateCcw className="h-4 w-4" aria-hidden="true" /> Làm lại
          </button>
        )}
      </div>

      {!answers && (
        <p className="text-[13px] text-content-muted">
          Không có chi tiết bài làm cho lần nộp này{score !== null ? ` (điểm ${formatScore(score)})` : ""}. Dưới đây là đáp án đúng để em ôn lại.
        </p>
      )}

      <ol className="space-y-3">
        {questions.map((q, i) => {
          const chosen = answers?.[i] ?? -1;
          const ok = chosen === q.correctIndex;
          return (
            <li key={q.id} className="space-y-2 rounded-[2px] border border-[var(--border-strong)] bg-[var(--bg-surface)] p-4">
              <p className="flex items-start gap-2 text-[14px] font-semibold text-content-text">
                {answers ? (
                  ok ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--jade)]" aria-label="Đúng" />
                  ) : (
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent-danger)]" aria-label="Sai" />
                  )
                ) : null}
                <span>
                  {i + 1}. {q.prompt}
                </span>
              </p>
              <ul className="grid gap-1.5">
                {q.options.map((opt, oi) => {
                  const isCorrect = oi === q.correctIndex;
                  const isChosen = oi === chosen;
                  return (
                    <li
                      key={oi}
                      className={cn(
                        "flex items-center gap-2 rounded-[2px] border px-3 py-1.5 text-[13px]",
                        isCorrect
                          ? "border-[var(--jade)] bg-[color-mix(in_srgb,var(--jade)_10%,transparent)] font-semibold text-content-text"
                          : isChosen
                            ? "border-[var(--accent-danger)] bg-[var(--status-danger-bg)] text-content-text"
                            : "border-[var(--border-default)] text-content-muted",
                      )}
                    >
                      <span className="w-4 shrink-0 font-bold">{OPTION_KEYS[oi] ?? oi + 1}</span>
                      <span className="flex-1">{opt}</span>
                      {isCorrect && <span className="text-[11px] font-bold text-[var(--jade)]">Đáp án đúng</span>}
                      {isChosen && !isCorrect && <span className="text-[11px] font-bold text-[var(--accent-danger)]">Em chọn</span>}
                    </li>
                  );
                })}
              </ul>
              {answers && chosen < 0 && <p className="text-[12px] font-semibold text-[var(--accent-danger)]">Chưa trả lời</p>}
              {q.explanation && <p className="text-[13px] text-content-muted">Giải thích: {q.explanation}</p>}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
