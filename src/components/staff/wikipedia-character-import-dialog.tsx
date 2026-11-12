"use client";

import * as React from "react";
import Image from "next/image";
import { ArrowLeft, ExternalLink, Globe, Search } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { StaffFormInput, StaffFormTextarea } from "@/components/staff/staff-form";
import {
  fetchWikipediaCharacter,
  searchWikipedia,
  type WikiCharacter,
  type WikiDate,
  type WikiSearchResult,
} from "@/services/wikipedia.service";

const MAX_TITLE = 150; // backend CreateCharacterRequest.title @Size(max = 150)

export interface WikiCharacterFill {
  name?: string;
  title?: string;
  born?: WikiDate;
  death?: WikiDate;
  background?: string;
  image?: string;
  document?: { title: string; content: string };
}

type FieldKey = keyof WikiCharacterFill;

/** Render only while open: `{open && <WikipediaCharacterImportDialog … />}`. */
interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultQuery: string;
  /** Which form fields already hold data — those start unticked so nothing is overwritten by accident. */
  filled: Partial<Record<FieldKey, boolean>>;
  onApply: (fill: WikiCharacterFill) => void;
}

// Top-level so typing in a row's input does not remount it (and drop focus) on every render.
function Row({
  label,
  checked,
  onCheckedChange,
  willOverwrite,
  disabled,
  children,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (v: boolean | "indeterminate") => void;
  willOverwrite: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[24px_120px_1fr] items-start gap-3 border-b border-[var(--card-light-border)] py-3 last:border-0">
      <Checkbox checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} className="mt-0.5" aria-label={label} />
      <div className="text-sm font-semibold text-[var(--content-heading)]">
        {label}
        {willOverwrite && <p className="mt-0.5 text-[11px] font-normal text-[var(--status-warning)]">Đã có dữ liệu, sẽ ghi đè</p>}
      </div>
      <div className="min-w-0 text-sm text-[var(--content-body)]">{children}</div>
    </div>
  );
}

function formatDate(d?: WikiDate): string {
  if (!d) return "";
  return [d.day, d.month, d.year].filter(Boolean).join("/") + (d.bc ? " TCN" : "");
}

