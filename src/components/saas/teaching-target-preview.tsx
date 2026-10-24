"use client";

import * as React from "react";
import { Check, ExternalLink, FileText, Loader2 } from "lucide-react";

import { AccountDrawer } from "@/components/saas/accounts-form";
import { apiErrorMessage } from "@/features/saas/hooks-api";
import { useLocalDocuments } from "@/features/saas/hooks-local-content";
import { useCharacter } from "@/features/characters/hooks";
import { useCharacterDocuments, useHistoricalDocuments } from "@/features/documents/hooks";
import { useEventDetail } from "@/features/events/hooks";
import { QUESTION_TYPE_LABELS } from "@/features/quiz/question-data";
import type { LocalItem } from "@/services/local-content.service";
import type { LocalQuiz } from "@/services/local-quiz.service";
import type { QuizSet } from "@/services/quiz.service";

/**
 * Drawer "Xem chi tiet" o buoc chon noi dung khi giao bai: doc mo ta, tu lieu dinh kem,
 * cau hoi (bo de cua truong) truoc khi chon, thay vi chi nhin ten.
 */

export type TargetPreview =
  | { kind: "local"; item: LocalItem }
  | { kind: "event"; id: string }
  | { kind: "character"; id: string }
  | { kind: "localQuiz"; quiz: LocalQuiz }
  | { kind: "quiz"; quiz: QuizSet };

export interface PreviewTarget {
  id: string;
  title: string;
  meta?: string;
  preview?: TargetPreview;
}

const LEVEL_LABELS = { EASY: "Dễ", MEDIUM: "Trung bình", HARD: "Khó" } as const;
const SCOPE_LABELS = { CLASS_ONLY: "Chỉ mình tôi", SCHOOL_WIDE: "Toàn trường" } as const;

export const yearText = (year?: number | null, bc?: boolean | null) =>
  year ? `${Math.abs(year)}${bc || year < 0 ? " TCN" : ""}` : null;

const lifeText = (born?: string | null, death?: string | null) => (born || death ? `${born ?? "?"} – ${death ?? "?"}` : null);

export function TargetPreviewDrawer({
  target,
  onClose,
  selected,
  onSelect,
}: {
  target: PreviewTarget | null;
  onClose: () => void;
  selected: boolean;
  onSelect?: () => void;
}) {
  return (
    <AccountDrawer
      open={Boolean(target)}
      onOpenChange={(open) => !open && onClose()}
      title={target?.title ?? ""}
      description={target?.meta}
      wide
      footer={
        <>
          <button type="button" className="btn-line" onClick={onClose}>
            Đóng
          </button>
          {onSelect && (
            <button
              type="button"
              className="btn-crimson"
              disabled={selected}
              onClick={() => {
                onSelect();
                onClose();
              }}
            >
              <Check className="h-4 w-4" aria-hidden="true" /> {selected ? "Đang chọn" : "Chọn nội dung này"}
            </button>
          )}
        </>
      }
    >
      {target?.preview && <PreviewBody preview={target.preview} />}
    </AccountDrawer>
  );
}

function PreviewBody({ preview }: { preview: TargetPreview }) {
  switch (preview.kind) {
    case "local":
      return <LocalItemPreview item={preview.item} />;
    case "event":
      return <EventPreview id={preview.id} />;
    case "character":
      return <CharacterPreview id={preview.id} />;
    case "localQuiz":
      return <LocalQuizPreview quiz={preview.quiz} />;
    case "quiz":
      return <LibraryQuizPreview quiz={preview.quiz} />;
  }
}

/* ───────────────────────── Building blocks ───────────────────────── */

function Loading() {
  return (
    <p className="flex items-center gap-2 text-sm text-content-muted">
      <Loader2 className="h-4 w-4 animate-spin text-[var(--accent-gold)]" aria-hidden="true" /> Đang tải...
    </p>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold text-content-subtle">{title}</h3>
      {children}
    </section>
  );
}

function Facts({ items }: { items: [string, string | null | undefined][] }) {
  const shown = items.filter((i): i is [string, string] => Boolean(i[1]));
  if (shown.length === 0) return null;
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
      {shown.map(([label, value]) => (
        <React.Fragment key={label}>
          <dt className="text-content-muted">{label}</dt>
          <dd className="font-semibold text-content-heading">{value}</dd>
        </React.Fragment>
      ))}
    </dl>
  );
}

function Cover({ src, alt }: { src?: string | null; alt: string }) {
  if (!src) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className="aspect-[16/9] w-full rounded-sm border border-[var(--border-default)] object-cover" />;
}

