"use client";

import * as React from "react";
import {
  ArrowUp, ArrowDown, Pencil, Trash2,
  Plus, Upload, CheckCircle2, ClipboardList,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { newId } from "./staff-utils";
import {
  QUESTION_TYPE_LABELS,
  type QuestionType,
} from "@/features/quiz/question-data";
import type { CreateQuestionPayload, StaffQuizQuestion } from "@/services/staff.quiz.service";
import {
  parseJsonQuestions, parseCsvQuestions, parsePlainTextQuestions,
  type ImportedQuestion,
} from "./quiz-import-parser";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MatchingDraftPair {
  left: string;
  right: string;
}

/**
 * Draft cau hoi trong editor. Moi loai dung nhom field rieng; khi luu se
 * quy doi sang `questionType` + `questionData` theo contract BE (xem toQuestionPayload).
 */
export interface QuizQuestion {
  questionId: string;
  orderIndex: number;
  content: string;
  questionType: QuestionType;
  // MULTIPLE_CHOICE
  options: [string, string, string, string];
  correctAnswer: 0 | 1 | 2 | 3;
  // FILL_IN_BLANK
  acceptedAnswers: string[];
  caseSensitive: boolean;
  // MATCHING
  matchingPairs: MatchingDraftPair[];
  explanation?: string;
}

interface QuizQuestionEditorProps {
  questions: QuizQuestion[];
  onChange: (qs: QuizQuestion[]) => void;
  onImportError?: (msg: string) => void;
  onImportSuccess?: (count: number) => void;
  /** Bao cho trang cha biet dang co form cau hoi mo (chua luu) de chan nut luu bo de. */
  onEditingChange?: (editing: boolean) => void;
}

const LABELS = ["A", "B", "C", "D"] as const;
const QUESTION_TYPES: QuestionType[] = ["MULTIPLE_CHOICE", "FILL_IN_BLANK", "MATCHING"];
export const QUESTION_TYPE_HINTS: Record<QuestionType, string> = {
  MULTIPLE_CHOICE: "4 phương án, chọn 1 đáp án đúng",
  FILL_IN_BLANK: "Người học gõ câu trả lời",
  MATCHING: "Nối vế trái với vế phải",
};
const EMPTY_TYPE_FIELDS = {
  questionType: "MULTIPLE_CHOICE" as QuestionType,
  options: ["", "", "", ""] as [string, string, string, string],
  correctAnswer: 0 as const,
  acceptedAnswers: [""],
  caseSensitive: false,
  matchingPairs: [{ left: "", right: "" }, { left: "", right: "" }],
};
const makeEmpty = (): QuizQuestion => ({
  questionId: newId(), orderIndex: 0, content: "", explanation: "",
  ...EMPTY_TYPE_FIELDS,
});
const reindex = (qs: QuizQuestion[]) => qs.map((q, i) => ({ ...q, orderIndex: i + 1 }));

function toQuizQuestion(q: ImportedQuestion): QuizQuestion {
  return {
    ...makeEmpty(), orderIndex: q.orderIndex, content: q.content,
    options: q.options, correctAnswer: q.correctAnswer, explanation: q.explanation,
  };
}

// ─── Contract conversion ──────────────────────────────────────────────────────

/** Draft editor → payload POST/PUT cau hoi (questionType + questionData). */
export function toQuestionPayload(q: QuizQuestion): CreateQuestionPayload {
  const base = { content: q.content.trim(), explanation: q.explanation?.trim() || undefined };
  if (q.questionType === "FILL_IN_BLANK") {
    return {
      ...base,
      questionType: "FILL_IN_BLANK",
      questionData: {
        acceptedAnswers: q.acceptedAnswers.map((a) => a.trim()).filter(Boolean),
        caseSensitive: q.caseSensitive,
        trimWhitespace: true,
      },
    };
  }
  if (q.questionType === "MATCHING") {
    const pairs = q.matchingPairs.filter((p) => p.left.trim() && p.right.trim());
    const leftItems = pairs.map((p, i) => ({ id: `L${i + 1}`, text: p.left.trim() }));
    const rightItems = pairs.map((p, i) => ({ id: `R${i + 1}`, text: p.right.trim() }));
    return {
      ...base,
      questionType: "MATCHING",
      questionData: {
        leftItems,
        // Sap xep cot phai theo chu cai de thu tu khong lo dap an.
        rightItems: [...rightItems].sort((a, b) => a.text.localeCompare(b.text, "vi")),
        correctPairs: pairs.map((_, i) => ({ leftId: `L${i + 1}`, rightId: `R${i + 1}` })),
      },
    };
  }
  return {
    ...base,
    questionType: "MULTIPLE_CHOICE",
    questionData: {
      options: q.options.map((text, i) => ({ id: String(i), text: text.trim() })),
      correctOptionIds: [String(q.correctAnswer)],
    },
  };
}

/** Cau hoi tu BE (staff, co dap an) → draft editor. */
export function fromStaffQuestion(q: StaffQuizQuestion): QuizQuestion {
  const data = q.questionData;
  const draft: QuizQuestion = {
    ...makeEmpty(),
    questionId: q.questionId,
    content: q.content,
    questionType: q.questionType,
    explanation: q.explanation ?? "",
  };
  if (q.questionType === "FILL_IN_BLANK") {
    draft.acceptedAnswers = data.acceptedAnswers?.length ? [...data.acceptedAnswers] : [""];
    draft.caseSensitive = data.caseSensitive ?? false;
  } else if (q.questionType === "MATCHING") {
    const text = (items: typeof data.leftItems, id: string) => items?.find((it) => it.id === id)?.text ?? "";
    const pairs = (data.correctPairs ?? []).map((p) => ({
      left: text(data.leftItems, p.leftId),
      right: text(data.rightItems, p.rightId),
    }));
    draft.matchingPairs = pairs.length ? pairs : EMPTY_TYPE_FIELDS.matchingPairs;
  } else {
    const opts = (data.options ?? []).map((o) => o.text);
    while (opts.length < 4) opts.push("");
    draft.options = opts.slice(0, 4) as [string, string, string, string];
    const correctIdx = (data.options ?? []).findIndex((o) => data.correctOptionIds?.includes(o.id));
    draft.correctAnswer = Math.min(Math.max(correctIdx, 0), 3) as 0 | 1 | 2 | 3;
  }
  return draft;
}

function isQuestionValid(q: QuizQuestion): boolean {
  if (!q.content.trim()) return false;
  if (q.questionType === "FILL_IN_BLANK") return q.acceptedAnswers.some((a) => a.trim());
  if (q.questionType === "MATCHING") {
    return q.matchingPairs.length >= 2 && q.matchingPairs.every((p) => p.left.trim() && p.right.trim());
  }
  return q.options.every((o) => o.trim());
}

function describeAnswer(q: QuizQuestion): string {
  if (q.questionType === "FILL_IN_BLANK") return q.acceptedAnswers.filter((a) => a.trim()).join(" / ");
  if (q.questionType === "MATCHING") return q.matchingPairs.map((p) => `${p.left} → ${p.right}`).join("; ");
  return `${LABELS[q.correctAnswer]}. ${q.options[q.correctAnswer]}`;
}

// ─── Paste Dialog ─────────────────────────────────────────────────────────────

const FORMAT_EXAMPLE = `Liên Hợp Quốc được thành lập năm nào?
A. 1944
B. 1945
C. 1946
D. 1947
*B
// LHQ chính thức thành lập ngày 24/10/1945.

---

Trụ sở chính của LHQ đặt tại thành phố nào?
A. Geneva
B. London
C. New York
D. Paris
*C`;

interface PasteDialogProps {
  startIndex: number;
  onClose: () => void;
  onImport: (qs: QuizQuestion[]) => void;
}

function PasteDialog({ startIndex, onClose, onImport }: PasteDialogProps) {
  const [text, setText] = React.useState("");
  const [previewCount, setPreviewCount] = React.useState<number | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const handlePreview = () => {
    const result = parsePlainTextQuestions(text, startIndex);
    if (!result.ok) { setError(result.error); setPreviewCount(null); return; }
    setError(null);
    setPreviewCount(result.questions.length);
  };

  const handleImport = () => {
    const result = parsePlainTextQuestions(text, startIndex);
    if (!result.ok) { setError(result.error); return; }
    onImport(result.questions.map(toQuizQuestion));
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[92vh] flex flex-col p-0 overflow-hidden rounded-sm border border-border-card shadow-[var(--shadow-soft)] bg-[var(--bg-surface)] text-content-heading">
        
        <DialogHeader className="px-8 pt-8 pb-4 relative overflow-hidden">
          <DialogTitle className="text-2xl font-bold tracking-tight text-content-heading">
            Dán nhiều câu trắc nghiệm
          </DialogTitle>
          <DialogDescription className="text-sm mt-1.5 leading-relaxed text-content-muted">
            Chỉ dùng cho câu <strong>trắc nghiệm 4 phương án</strong>; câu điền chỗ trống và nối cặp hãy thêm bằng thanh “Thêm câu”. Dán nhiều câu cùng lúc theo định dạng chuẩn. Các câu hỏi được phân tách bằng dấu gạch ngang <code className="px-1.5 py-0.5 rounded-sm bg-[var(--status-neutral-bg)] font-mono text-xs">---</code> hoặc một dòng trống.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 px-8 pb-8 overflow-y-auto space-y-6 scrollbar-thin scrollbar-thumb-black/10">
          {/* Format reference section */}
          <div className="rounded-sm border border-card-light-border bg-[var(--status-neutral-bg)] overflow-hidden">
            <details className="group">
              <summary className="px-5 py-3.5 cursor-pointer font-semibold select-none flex items-center justify-between text-content-text hover:bg-[var(--status-neutral-bg)] transition-colors">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent-teal" />
                  <span>Xem định dạng mẫu & Hướng dẫn</span>
                </div>
                <div className="text-xs px-2 py-0.5 rounded-full bg-[var(--status-neutral-bg)] group-open:hidden">Xem</div>
                <div className="text-xs px-2 py-0.5 rounded-full bg-[var(--status-neutral-bg)] hidden group-open:block">Đóng</div>
              </summary>
              <div className="px-5 pb-5 pt-1 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-2">
                    <p className="font-bold underline decoration-accent-teal/30 underline-offset-4">Cấu trúc 1 câu hỏi:</p>
                    <ul className="space-y-1 opacity-80 list-disc pl-4">
                      <li>Dòng 1: Nội dung câu hỏi</li>
                      <li>Dòng 2-5: Đáp án A, B, C, D (bắt đầu bằng A., B., C., D.)</li>
                      <li>Dòng 6: Đáp án đúng (bắt đầu bằng *)</li>
                      <li>Dòng 7: Giải thích (tuỳ chọn, bắt đầu bằng //)</li>
                    </ul>
                  </div>
                  <pre className="p-4 rounded-sm font-mono text-[10px] leading-relaxed overflow-x-auto text-content-muted bg-[var(--bg-elevated)] border border-card-light-border">
                    {`Nội dung câu hỏi?\nA. Đáp án A\nB. Đáp án B\nC. Đáp án C\nD. Đáp án D\n*B\n// Giải thích tại đây...`}
                  </pre>
                </div>
              </div>
            </details>
          </div>

          {/* Textarea field */}
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-bold flex items-center gap-2 text-content-heading">
                Nội dung văn bản
                <span className="text-[10px] font-normal px-1.5 py-0.25 rounded-sm bg-accent-blue/10 text-accent-blue border border-accent-blue/20">Soạn thảo</span>
              </Label>
              <button type="button" 
                className="text-xs font-semibold px-2 py-1 rounded-sm text-accent-blue hover:bg-accent-blue/10 transition-all"
                onClick={() => { setText(FORMAT_EXAMPLE); setError(null); setPreviewCount(null); }}>
                Dùng ví dụ mẫu
              </button>
            </div>
            <div className="relative group">
              <Textarea
                value={text}
                onChange={(e) => { setText(e.target.value); setError(null); setPreviewCount(null); }}
                placeholder={"Dán các nội dung câu hỏi tại đây...\n\nVí dụ:\nLịch sử Việt Nam có bao nhiêu năm văn hiến?\nA. 1000\nB. 2000\nC. 3000\nD. 4000\n*D"}
                className="min-h-[300px] font-mono text-sm resize-none rounded-sm p-6 transition-all border-2 leading-relaxed text-content-text bg-[var(--bg-elevated)] border-card-light-border"
              />
              <div className="absolute bottom-4 right-4 text-[10px] opacity-30 group-hover:opacity-60 pointer-events-none font-mono">
                {text.length} ký tự
              </div>
            </div>
          </div>

          {/* Feedback Section */}
          <div className="min-h-[40px] animate-in fade-in slide-in-from-top-2 duration-300">
            {error && (
              <div className="rounded-sm px-4 py-3 text-xs font-semibold flex items-center gap-2 border bg-[var(--status-danger-bg)] text-[var(--accent-danger)] border-[var(--status-danger-border)]">
                <div className="shrink-0 w-5 h-5 rounded-full bg-accent-danger/20 flex items-center justify-center text-accent-danger">!</div>
                {error}
              </div>
            )}
            {previewCount !== null && !error && (
              <div className="rounded-sm px-4 py-3 text-xs font-semibold flex items-center gap-2 border bg-[var(--status-success-bg)] text-[var(--status-success)] border-[var(--status-success-border)]">
                <div className="shrink-0 w-5 h-5 rounded-full bg-[var(--status-success-bg)] flex items-center justify-center text-[var(--status-success)] font-bold">✓</div>
                Xác nhận: Tìm thấy <strong>{previewCount}</strong> câu hỏi hợp lệ.
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="px-8 py-6 bg-[var(--status-neutral-bg)] border-t border-card-light-border flex flex-row items-center justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose}
            className="rounded-sm font-semibold px-6 text-content-muted hover:bg-[var(--status-neutral-bg)]">Hủy</Button>
          
          <Button type="button" variant="outline" onClick={handlePreview} disabled={!text.trim()}
            className="rounded-sm font-semibold px-6 border-2 border-card-light-border bg-transparent text-content-text transition-all hover:border-[var(--text-primary)]">
            Kiểm tra
          </Button>

          <Button type="button" onClick={handleImport} disabled={!text.trim() || error !== null}
            className="rounded-sm font-bold px-8 transition-all text-white active:scale-95 border-none bg-[var(--accent-gold)] hover:bg-[var(--accent-bronze)]">
            Import {previewCount !== null ? `(${previewCount} câu)` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Inline Question Form ─────────────────────────────────────────────────────

interface QFormProps {
  initial?: QuizQuestion;
  /** Loai cau hoi khi tao moi (chon san tu thanh "Thêm câu"). */
  initialType?: QuestionType;
  orderIndex: number;
  onSave: (q: QuizQuestion) => void;
  onCancel: () => void;
  isSaving?: boolean;
}

const FIELD_LABEL = "text-xs font-semibold px-1 text-content-subtle";
const FIELD_INPUT = "h-10 text-sm rounded-sm border-2 transition-all bg-[var(--bg-elevated)] border-[var(--border-default)]";

export function QuestionForm({ initial, initialType, orderIndex, onSave, onCancel, isSaving = false }: QFormProps) {
  const [draft, setDraft] = React.useState<QuizQuestion>(
    initial ?? { ...makeEmpty(), orderIndex, ...(initialType && { questionType: initialType }) },
  );
  const ref = React.useRef<HTMLDivElement>(null);
  // Form mo o cuoi danh sach dai: cuon toi de nguoi soan khong phai tu tim.
  React.useEffect(() => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, []);
  const setOpt = (i: number, v: string) =>
    setDraft((s) => { const o = [...s.options] as [string, string, string, string]; o[i] = v; return { ...s, options: o }; });
  const setAccepted = (i: number, v: string) =>
    setDraft((s) => ({ ...s, acceptedAnswers: s.acceptedAnswers.map((a, k) => (k === i ? v : a)) }));
  const setPair = (i: number, side: keyof MatchingDraftPair, v: string) =>
    setDraft((s) => ({ ...s, matchingPairs: s.matchingPairs.map((p, k) => (k === i ? { ...p, [side]: v } : p)) }));
  const valid = isQuestionValid(draft);

  return (
    <div ref={ref} className="scroll-mt-24 rounded-sm border-2 border-[var(--accent-gold)] p-6 space-y-5 transition-all animate-in zoom-in-95 duration-200 bg-[var(--bg-elevated)]">
      <p className="text-sm font-bold text-content-heading">{initial ? `Sửa câu ${orderIndex}` : `Câu hỏi mới (câu ${orderIndex})`}</p>

      {/* Question type */}
      <div className="grid gap-2">
        <Label className={FIELD_LABEL}>Loại câu hỏi</Label>
        <div className="flex flex-wrap gap-1.5">
          {QUESTION_TYPES.map((type) => (
            <button key={type} type="button"
              onClick={() => setDraft((s) => ({ ...s, questionType: type }))}
              aria-pressed={draft.questionType === type}
              className={cn(
                "px-3 py-1.5 rounded-sm text-left border transition-all",
                draft.questionType === type
                  ? "bg-[var(--accent-gold-active-bg)] border-accent-gold text-content-heading"
                  : "bg-transparent border-card-light-border text-content-muted",
              )}>
              <span className="block text-xs font-semibold">{QUESTION_TYPE_LABELS[type]}</span>
              <span className="block text-[11px] opacity-80">{QUESTION_TYPE_HINTS[type]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="grid gap-2">
        <Label className={FIELD_LABEL}>Nội dung câu hỏi *</Label>
        <Textarea value={draft.content}
          onChange={(e) => setDraft((s) => ({ ...s, content: e.target.value }))}
          placeholder="Nhập nội dung câu hỏi..."
          className="min-h-[100px] text-sm rounded-sm border-2 focus:ring-0 transition-all border-[var(--border-default)] bg-[var(--bg-elevated)]" />
      </div>

      {draft.questionType === "MULTIPLE_CHOICE" && (
        <div className="grid gap-3">
          <Label className={FIELD_LABEL}>Đáp án & Đáp án đúng ✓</Label>
          <div className="grid gap-2.5">
            {LABELS.map((lbl, idx) => {
              const correct = draft.correctAnswer === idx;
              return (
                <div key={lbl} className="flex items-center gap-3">
                  <button type="button"
                    onClick={() => setDraft((s) => ({ ...s, correctAnswer: idx as 0 | 1 | 2 | 3 }))}
                    className={cn(
                      "shrink-0 w-9 h-9 rounded-sm border-2 flex items-center justify-center transition-all duration-200 active:scale-90",
                      correct
                        ? "border-[var(--status-success)] bg-[var(--status-success)] text-white"
                        : "border-card-light-border bg-[var(--bg-elevated)] text-content-muted",
                    )}
                    title="Đánh dấu đáp án đúng">
                    {correct ? <CheckCircle2 className="w-5 h-5" /> : <span className="text-sm font-bold">{lbl}</span>}
                  </button>
                  <Input value={draft.options[idx]} onChange={(e) => setOpt(idx, e.target.value)}
                    placeholder={`Đáp án ${lbl}...`}
                    className={cn("flex-1", FIELD_INPUT, correct && "border-[var(--status-success-border)]")} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {draft.questionType === "FILL_IN_BLANK" && (
        <div className="grid gap-3">
          <Label className={FIELD_LABEL}>Các đáp án được chấp nhận *</Label>
          <div className="grid gap-2.5">
            {draft.acceptedAnswers.map((ans, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Input value={ans} onChange={(e) => setAccepted(idx, e.target.value)}
                  placeholder={idx === 0 ? "Vd. Ngô Quyền" : "Cách viết khác (tuỳ chọn)"}
                  className={cn("flex-1", FIELD_INPUT)} />
                <Button type="button" variant="ghost" size="icon-sm" className="rounded-sm h-8 w-8 text-accent-danger"
                  disabled={draft.acceptedAnswers.length <= 1}
                  onClick={() => setDraft((s) => ({ ...s, acceptedAnswers: s.acceptedAnswers.filter((_, k) => k !== idx) }))}
                  title="Xóa">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <Button type="button" variant="outline" size="sm" className="h-8 px-3 text-xs gap-1.5 rounded-sm border-card-light-border bg-transparent text-content-text"
              onClick={() => setDraft((s) => ({ ...s, acceptedAnswers: [...s.acceptedAnswers, ""] }))}>
              <Plus className="h-3.5 w-3.5" /> Thêm cách viết
            </Button>
            <label className="flex items-center gap-2 text-xs text-content-muted cursor-pointer">
              <input type="checkbox" checked={draft.caseSensitive}
                onChange={(e) => setDraft((s) => ({ ...s, caseSensitive: e.target.checked }))} />
              Phân biệt chữ hoa / thường
            </label>
          </div>
        </div>
      )}

      {draft.questionType === "MATCHING" && (
        <div className="grid gap-3">
          <Label className={FIELD_LABEL}>Các cặp đúng (tối thiểu 2) *</Label>
          <p className="px-1 text-xs text-content-muted">Cột phải sẽ được xáo thứ tự khi hiển thị cho người học.</p>
          <div className="grid gap-2.5">
            {draft.matchingPairs.map((pair, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Input value={pair.left} onChange={(e) => setPair(idx, "left", e.target.value)}
                  placeholder="Vế trái (vd. Ngô Quyền)" className={cn("flex-1", FIELD_INPUT)} />
                <span className="text-content-subtle">→</span>
                <Input value={pair.right} onChange={(e) => setPair(idx, "right", e.target.value)}
                  placeholder="Vế phải (vd. Bạch Đằng 938)" className={cn("flex-1", FIELD_INPUT)} />
                <Button type="button" variant="ghost" size="icon-sm" className="rounded-sm h-8 w-8 text-accent-danger"
                  disabled={draft.matchingPairs.length <= 2}
                  onClick={() => setDraft((s) => ({ ...s, matchingPairs: s.matchingPairs.filter((_, k) => k !== idx) }))}
                  title="Xóa cặp">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <div>
            <Button type="button" variant="outline" size="sm" className="h-8 px-3 text-xs gap-1.5 rounded-sm border-card-light-border bg-transparent text-content-text"
              onClick={() => setDraft((s) => ({ ...s, matchingPairs: [...s.matchingPairs, { left: "", right: "" }] }))}>
              <Plus className="h-3.5 w-3.5" /> Thêm cặp
            </Button>
          </div>
        </div>
      )}

      {/* Explanation */}
      <div className="grid gap-2">
        <Label className={FIELD_LABEL}>Giải thích (tuỳ chọn)</Label>
        <Input value={draft.explanation ?? ""}
          onChange={(e) => setDraft((s) => ({ ...s, explanation: e.target.value }))}
          placeholder="Lý do vì sao đáp án này đúng..."
          className={FIELD_INPUT} />
      </div>

      <div className="flex gap-2.5 pt-2 border-t border-card-light-border mt-4">
        <Button type="button" size="sm" className="px-6 rounded-sm font-bold transition-all active:scale-95 border-none bg-[var(--accent-gold)] text-white hover:bg-[var(--accent-bronze)]"
          disabled={!valid || isSaving} onClick={() => valid && onSave({ ...draft })}>
          Lưu câu hỏi
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}
          className="rounded-sm px-4 text-content-muted hover:bg-[var(--status-neutral-bg)]">Hủy bỏ</Button>
      </div>
    </div>
  );
}

// ─── Question Row ─────────────────────────────────────────────────────────────

export function QuestionTypeBadge({ type }: { type: QuestionType }) {
  return (
    <span className="shrink-0 text-xs font-semibold px-1.5 py-0.5 rounded-full bg-[var(--status-neutral-bg)] text-content-muted border border-[var(--border-default)]">
      {QUESTION_TYPE_LABELS[type]}
    </span>
  );
}

export function QuestionAnswerSummary({ q }: { q: QuizQuestion }) {
  return (
    <div className="flex items-center gap-2 mt-1.5 overflow-hidden">
      <QuestionTypeBadge type={q.questionType} />
      <span className="shrink-0 text-xs font-semibold px-1.5 py-0.5 rounded-full bg-[var(--status-success-bg)] text-[var(--status-success)] border border-[var(--status-success-border)]">Đúng</span>
      <p className="text-xs truncate font-medium text-content-muted">{describeAnswer(q)}</p>
    </div>
  );
}

function QuestionRow({ q, idx, total, onEdit, onDelete, onMove }: {
  q: QuizQuestion; idx: number; total: number;
  onEdit: () => void; onDelete: () => void; onMove: (d: "up" | "down") => void;
}) {
  return (
    <div className="flex items-start gap-4 rounded-sm border border-card-light-border bg-card-light-bg px-5 py-4 group transition-all hover:border-[var(--text-primary)]">
      <div className="shrink-0 w-8 h-8 rounded-sm flex items-center justify-center text-xs font-bold bg-accent-blue/10 text-accent-blue">
        {idx + 1}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-relaxed text-content-text">{q.content}</p>
        <QuestionAnswerSummary q={q} />
      </div>
      <div className="flex items-center gap-1 shrink-0 opacity-60 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
        <div className="flex items-center gap-0.5 bg-[var(--status-neutral-bg)] p-0.5 rounded-sm border border-[var(--border-default)]">
          <Button type="button" variant="ghost" size="icon-sm" className="rounded-sm h-7 w-7 hover:bg-[var(--bg-elevated)]"
            disabled={idx === 0} onClick={() => onMove("up")} title="Lên">
            <ArrowUp className="h-3.5 w-3.5" />
          </Button>
          <Button type="button" variant="ghost" size="icon-sm" className="rounded-sm h-7 w-7 hover:bg-[var(--bg-elevated)]"
            disabled={idx === total - 1} onClick={() => onMove("down")} title="Xuống">
            <ArrowDown className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="w-px h-4 bg-[var(--border-default)] mx-1" />
        <Button type="button" variant="ghost" size="icon-sm" className="rounded-sm h-8 w-8 text-accent-blue hover:bg-accent-blue/10"
          onClick={onEdit} title="Sửa">
          <Pencil className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon-sm" className="rounded-sm h-8 w-8 text-accent-danger hover:bg-accent-danger/10"
          onClick={onDelete} title="Xóa">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ─── Main Editor ──────────────────────────────────────────────────────────────

export function QuizQuestionEditor({ questions, onChange, onImportError, onImportSuccess, onEditingChange }: QuizQuestionEditorProps) {
  const [addingNew, setAddingNew] = React.useState<QuestionType | null>(null);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [pasteOpen, setPasteOpen] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const editing = addingNew !== null || editingId !== null;
  React.useEffect(() => { onEditingChange?.(editing); }, [editing, onEditingChange]);

  const handleSaveNew = (q: QuizQuestion) => { onChange(reindex([...questions, q])); setAddingNew(null); };
  const handleSaveEdit = (u: QuizQuestion) => { onChange(reindex(questions.map((q) => q.questionId === u.questionId ? u : q))); setEditingId(null); };
  // Xoa ngay, cho hoan tac trong toast thay vi hop xac nhan.
  const handleDelete = (id: string) => {
    const index = questions.findIndex((q) => q.questionId === id);
    if (index < 0) return;
    const before = questions;
    onChange(reindex(questions.filter((q) => q.questionId !== id)));
    toast(`Đã xóa câu ${index + 1}`, { action: { label: "Hoàn tác", onClick: () => onChange(before) } });
  };
  const typeCounts = QUESTION_TYPES
    .map((type) => ({ type, n: questions.filter((q) => q.questionType === type).length }))
    .filter((c) => c.n > 0);
  const handleMove = (id: string, dir: "up" | "down") => {
    const i = questions.findIndex((q) => q.questionId === id); if (i < 0) return;
    const next = [...questions]; const j = dir === "up" ? i - 1 : i + 1;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]]; onChange(reindex(next));
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    e.target.value = "";
    const raw = await file.text();
    const start = questions.length + 1;
    const result = file.name.endsWith(".csv") ? parseCsvQuestions(raw, start) : parseJsonQuestions(raw, start);
    if (!result.ok) { onImportError?.(result.error); return; }
    const imported = result.questions.map((q: ImportedQuestion) => toQuizQuestion(q));
    onChange(reindex([...questions, ...imported]));
    onImportSuccess?.(imported.length);
  };

  const handlePasteImport = (imported: QuizQuestion[]) => {
    setPasteOpen(false);
    onChange(reindex([...questions, ...imported]));
    onImportSuccess?.(imported.length);
  };

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="min-w-0">
          <span className="text-sm font-semibold text-content-heading">Câu hỏi ({questions.length})</span>
          {typeCounts.length > 0 && (
            <p className="text-xs text-content-muted">
              {typeCounts.map((c) => `${c.n} ${QUESTION_TYPE_LABELS[c.type].toLowerCase()}`).join(" · ")}
            </p>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          {/* Paste text */}
          <Button type="button" variant="outline" size="sm" className="h-8 px-3 text-xs gap-1.5 rounded-sm border-card-light-border bg-transparent text-content-text"
            onClick={() => setPasteOpen(true)}>
            <ClipboardList className="h-3.5 w-3.5" /> Dán nhiều câu trắc nghiệm
          </Button>

          {/* File import */}
          <input ref={fileRef} type="file" accept=".json,.csv" className="hidden" onChange={handleFile} />
          <Button type="button" variant="outline" size="sm" className="h-8 px-3 text-xs gap-1.5 rounded-sm border-card-light-border bg-transparent text-content-text"
            onClick={() => fileRef.current?.click()}>
            <Upload className="h-3.5 w-3.5" /> Nhập file trắc nghiệm (JSON/CSV)
          </Button>

        </div>
      </div>

      {/* Question list */}
      <div className="space-y-2">
        {questions.map((q, idx) => (
          <div key={q.questionId}>
            {editingId === q.questionId
              ? <QuestionForm initial={q} orderIndex={idx + 1}
                onSave={handleSaveEdit} onCancel={() => setEditingId(null)} />
              : <QuestionRow q={q} idx={idx} total={questions.length}
                onEdit={() => { setAddingNew(null); setEditingId(q.questionId); }}
                onDelete={() => handleDelete(q.questionId)}
                onMove={(d) => handleMove(q.questionId, d)} />
            }
          </div>
        ))}
        {addingNew && (
          <QuestionForm key={addingNew} initialType={addingNew} orderIndex={questions.length + 1}
            onSave={handleSaveNew} onCancel={() => setAddingNew(null)} />
        )}
        {/* Luon co thanh them cau o cuoi danh sach (truoc day chi hien khi bo de rong). */}
        {!addingNew && (
          <div className={cn(
            "rounded-sm border-2 border-dashed border-card-light-border px-4",
            questions.length ? "py-4" : "py-10",
          )}>
            {!questions.length && (
              <p className="mb-3 text-center text-sm text-content-muted">Chưa có câu hỏi nào. Chọn loại câu để bắt đầu soạn.</p>
            )}
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="flex items-center gap-1 text-xs font-semibold text-content-subtle">
                <Plus className="h-3.5 w-3.5" /> Thêm câu:
              </span>
              {QUESTION_TYPES.map((type) => (
                <Button key={type} type="button" size="sm" variant="outline"
                  disabled={editingId !== null}
                  title={QUESTION_TYPE_HINTS[type]}
                  className="rounded-sm border-card-light-border bg-transparent text-content-text"
                  onClick={() => setAddingNew(type)}>
                  {QUESTION_TYPE_LABELS[type]}
                </Button>
              ))}
            </div>
            {editingId !== null && (
              <p className="mt-2 text-center text-xs text-content-muted">Lưu hoặc hủy câu đang sửa trước khi thêm câu mới.</p>
            )}
          </div>
        )}
      </div>

      {/* Paste dialog */}
      {pasteOpen && (
        <PasteDialog
          startIndex={questions.length + 1}
          onClose={() => setPasteOpen(false)}
          onImport={handlePasteImport}
        />
      )}
    </div>
  );
}