export function WikipediaCharacterImportDialog({ open, onOpenChange, defaultQuery, filled, onApply }: Props) {
  const [query, setQuery] = React.useState(defaultQuery.trim());
  const [results, setResults] = React.useState<WikiSearchResult[] | null>(null);
  const [loading, setLoading] = React.useState<"search" | "article" | null>(defaultQuery.trim() ? "search" : null);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<WikiCharacter | null>(null);
  const [title, setTitle] = React.useState("");
  const [background, setBackground] = React.useState("");
  const [checked, setChecked] = React.useState<Partial<Record<FieldKey, boolean>>>({});
  const abortRef = React.useRef<AbortController | null>(null);

  const begin = () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setError(null);
    return controller;
  };

  const search = async (q: string) => {
    if (!q.trim()) return;
    const controller = begin();
    setLoading("search");
    try {
      setResults(await searchWikipedia(q, controller.signal));
    } catch (e) {
      if (!controller.signal.aborted) setError(e instanceof Error ? e.message : "Không kết nối được Wikipedia");
    } finally {
      if (!controller.signal.aborted) setLoading(null);
    }
  };

  const pick = async (articleTitle: string) => {
    const controller = begin();
    setLoading("article");
    try {
      const c = await fetchWikipediaCharacter(articleTitle, controller.signal);
      setData(c);
      setTitle((c.description || c.positions[0] || "").slice(0, MAX_TITLE));
      setBackground(c.intro);
      const available: Record<FieldKey, boolean> = {
        name: true,
        title: !!(c.description || c.positions.length),
        born: !!c.born,
        death: !!c.death,
        background: !!c.intro,
        image: !!c.imageUrl,
        document: !!c.article.content,
      };
      setChecked(
        Object.fromEntries(
          (Object.keys(available) as FieldKey[]).map((k) => [k, available[k] && !filled[k]]),
        ) as Record<FieldKey, boolean>,
      );
    } catch (e) {
      if (!controller.signal.aborted) setError(e instanceof Error ? e.message : "Không tải được bài viết");
    } finally {
      if (!controller.signal.aborted) setLoading(null);
    }
  };

  // Mounted only while open (see the caller). Uses the name already typed in the form and goes straight to the
  // best match's preview; the result list only shows via "Chọn bài khác" or when nothing matched.
  React.useEffect(() => {
    const q = defaultQuery.trim();
    if (!q) return;
    const controller = new AbortController();
    abortRef.current = controller;
    const norm = (t: string) => t.normalize("NFC").trim().toLowerCase();
    searchWikipedia(q, controller.signal)
      .then((found) => {
        setResults(found);
        const best = found.find((r) => norm(r.title) === norm(q)) ?? found[0];
        if (best) void pick(best.title);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e instanceof Error ? e.message : "Không kết nối được Wikipedia");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(null);
      });
    return () => {
      controller.abort();
      abortRef.current?.abort(); // the auto-picked article fetch, if it started
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedCount = Object.values(checked).filter(Boolean).length;

  const apply = () => {
    if (!data) return;
    const fill: WikiCharacterFill = {};
    if (checked.name) fill.name = data.title;
    if (checked.title && title.trim()) fill.title = title.trim().slice(0, MAX_TITLE);
    if (checked.born && data.born) fill.born = data.born;
    if (checked.death && data.death) fill.death = data.death;
    if (checked.background && background.trim()) fill.background = background.trim();
    if (checked.image && data.imageUrl) fill.image = data.imageUrl;
    if (checked.document) fill.document = { title: data.title, content: data.article.content };
    onApply(fill);
    onOpenChange(false);
  };

  const row = (k: FieldKey) => ({
    checked: !!checked[k],
    onCheckedChange: (v: boolean | "indeterminate") => setChecked((s) => ({ ...s, [k]: v === true })),
    willOverwrite: !!filled[k],
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[88vh] flex-col gap-4 sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Điền thông tin từ Wikipedia
          </DialogTitle>
          <DialogDescription>
            Chọn bài viết, xem trước và tick các mục muốn điền. Mọi thứ vẫn sửa được trong form trước khi bấm Tạo / Lưu.
          </DialogDescription>
        </DialogHeader>

        {!data ? (
          <div className="flex min-h-0 flex-1 flex-col gap-3">
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                void search(query);
              }}
            >
              <StaffFormInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tên nhân vật..." autoFocus />
              <Button type="submit" variant="outline" disabled={!query.trim() || !!loading}>
                <Search className="mr-1.5 h-4 w-4" />
                Tìm
              </Button>
            </form>
            {loading ? (
              <div className="flex items-center gap-2 py-6 text-sm text-[var(--content-muted)]">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                {loading === "search" ? "Đang tìm trên Wikipedia..." : "Đang lấy thông tin nhân vật..."}
              </div>
            ) : error ? (
              <p role="alert" className="text-sm font-medium text-accent-danger">{error}</p>
            ) : results && !results.length ? (
              <p className="text-sm text-[var(--content-muted)]">Không tìm thấy bài viết phù hợp.</p>
            ) : results ? (
              <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
                {results.map((r) => (
                  <li key={r.title}>
                    <button
                      type="button"
                      onClick={() => void pick(r.title)}
                      className="w-full rounded-sm border border-[var(--card-light-border)] p-3 text-left transition-colors hover:border-[var(--accent-gold)]/50 hover:bg-[var(--accent-gold)]/5"
                    >
                      <span className="text-sm font-semibold text-[var(--content-heading)]">{r.title}</span>
                      {r.snippet && <p className="mt-1 line-clamp-2 text-sm text-[var(--content-muted)]">{r.snippet}…</p>}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3">
              <Button type="button" variant="ghost" size="sm" onClick={() => { setData(null); setError(null); }}>
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                Chọn bài khác
              </Button>
              <a
                href={data.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-sm font-medium text-[var(--accent-blue)] hover:underline"
              >
                {data.title}
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
              <Row {...row("name")} label="Tên nhân vật">{data.title}</Row>
              <Row {...row("title")} label="Chức vị" disabled={!data.description && !data.positions.length}>
                <StaffFormInput value={title} onChange={(e) => setTitle(e.target.value.slice(0, MAX_TITLE))} placeholder="Chưa có gợi ý" />
                {(data.description || data.positions.length > 0) && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {[data.description, ...data.positions].filter(Boolean).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => {
                          setTitle(s.slice(0, MAX_TITLE));
                          setChecked((c) => ({ ...c, title: true }));
                        }}
                        className="rounded-sm border border-[var(--card-light-border)] px-2 py-0.5 text-xs text-[var(--content-muted)] hover:border-[var(--accent-gold)]/50 hover:text-[var(--content-heading)]"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </Row>
              <Row {...row("born")} label="Ngày sinh" disabled={!data.born}>
                {formatDate(data.born) || <span className="text-[var(--content-muted)]">Không có dữ liệu</span>}
              </Row>
              <Row {...row("death")} label="Ngày mất" disabled={!data.death}>
                {formatDate(data.death) || <span className="text-[var(--content-muted)]">Không có dữ liệu</span>}
              </Row>
              <Row {...row("image")} label="Ảnh nhân vật" disabled={!data.imageUrl}>
                {data.imageUrl ? (
                  <Image
                    src={data.imageUrl}
                    alt={data.title}
                    width={120}
                    height={160}
                    className="h-40 w-auto rounded-sm border border-[var(--card-light-border)] object-cover"
                  />
                ) : (
                  <span className="text-[var(--content-muted)]">Không có ảnh</span>
                )}
              </Row>
              <Row {...row("background")} label="Tiểu sử" disabled={!data.intro}>
                <StaffFormTextarea value={background} onChange={(e) => setBackground(e.target.value)} className="min-h-40" />
              </Row>
              <Row {...row("document")} label="Tài liệu RAG">
                Toàn bộ bài viết ({data.article.content.length.toLocaleString("vi-VN")} ký tự), có ghi nguồn. Xem và sửa ở tab Tài liệu.
              </Row>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-[var(--card-light-border)] pt-3">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Hủy
              </Button>
              <Button type="button" onClick={apply} disabled={!selectedCount}>
                Điền vào form ({selectedCount})
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