function Prose({ text, empty = "Chưa có mô tả." }: { text?: string | null; empty?: string }) {
  if (!text?.trim()) return <p className="text-sm text-content-muted">{empty}</p>;
  return <p className="whitespace-pre-line text-sm leading-relaxed text-content-text">{text}</p>;
}

interface DocRow {
  id: string;
  title: string;
  content: string;
  type: string;
  url?: string | null;
}

/** Tu lieu dinh kem (nguon AI dung khi tro chuyen). Bam de mo noi dung. */
function Documents({ docs, loading, error }: { docs: DocRow[]; loading: boolean; error: unknown }) {
  return (
    <Section title={`Tư liệu đính kèm${docs.length ? ` (${docs.length})` : ""}`}>
      {loading ? (
        <Loading />
      ) : error ? (
        <p className="text-sm text-content-muted">{apiErrorMessage(error, "Không tải được tư liệu.")}</p>
      ) : docs.length === 0 ? (
        <p className="text-sm text-content-muted">Chưa có tư liệu nào.</p>
      ) : (
        <ul className="divide-y divide-[var(--border-default)] rounded-sm border border-[var(--border-strong)]">
          {docs.map((d) => (
            <li key={d.id}>
              <details className="group">
                <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 text-sm hover:bg-[var(--status-neutral-bg)]">
                  <FileText className="h-4 w-4 shrink-0 text-content-subtle" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate font-semibold text-content-heading">{d.title}</span>
                  <span className="shrink-0 text-[13px] text-content-subtle">{d.type}</span>
                </summary>
                <div className="space-y-2 border-t border-[var(--border-default)] bg-[var(--bg-main)] px-3 py-3">
                  {d.url && /^https?:\/\//.test(d.url) && (
                    <a href={d.url} target="_blank" rel="noreferrer" className="archive-link">
                      Mở nguồn <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    </a>
                  )}
                  <p className="max-h-72 overflow-y-auto whitespace-pre-line text-sm leading-relaxed text-content-text">
                    {d.content || "Tư liệu không có nội dung văn bản."}
                  </p>
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

/* ───────────────────────── Per kind ───────────────────────── */

/** Boi canh / nhan vat cua truong (Kho tu lieu). */
function LocalItemPreview({ item }: { item: LocalItem }) {
  const docs = useLocalDocuments(item.type, item.id);
  const isContext = item.type === "CONTEXT";
  return (
    <>
      <Cover src={item.imageUrl} alt={item.name} />
      <Facts
        items={
          isContext
            ? [
                ["Năm", yearText(item.year, item.isBC)],
                ["Giai đoạn", item.startYear || item.endYear ? lifeText(yearText(item.startYear, item.isBC), yearText(item.endYear, item.isBC)) : null],
                ["Địa điểm", item.location],
                ["Người soạn", item.createdBy?.fullName || item.createdBy?.userName],
                ["Phạm vi", SCOPE_LABELS[item.contentScope]],
              ]
            : [
                ["Danh hiệu", item.title],
                ["Năm sinh – mất", lifeText(yearText(item.bornYear, item.isBornBc), yearText(item.deathYear, item.isDeathBc))],
                ["Người soạn", item.createdBy?.fullName || item.createdBy?.userName],
                ["Phạm vi", SCOPE_LABELS[item.contentScope]],
              ]
        }
      />
      <Section title={isContext ? "Mô tả bối cảnh" : "Tiểu sử"}>
        <Prose text={item.description} />
      </Section>
      {!isContext && item.personality && (
        <Section title="Tính cách">
          <Prose text={item.personality} />
        </Section>
      )}
      <Documents
        loading={docs.isLoading}
        error={docs.isError ? docs.error : null}
        docs={(docs.data ?? []).map((d) => ({ id: d.docId, title: d.title, content: d.content, type: d.type, url: d.fileUrl }))}
      />
    </>
  );
}

/** Boi canh HistoryTalk (GET /historical-contexts/{id}). */
function EventPreview({ id }: { id: string }) {
  const q = useEventDetail(id);
  const docs = useHistoricalDocuments(id);
  if (q.isLoading) return <Loading />;
  if (q.isError || !q.data) return <p className="text-sm text-[var(--accent-danger)]">{apiErrorMessage(q.error, "Không tải được bối cảnh.")}</p>;
  const e = q.data;
  return (
    <>
      <Cover src={e.imageUrl} alt={e.title} />
      <Facts
        items={[
          ["Năm", e.yearLabel ?? yearText(e.year, e.beforeTCN)],
          ["Giai đoạn", e.startYear || e.endYear ? lifeText(yearText(e.startYear, e.beforeTCN), yearText(e.endYear, e.beforeTCN)) : null],
          ["Thời kỳ", e.period],
          ["Địa điểm", e.location],
        ]}
      />
      <Section title="Mô tả bối cảnh">
        <Prose text={e.summary} />
      </Section>
      <Documents
        loading={docs.isLoading}
        error={docs.isError ? docs.error : null}
        docs={(docs.data ?? []).map((d, i) => ({ id: d.documentId ?? d.id ?? String(i), title: d.title, content: d.content, type: d.type }))}
      />
    </>
  );
}

/** Nhan vat HistoryTalk (GET /characters/{id}). */
function CharacterPreview({ id }: { id: string }) {
  const q = useCharacter(id);
  const docs = useCharacterDocuments(id);
  if (q.isLoading) return <Loading />;
  if (q.isError || !q.data) return <p className="text-sm text-[var(--accent-danger)]">{apiErrorMessage(q.error, "Không tải được nhân vật.")}</p>;
  const c = q.data;
  return (
    <>
      <Cover src={c.imageUrl ?? c.avatarUrl} alt={c.name} />
      <Facts
        items={[
          ["Danh hiệu", c.title],
          ["Năm sinh – mất", lifeText(yearText(c.bornYear, c.isBornBc), yearText(c.deathYear, c.isDeathBc))],
          ["Bối cảnh", c.contexts?.map((x) => x.name).join(", ")],
        ]}
      />
      <Section title="Tiểu sử">
        <Prose text={c.background || c.description} />
      </Section>
      {c.personality && (
        <Section title="Tính cách">
          <Prose text={c.personality} />
        </Section>
      )}
      <Documents
        loading={docs.isLoading}
        error={docs.isError ? docs.error : null}
        docs={(docs.data ?? []).map((d, i) => ({ id: d.documentId ?? d.id ?? String(i), title: d.title, content: d.content, type: d.type }))}
      />
    </>
  );
}

/** Bo de cua truong: giao vien xem duoc tung cau hoi. */
function LocalQuizPreview({ quiz }: { quiz: LocalQuiz }) {
  return (
    <>
      <Facts
        items={[
          ["Độ khó", LEVEL_LABELS[quiz.level]],
          ["Số câu", `${quiz.questions.length} câu`],
          ["Bối cảnh", quiz.contextTitle],
          ["Người soạn", typeof quiz.createdBy === "string" ? quiz.createdBy : quiz.createdBy?.userName],
        ]}
      />
      <Section title="Câu hỏi">
        {quiz.questions.length === 0 ? (
          <p className="text-sm text-content-muted">Bộ đề chưa có câu hỏi.</p>
        ) : (
          <ol className="space-y-2">
            {quiz.questions.map((qn, i) => (
              <li key={qn.questionId} className="rounded-sm border border-[var(--border-default)] px-3 py-2.5 text-sm">
                <p className="text-[13px] text-content-subtle">
                  Câu {i + 1} · {QUESTION_TYPE_LABELS[qn.questionType]}
                </p>
                <p className="mt-1 whitespace-pre-line text-content-heading">{qn.content}</p>
              </li>
            ))}
          </ol>
        )}
      </Section>
    </>
  );
}

/** Bo de HistoryTalk: BE khong tra cau hoi o danh sach, chi co thong tin chung. */
function LibraryQuizPreview({ quiz }: { quiz: QuizSet }) {
  return (
    <>
      <Facts
        items={[
          ["Độ khó", LEVEL_LABELS[quiz.level]],
          ["Bối cảnh", quiz.contextTitle],
          ["Lớp", quiz.grade ? `Lớp ${quiz.grade}` : null],
          ["Bài", quiz.chapterTitle ? `${quiz.chapterNumber ? `Bài ${quiz.chapterNumber}: ` : ""}${quiz.chapterTitle}` : null],
          ["Thời gian", quiz.durationSeconds ? `${Math.round(quiz.durationSeconds / 60)} phút` : null],
          ["Lượt làm", quiz.playCount ? quiz.playCount.toLocaleString("vi-VN") : null],
        ]}
      />
      <p className="text-sm text-content-muted">Bộ đề do HistoryTalk biên soạn. Câu hỏi hiển thị khi học sinh bắt đầu làm bài.</p>
    </>
  );
}
