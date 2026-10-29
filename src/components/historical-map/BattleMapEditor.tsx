"use client";

import { useEffect, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowLeftRight, ArrowUp, Clapperboard, Copy, Download, Eye, GripVertical, ImageIcon, Layers, ListTree, Loader2, MousePointerClick, MoveHorizontal, Plus, Redo2, RotateCw, Save, Shapes, Trash2, Undo2, Upload, Users, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { getApiErrorMessage } from "@/lib/utils/api-error";
import { battleMapImageService } from "@/services/media.service";
import { useAuthStore } from "@/store/auth.store";
import { BattleMapCanvas, SymbolGlyph, type SymbolView } from "./BattleMapCanvas";
import { BattlePreview } from "./BattlePreview";
import {
  autoEffect, defaultSymbolSize, isBattleMap, isLineSymbol, isNoteSymbol, moveSymbol, PHASE_NARRATION_MAX, SYMBOL_EFFECTS, SYMBOL_GROUPS, SYMBOL_LABELS, SYMBOL_SIZE_MAX, SYMBOL_SIZE_MIN, withPoints,
  type BattleMap, type BattlePhase, type BattleSymbol, type BattleSymbolType, type MapPoint, type SymbolEffect,
} from "./battle-map.types";
import { LINE_WEIGHT_MAX, LINE_WEIGHT_MIN } from "./battle-path";
import { sceneDurationMs, splitSentences } from "./useBattlePlayback";
import styles from "./battle-map-editor.module.css";

type Tab = "image" | "factions" | "symbols" | "phases";
const TABS: { id: Tab; label: string; icon: typeof ImageIcon }[] = [
  { id: "image", label: "Ảnh nền", icon: ImageIcon },
  { id: "factions", label: "Phe", icon: Users },
  { id: "symbols", label: "Ký hiệu", icon: Shapes },
  { id: "phases", label: "Diễn biến", icon: Clapperboard },
];

/** Single-key tool shortcuts (Shift + key keeps the tool for placing several symbols). */
const TOOL_KEYS: Record<string, BattleSymbolType> = {
  a: "arrow", f: "flank", m: "march", r: "retreat", l: "defenseLine", s: "stakes", p: "ambush",
  i: "infantry", k: "cavalry", w: "navy", h: "fort", b: "headquarters", x: "clash", v: "victory", t: "label", n: "step",
};
const KEY_OF = Object.fromEntries(Object.entries(TOOL_KEYS).map(([key, type]) => [type, key.toUpperCase()])) as Partial<Record<BattleSymbolType, string>>;

/** Short fingerprint of a saved map, to tell whether a local draft was based on it. */
const fingerprint = (text: string) => {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = (h * 33 + text.charCodeAt(i)) | 0;
  return `${text.length}:${h >>> 0}`;
};

/** New maps start with two editable sides so admins can place symbols right away. */
function withDefaultFactions(map: BattleMap): BattleMap {
  if (map.factions.length > 0) return map;
  return { ...map, factions: [
    { id: crypto.randomUUID(), name: "Quân ta", color: "#b91c1c" },
    { id: crypto.randomUUID(), name: "Quân địch", color: "#1d4ed8" },
  ] };
}

export function BattleMapEditor({ initialValue, title, onSave, onClose, legacyNarration = "", draftId }: {
  initialValue: BattleMap; title: string; onClose: () => void;
  /** Identifies the map for the unsaved draft kept in this browser (e.g. the event id); omit to keep no draft. */
  draftId?: string;
  /** Publishes the map to the server; rejects when the save failed. */
  onSave: (map: BattleMap) => Promise<void>;
  /** Narration from before phases existed (map pin description). Read-only: only seeds the first split. */
  legacyNarration?: string;
}) {
  const [start] = useState(() => withDefaultFactions(initialValue));
  /** The map plus its undo history. */
  const [doc, setDoc] = useState(() => ({ value: start, past: [] as BattleMap[], future: [] as BattleMap[], at: 0 }));
  const value = doc.value;
  /** Every edit goes through here; a burst of changes (a drag, typing a note) becomes one undo step. */
  const setValue = (next: (v: BattleMap) => BattleMap) => setDoc(d => {
    const v = next(d.value);
    if (v === d.value) return d;
    const now = Date.now();
    return { value: v, past: now - d.at > 600 ? [...d.past.slice(-99), d.value] : d.past, future: [], at: now };
  });
  const undo = () => setDoc(d => d.past.length ? { value: d.past[d.past.length - 1], past: d.past.slice(0, -1), future: [d.value, ...d.future], at: 0 } : d);
  const redo = () => setDoc(d => d.future.length ? { value: d.future[0], past: [...d.past, d.value], future: d.future.slice(1), at: 0 } : d);
  const [saved, setSaved] = useState(() => JSON.stringify(start));
  const uid = useAuthStore(state => state.user?.uid);
  const draftKey = draftId ? `historytalk:battle-map-draft:v2:${uid ?? "anonymous"}:${draftId}` : null;
  /** Unsaved work found in this browser from an earlier visit, waiting for "Khôi phục" / "Bỏ". */
  const [draft, setDraft] = useState<{ map: BattleMap; savedAt: number; stale: boolean } | null>(() => {
    if (!draftKey || typeof window === "undefined") return null;
    try {
      const raw = JSON.parse(localStorage.getItem(draftKey) ?? "null") as { map?: unknown; savedAt?: number; base?: string } | null;
      if (!raw || !isBattleMap(raw.map) || JSON.stringify(raw.map) === JSON.stringify(start)) return null;
      return { map: raw.map, savedAt: Number(raw.savedAt) || Date.now(), stale: raw.base !== fingerprint(JSON.stringify(start)) };
    } catch { return null; }
  });
  const [hasDraft, setHasDraft] = useState(!!initialValue.imageUrl);
  const [tab, setTab] = useState<Tab>(start.imageUrl ? "symbols" : "image");
  const [imageUrlInput, setImageUrlInput] = useState(start.imageUrl.startsWith("data:") ? "" : start.imageUrl);
  /** Selected symbols: one opens the inspector, several get the "move to phase" bar. */
  const [selection, setSelection] = useState<string[]>([]);
  const selectedId = selection.length === 1 ? selection[0] : null;
  const setSelectedId = (id: string | null) => setSelection(id ? [id] : []);
  const [placingType, setPlacingType] = useState<BattleSymbolType | null>(null);
  /** The tool stays on after placing (double-click a tool or Shift + its key). */
  const [toolLocked, setToolLocked] = useState(false);
  /** Symbol just placed: its note is typed right on the map. */
  const [quickLabel, setQuickLabel] = useState<string | null>(null);
  const pickTool = (type: BattleSymbolType | null, lock = false) => {
    setPlacingType(p => (type && p === type && !lock ? null : type));
    setToolLocked(!!type && lock);
  };
  const [factionId, setFactionId] = useState(start.factions[0]?.id ?? "");
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#15803d");
  const [error, setError] = useState("");
  const [clipboard, setClipboard] = useState<BattleSymbol | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  /** Phase that new symbols go into; null = background layer (always shown). */
  const [phaseId, setPhaseId] = useState<string | null>(start.phases?.[0]?.id ?? null);
  const [showPast, setShowPast] = useState(true);
  /** "Phân giai đoạn": every symbol shown with its phase number, for grouping after placing them all. */
  const [sorting, setSorting] = useState(false);
  /** List row being dragged, and where it would land (row id + side, or a phase button). */
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropAt, setDropAt] = useState<{ id: string; after: boolean } | null>(null);
  const [dropPhase, setDropPhase] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState(false);
  /** The camera frame of the active phase is being dragged on the map. */
  const [drawingFrame, setDrawingFrame] = useState(false);
  /** "Chạy thử" replays the appear effect of one symbol. */
  const [effectPreview, setEffectPreview] = useState<{ id: string; n: number } | null>(null);
  const selected = value.symbols.find(s => s.id === selectedId);
  const phases = value.phases ?? [];
  const activePhase = phases.find(p => p.id === phaseId) ?? null;
  const phaseIndexOf = (symbol: BattleSymbol) => symbol.phaseId ? phases.findIndex(p => p.id === symbol.phaseId) : -1;
  const activeFaction = value.factions.find(f => f.id === factionId);
  const mapDirty = JSON.stringify(value) !== saved;
  const dirty = mapDirty;
  const canSave = dirty && !!value.imageUrl.trim();
  const canDraw = value.mode === "custom" && !!value.imageUrl && !!activeFaction;

  const update = (patch: Partial<BattleMap>) => setValue(v => ({ ...v, ...patch }));
  const changeSymbol = (id: string, patch: Partial<BattleSymbol>) =>
    setValue(v => ({ ...v, symbols: v.symbols.map(s => s.id === id ? { ...s, ...patch } : s) }));
  const removeSymbols = (ids: string[]) => {
    update({ symbols: value.symbols.filter(s => !ids.includes(s.id)) });
    setSelection(sel => sel.filter(id => !ids.includes(id)));
  };
  const removeSymbol = (id: string) => removeSymbols(selection.length > 1 && selection.includes(id) ? selection : [id]);
  const selectSymbol = (id: string | null, additive = false) => {
    if (id && additive) { setSelection(sel => sel.includes(id) ? sel.filter(x => x !== id) : [...sel, id]); return; }
    setSelectedId(id);
    // Picking a faded symbol of another phase switches to that phase (in sorting mode everything is shown).
    const symbol = id ? value.symbols.find(s => s.id === id) : undefined;
    if (symbol && phases.length && !sorting) setPhaseId(phaseIndexOf(symbol) === -1 ? null : symbol.phaseId!);
  };
  const close = () => {
    if (dirty && !window.confirm("Bỏ các thay đổi chưa lưu trên lược đồ?")) return;
    try { if (draftKey && dirty) localStorage.removeItem(draftKey); } catch { /* storage unavailable */ }
    onClose();
  };

  // Keeps unsaved work in this browser, so a closed tab or an expired session loses nothing.
  useEffect(() => {
    if (!draftKey || draft) return; // a pending draft is kept until the admin restores or drops it
    const timer = window.setTimeout(() => {
      try {
        if (mapDirty) localStorage.setItem(draftKey, JSON.stringify({ map: value, savedAt: Date.now(), base: fingerprint(saved) }));
        else localStorage.removeItem(draftKey);
      } catch { /* storage full or unavailable */ }
    }, 800);
    return () => window.clearTimeout(timer);
  }, [draftKey, draft, value, saved, mapDirty]);

  useEffect(() => {
    const beforeUnload = (e: BeforeUnloadEvent) => { if (dirty) e.preventDefault(); };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [dirty]);

  const addSymbol = (type: BattleSymbolType, x = 50, y = 50, shape?: { points: MapPoint[] }) => {
    if (!canDraw) return;
    const id = crypto.randomUUID();
    // A new symbol reuses the note of the latest same-type symbol of this side, so a legend row covers them all.
    const sameKind = value.symbols.filter(s => s.type === type && s.factionId === factionId);
    const label = type === "label" ? "Chú thích" : type === "step" ? String(value.symbols.filter(s => s.type === "step").length + 1) : sameKind.at(-1)?.label ?? "";
    const symbol: BattleSymbol = { id, type, factionId, label, x, y, size: defaultSymbolSize(type), rotation: 0, ...(activePhase && { phaseId: activePhase.id }) };
    update({ symbols: [...value.symbols, shape ? withPoints(symbol, shape.points) : symbol] });
    // The new symbol stays selected so its handles can be dragged right away; its note is typed in place.
    setSelectedId(id);
    setQuickLabel(id);
    if (!toolLocked) setPlacingType(null);
  };

  const duplicate = (symbol: BattleSymbol) => {
    const id = crypto.randomUUID();
    const copy = {
      ...moveSymbol(symbol, Math.min(100, symbol.x + 3), Math.min(100, symbol.y + 3)), id,
      // A copied symbol whose side was deleted joins the side currently being drawn.
      factionId: value.factions.some(f => f.id === symbol.factionId) ? symbol.factionId : factionId,
    };
    if (!value.factions.some(f => f.id === copy.factionId)) return null;
    update({ symbols: [...value.symbols, copy] });
    setSelectedId(id);
    return copy;
  };

  // ── Phases ──
  const changePhase = (id: string, patch: Partial<BattlePhase>) => update({ phases: phases.map(p => p.id === id ? { ...p, ...patch } : p) });
  const newPhase = (): BattlePhase => ({ id: crypto.randomUUID(), title: `Giai đoạn ${phases.length + 1}`, narration: "", camera: "auto" });
  const addPhase = () => {
    const phase = newPhase();
    update({ phases: [...phases, phase] });
    setPhaseId(phase.id); setSelectedId(null);
  };
  /** Moves symbols into a phase (null = background, "new" = a phase created for them). */
  const assignPhase = (ids: string[], target: string | null | "new") => {
    if (!ids.length) return;
    const created = target === "new" ? newPhase() : null;
    const id = created ? created.id : target;
    update({
      ...(created && { phases: [...phases, created] }),
      symbols: value.symbols.map(s => ids.includes(s.id) ? { ...s, phaseId: id ?? undefined } : s),
    });
    setSelection([]);
    // Follow the symbols so they stay visible, unless every phase is already shown.
    if (!sorting || created) setPhaseId(id);
  };
  /** Moves a symbol before/after another one: within a phase, array order is appear order. */
  const reorder = (id: string, targetId: string, after: boolean) => {
    if (id === targetId) return;
    const moving = value.symbols.find(s => s.id === id);
    if (!moving) return;
    const rest = value.symbols.filter(s => s.id !== id);
    const at = rest.findIndex(s => s.id === targetId) + (after ? 1 : 0);
    update({ symbols: [...rest.slice(0, at), moving, ...rest.slice(at)] });
  };
  /** Phase buttons accept list rows dropped on them (the whole selection when the row is part of it). */
  const phaseDropProps = (target: string | null) => {
    const key = target ?? "base";
    return {
      "data-drop-target": dropPhase === key || undefined,
      onDragOver: (e: React.DragEvent) => { if (!dragId) return; e.preventDefault(); setDropPhase(key); },
      onDragLeave: () => setDropPhase(p => (p === key ? null : p)),
      onDrop: (e: React.DragEvent) => {
        e.preventDefault();
        if (dragId) assignPhase(selection.includes(dragId) ? selection : [dragId], target);
        setDragId(null); setDropAt(null); setDropPhase(null);
      },
    };
  };
  const movePhase = (id: string, dir: -1 | 1) => {
    const i = phases.findIndex(p => p.id === id), j = i + dir;
    if (i < 0 || j < 0 || j >= phases.length) return;
    const next = [...phases]; [next[i], next[j]] = [next[j], next[i]];
    update({ phases: next });
  };
  const removePhase = (phase: BattlePhase) => {
    const count = value.symbols.filter(s => s.phaseId === phase.id).length;
    if (count > 0 && !window.confirm(`Xóa giai đoạn «${phase.title}» và ${count} ký hiệu thuộc giai đoạn này?`)) return;
    const i = phases.indexOf(phase);
    const next = phases.filter(p => p !== phase);
    update({ phases: next, symbols: value.symbols.filter(s => s.phaseId !== phase.id) });
    setPhaseId(next[Math.max(0, i - 1)]?.id ?? null); setSelectedId(null);
  };
  /** First split of a legacy map: every paragraph of the narration becomes a phase. */
  const splitIntoPhases = () => {
    const paragraphs = legacyNarration.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
    const next: BattlePhase[] = (paragraphs.length ? paragraphs : [""]).map((part, i) => ({
      id: crypto.randomUUID(), title: `Giai đoạn ${i + 1}`, narration: part.slice(0, PHASE_NARRATION_MAX), camera: "auto",
    }));
    update({ phases: next });
    setPhaseId(next[0].id);
    setTab("symbols");
  };
  const activeIndex = activePhase ? phases.indexOf(activePhase) : -1;
  // Onion skin: the phase being edited is solid, earlier phases faint, later ones hidden (toggles).
  const symbolView = phases.length === 0 ? undefined : (s: BattleSymbol): SymbolView => {
    const i = phaseIndexOf(s);
    const enter = effectPreview?.id === s.id ? { delay: 0, key: String(effectPreview.n) } : undefined;
    if (sorting || i === -1 || i === activeIndex) return { enter };
    if (activeIndex === -1) return { dim: true };
    return i < activeIndex && showPast ? { dim: true } : { hidden: true };
  };
  const listedSymbols = phases.length ? value.symbols.filter(s => phaseIndexOf(s) === activeIndex) : value.symbols;
  const phaseBadge = sorting ? (s: BattleSymbol) => { const i = phaseIndexOf(s); return i === -1 ? undefined : String(i + 1); } : undefined;
  const pickPhase = (id: string | null) => { setPhaseId(id); setSelectedId(null); setDrawingFrame(false); };
  const setCamera = (phase: BattlePhase, camera: BattlePhase["camera"]) => {
    changePhase(phase.id, { camera });
    // Picking "Khung" without a frame yet goes straight to drawing one.
    setDrawingFrame(camera === "frame" && !phase.focus);
    if (camera === "frame") { setPlacingType(null); setSelectedId(null); }
  };

  // Esc steps back; Ctrl+C / Ctrl+V copy-paste, Ctrl+D duplicate, Delete removes — ignored while typing in a field.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Escape works wherever focus is (clicking the image leaves focus on <body>).
      if (e.key === "Escape") {
        e.preventDefault();
        if (drawingFrame) setDrawingFrame(false);
        else if (placingType) pickTool(null);
        else if (selection.length) setSelection([]);
        else close();
        return;
      }
      if (e.defaultPrevented || value.mode !== "custom") return;
      const target = e.target as HTMLElement;
      if (target.closest("input, textarea, select, [contenteditable=true]")) return;
      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();
      if (mod && (key === "z" || key === "y")) { e.preventDefault(); if (key === "y" || e.shiftKey) redo(); else undo(); }
      else if (!mod && !e.altKey && TOOL_KEYS[key] && canDraw) { e.preventDefault(); setDrawingFrame(false); pickTool(TOOL_KEYS[key], e.shiftKey); }
      // Q switches the side being drawn.
      else if (!mod && !e.altKey && key === "q" && value.factions.length > 1) {
        e.preventDefault();
        const i = value.factions.findIndex(f => f.id === factionId);
        setFactionId(value.factions[(i + 1) % value.factions.length].id);
      }
      else if (mod && key === "c" && selected) { e.preventDefault(); setClipboard(selected); }
      else if (mod && key === "v" && clipboard) { e.preventDefault(); const pasted = duplicate(clipboard); if (pasted) setClipboard(pasted); }
      else if (mod && key === "d" && selected) { e.preventDefault(); duplicate(selected); }
      else if ((e.key === "Delete" || e.key === "Backspace") && selection.length) { e.preventDefault(); removeSymbols(selection); }
      // 1–9 moves the selection into that phase, 0 back to the background layer.
      else if (/^[0-9]$/.test(e.key) && !mod && !e.altKey && selection.length && phases.length) {
        const n = Number(e.key);
        if (n === 0 || phases[n - 1]) { e.preventDefault(); assignPhase(selection, n === 0 ? null : phases[n - 1].id); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const uploadImage = async (file: File) => {
    setUploading(true);
    setError("");
    try {
      const imageUrl = await battleMapImageService.upload(file);
      update({ imageUrl });
      setImageUrlInput(imageUrl);
      return imageUrl;
    } catch (err) {
      setError(getApiErrorMessage(err, "Không tải được ảnh lên. Vui lòng thử lại."));
      return null;
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (value.factions.some(f => !f.name.trim())) { setTab("factions"); setError("Điền tên cho tất cả các phe trước khi lưu."); return false; }
    setSaving(true);
    setError("");
    try {
      if (mapDirty) {
        let map = value;
        // Drafts from the old browser-only editor embed the image as a data URL; upload it before publishing.
        if (map.imageUrl.startsWith("data:")) {
          const blob = await (await fetch(map.imageUrl)).blob();
          const ext = blob.type.split("/")[1]?.replace("jpeg", "jpg") ?? "png";
          const imageUrl = await uploadImage(new File([blob], `battle-map.${ext}`, { type: blob.type }));
          if (!imageUrl) return false;
          map = { ...map, imageUrl };
        }
        await onSave(map);
        setSaved(JSON.stringify(map)); setHasDraft(true);
      }
      return true;
    } catch (err) {
      setError(getApiErrorMessage(err, "Không lưu được lược đồ. Hãy thử lại hoặc xuất JSON để giữ thiết kế."));
      return false;
    } finally {
      setSaving(false);
    }
  };
  const busy = saving || uploading;

  const exportMap = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify({ battleMap: value }, null, 2)], { type: "application/json" }));
    const link = document.createElement("a"); link.href = url; link.download = "battle-map.json"; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const applyImageUrl = () => {
    const url = imageUrlInput.trim();
    if (url && !/^https?:\/\//i.test(url) && !url.startsWith("/")) { setError("Dùng đường dẫn ảnh bắt đầu bằng https:// hoặc http://."); return; }
    setError(""); update({ imageUrl: url });
  };

  return <section className={styles.editor} aria-label="Chỉnh sửa lược đồ trận đánh">
    <header className={styles.header}>
      <button type="button" autoFocus onClick={close} aria-label="Quay lại" title="Quay lại"><ArrowLeft size={18} /></button>
      <div className={styles.headerTitle}>
        <h1>Chỉnh sửa lược đồ trận đánh</h1>
        <p>{title}</p>
      </div>
      <span className={cn(styles.saveState, dirty && styles.saveStateDirty)} role="status" title="Lược đồ đã lưu sẽ hiển thị cho người học ở trang trận đánh.">
        {saving ? "Đang lưu…" : uploading ? "Đang tải ảnh lên…" : dirty ? "Có thay đổi chưa lưu" : hasDraft ? "Đã lưu" : "Chưa có lược đồ"}
      </span>
      <button type="button" onClick={undo} disabled={!doc.past.length} aria-label="Hoàn tác" title="Hoàn tác (Ctrl+Z)"><Undo2 size={16} /></button>
      <button type="button" onClick={redo} disabled={!doc.future.length} aria-label="Làm lại" title="Làm lại (Ctrl+Shift+Z)"><Redo2 size={16} /></button>
      <button type="button" onClick={exportMap} aria-label="Xuất JSON" title="Tải thiết kế dưới dạng JSON"><Download size={16} /><span>Xuất JSON</span></button>
      <button type="button" aria-label="Xem trước" title="Phát thử như người học sẽ xem (không lưu)" disabled={!value.imageUrl.trim()}
        onClick={() => { pickTool(null); setSelectedId(null); setDrawingFrame(false); setPreviewing(true); }}><Eye size={16} /><span>Xem trước</span></button>
      <button type="button" className={styles.primary} aria-label="Lưu lược đồ" disabled={!canSave || busy} onClick={() => void save()}>{saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}<span>Lưu</span></button>
    </header>

    {previewing && <BattlePreview value={value} title={title} legacyNarration={legacyNarration}
      startScene={Math.max(0, activeIndex)} onClose={() => setPreviewing(false)} />}

    <div className={styles.layout}>
      <aside className={styles.settings}>
        <div className={styles.tabs} role="tablist" aria-label="Nhóm thiết lập">
          {TABS.map(t => <button key={t.id} type="button" role="tab" id={`map-tab-${t.id}`} aria-selected={tab === t.id} aria-controls="map-tab-panel"
            className={cn(styles.tab, tab === t.id && styles.tabActive)} onClick={() => setTab(t.id)}>
            <t.icon size={16} />{t.label}
          </button>)}
        </div>

        <div className={styles.tabPanel} role="tabpanel" id="map-tab-panel" aria-labelledby={`map-tab-${tab}`}>
          {tab === "image" && <>
            <div className={styles.group}>
              <h2>Kiểu lược đồ</h2>
              <div className={styles.modeCards}>
                <label className={cn(styles.modeCard, value.mode === "custom" && styles.modeCardActive)}>
                  <input type="radio" name="mapMode" checked={value.mode === "custom"} onChange={() => update({ mode: "custom" })} />
                  <strong>Ảnh nền + tự vẽ ký hiệu</strong>
                  <span>Dùng ảnh nền trống, tự thêm hướng tiến quân, lực lượng, chú thích.</span>
                </label>
                <label className={cn(styles.modeCard, value.mode === "image" && styles.modeCardActive)}>
                  <input type="radio" name="mapMode" checked={value.mode === "image"} onChange={() => update({ mode: "image" })} />
                  <strong>Ảnh đã vẽ sẵn ký hiệu</strong>
                  <span>Hiển thị nguyên ảnh. Ký hiệu đã vẽ vẫn được giữ lại.</span>
                </label>
              </div>
            </div>

            <div className={styles.group}>
              <h2>Ảnh nền</h2>
              <label className={styles.field}>Đường dẫn ảnh
                <span className={styles.inline}>
                  <input type="url" value={imageUrlInput} placeholder="https://…/luoc-do.jpg" onChange={e => setImageUrlInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); applyImageUrl(); } }} />
                  <button type="button" onClick={applyImageUrl} disabled={!imageUrlInput.trim()}>Áp dụng</button>
                </span>
              </label>
              <div className={styles.divider}><span>hoặc</span></div>
              <label className={styles.upload}>
                {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                <span><strong>{uploading ? "Đang tải ảnh lên…" : "Tải ảnh từ máy"}</strong><small>PNG, JPG, WebP · tối đa 2 MB</small></span>
                <input type="file" accept="image/png,image/jpeg,image/webp" disabled={uploading} onChange={e => {
                  const file = e.target.files?.[0]; e.target.value = ""; if (!file) return;
                  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 2 * 1024 * 1024) { setError("Chọn ảnh PNG, JPG hoặc WebP không quá 2 MB."); return; }
                  void uploadImage(file);
                }} />
              </label>
              <label className={styles.field}>Nguồn ảnh (ghi công)
                <input value={value.imageSource} maxLength={500} onChange={e => update({ imageSource: e.target.value })} placeholder="Ví dụ: Bảo tàng Lịch sử Quốc gia" />
              </label>
            </div>
            {value.imageUrl && value.mode === "custom" && <button type="button" className={styles.nextStep} onClick={() => setTab("symbols")}>Tiếp theo: đặt ký hiệu →</button>}
          </>}

          {tab === "factions" && <div className={styles.group}>
            <h2>Các phe tham chiến</h2>
            <p className={styles.hint}>Mỗi phe một màu. Ký hiệu sẽ tô theo màu phe và hiện trong chú giải.</p>
            <ul className={styles.factionList}>
              {value.factions.map(f => {
                const count = value.symbols.filter(s => s.factionId === f.id).length;
                return <li className={styles.factionRow} key={f.id}>
                  <input type="color" aria-label={`Màu của ${f.name}`} value={f.color} onChange={e => update({ factions: value.factions.map(item => item.id === f.id ? { ...item, color: e.target.value } : item) })} />
                  <input aria-label={`Tên phe ${f.name}`} value={f.name} maxLength={80} placeholder="Tên phe" onChange={e => update({ factions: value.factions.map(item => item.id === f.id ? { ...item, name: e.target.value } : item) })} />
                  <small title="Số ký hiệu của phe này">{count}</small>
                  <button type="button" className={styles.iconButton} aria-label={`Xóa phe ${f.name}`} title="Xóa phe" onClick={() => {
                    if (count > 0 && !window.confirm(`Xóa ${f.name} và ${count} ký hiệu thuộc phe này?`)) return;
                    const factions = value.factions.filter(item => item.id !== f.id);
                    update({ factions, symbols: value.symbols.filter(s => s.factionId !== f.id) });
                    if (factionId === f.id) setFactionId(factions[0]?.id ?? "");
                  }}><Trash2 size={15} /></button>
                </li>;
              })}
            </ul>
            <form className={styles.factionRow} onSubmit={e => {
              e.preventDefault(); if (!newName.trim()) return;
              const id = crypto.randomUUID(); update({ factions: [...value.factions, { id, name: newName.trim(), color: newColor }] }); setFactionId(id); setNewName("");
            }}>
              <input type="color" aria-label="Màu phe mới" value={newColor} onChange={e => setNewColor(e.target.value)} />
              <input aria-label="Tên phe mới" placeholder="Thêm phe, ví dụ: Quân Nguyên" value={newName} maxLength={80} onChange={e => setNewName(e.target.value)} />
              <button type="submit" className={styles.iconButton} aria-label="Thêm phe" title="Thêm phe" disabled={!newName.trim()}><Plus size={18} /></button>
            </form>
          </div>}

          {tab === "phases" && phases.length > 0 && <div className={styles.group}>
            <h2>Các giai đoạn</h2>
            <p className={styles.hint}><Clapperboard size={14} /> Chọn giai đoạn để đặt ký hiệu. Tên và lời thuyết minh sửa ở cột bên phải.</p>
            <ol className={styles.phaseList}>
              {phases.map((p, i) => <li key={p.id} className={cn(styles.phaseCard, p.id === phaseId && styles.phaseCardActive)}>
                <button type="button" className={styles.phaseHead} aria-pressed={p.id === phaseId} onClick={() => pickPhase(p.id)}>
                  <b className={styles.phaseNum}>{i + 1}</b>
                  <span><strong>{p.title || "Chưa đặt tên"}</strong>
                    <small>{value.symbols.filter(x => x.phaseId === p.id).length} ký hiệu · ≈ {Math.round(sceneDurationMs(p.narration) / 1000)} giây</small></span>
                </button>
              </li>)}
            </ol>
            <button type="button" onClick={addPhase}><Plus size={16} />Thêm giai đoạn</button>
          </div>}

          {tab === "phases" && phases.length === 0 && <div className={styles.group}>
            <h2>Diễn biến theo giai đoạn</h2>
            <div className={styles.callout}>
              <span>Chia trận đánh thành các giai đoạn: mỗi giai đoạn có lời thuyết minh riêng, và ký hiệu của giai đoạn đó hiện dần khi giọng đọc tới.</span>
              <button type="button" className={styles.nextStep} onClick={splitIntoPhases}><Clapperboard size={16} />{legacyNarration.trim() ? "Chia thành giai đoạn" : "Tạo giai đoạn đầu tiên"}</button>
              <small>{legacyNarration.trim() ? "Mỗi đoạn văn của thuyết minh cũ bên dưới sẽ thành một giai đoạn." : "Lời thuyết minh viết ở cột bên phải."} Ký hiệu đã đặt giữ nguyên ở lớp «Luôn hiện».</small>
            </div>
            {legacyNarration.trim() && <div className={styles.group}>
              <h2>Thuyết minh cũ</h2>
              <p className={styles.legacyNarration}>{legacyNarration}</p>
              <small className={styles.fieldHint}>Đang được đọc ở trang trận đánh cho tới khi bạn chia giai đoạn và lưu.</small>
            </div>}
          </div>}

          {tab === "symbols" && <>
            {!value.imageUrl ? <div className={styles.callout}>
              Cần có ảnh nền trước khi đặt ký hiệu.
              <button type="button" onClick={() => setTab("image")}>Thêm ảnh nền</button>
            </div> : value.mode === "image" ? <div className={styles.callout}>
              Đang dùng ảnh đã vẽ sẵn ký hiệu nên lớp tự vẽ đang ẩn.
              <button type="button" onClick={() => update({ mode: "custom" })}>Chuyển sang tự vẽ</button>
            </div> : <>
              <div className={styles.group}>
                <h2>Vẽ cho phe</h2>
                <div className={styles.chips} role="radiogroup" aria-label="Phe cho ký hiệu mới">
                  {value.factions.map(f => <button key={f.id} type="button" role="radio" aria-checked={factionId === f.id}
                    className={cn(styles.chip, factionId === f.id && styles.chipActive)} style={{ "--chip": f.color } as React.CSSProperties}
                    onClick={() => setFactionId(f.id)}><i />{f.name || "Chưa đặt tên"}</button>)}
                  <button type="button" className={styles.chip} onClick={() => setTab("factions")}><Plus size={14} />Phe</button>
                </div>
              </div>
              <p className={styles.hint}><MousePointerClick size={14} /> Chọn ký hiệu rồi bấm lên lược đồ để đặt. Với mũi tên và phòng tuyến: nhấn giữ rồi kéo theo đường đi để vẽ, đường sẽ tự làm mượt.</p>
              {/* .hint is a flex row (icon + text): the text needs one wrapper or every word and <kbd> becomes its own column. */}
                <p className={styles.hint}><span>Bấm đúp vào ký hiệu (hoặc <kbd>Shift</kbd> + phím tắt) để đặt liên tục, <kbd>Esc</kbd> để thôi · <kbd>Q</kbd> đổi phe · <kbd>Ctrl</kbd> + <kbd>Z</kbd> hoàn tác.</span></p>
              {SYMBOL_GROUPS.map(group => <div className={styles.group} key={group.title}>
                <h2>{group.title}</h2>
                <div className={styles.tools} style={{ color: activeFaction?.color }}>
                  {group.types.map(type => <button key={type} type="button" disabled={!canDraw} draggable={canDraw} aria-pressed={placingType === type}
                    className={cn(placingType === type && styles.toolActive)} data-locked={placingType === type && toolLocked || undefined}
                    title={`${SYMBOL_LABELS[type]}${KEY_OF[type] ? ` (phím ${KEY_OF[type]})` : ""} · bấm đúp để đặt liên tục`}
                    onDragStart={e => { e.dataTransfer.setData("application/x-battle-symbol", type); e.dataTransfer.effectAllowed = "copy"; }}
                    onClick={() => pickTool(type)} onDoubleClick={() => pickTool(type, true)}>
                    {KEY_OF[type] && <kbd className={styles.toolKey} aria-hidden="true">{KEY_OF[type]}</kbd>}
                    <SymbolGlyph type={type} /><span>{SYMBOL_LABELS[type]}</span>
                  </button>)}
                </div>
              </div>)}
            </>}
          </>}
        </div>
      </aside>

      <main className={styles.workspace}>
        {draft && <div className={styles.draftBanner} role="status">
          <span>Có bản nháp chưa lưu trên máy này ({new Date(draft.savedAt).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}).
            {draft.stale && " Lược đồ đã được lưu lại sau thời điểm đó, khôi phục sẽ ghi đè bản mới hơn."}</span>
          <button type="button" onClick={() => { const map = draft.map; setValue(() => map); setDraft(null); }}>Khôi phục</button>
          <button type="button" onClick={() => setDraft(null)}>Bỏ bản nháp</button>
        </div>}
        {error && <p className={styles.error} role="alert">{error}<button type="button" aria-label="Đóng thông báo" onClick={() => setError("")}><X size={14} /></button></p>}
        {phases.length > 0 && <div className={styles.phaseBar}>
          <div className={styles.phaseSteps} role="group" aria-label="Giai đoạn đang soạn">
            <button type="button" className={styles.phaseStepWide} aria-pressed={!activePhase} title="Ký hiệu hiện suốt trận (địa danh, thành lũy…)" onClick={() => pickPhase(null)} {...phaseDropProps(null)}>Luôn hiện</button>
            {phases.map((p, i) => <button key={p.id} type="button" aria-pressed={p.id === phaseId} aria-label={`Giai đoạn ${i + 1}: ${p.title}`} title={p.title}
              onClick={() => pickPhase(p.id)} {...phaseDropProps(p.id)}>{i + 1}</button>)}
            <button type="button" aria-label="Thêm giai đoạn" title="Thêm giai đoạn" onClick={addPhase}><Plus size={15} /></button>
          </div>
          <strong className={styles.phaseCurrent}>{activePhase ? activePhase.title || "Chưa đặt tên" : "Lớp luôn hiện"}</strong>
          {drawingFrame && <span className={styles.drawHint}>Kéo trên lược đồ để khoanh vùng camera · Esc để hủy</span>}
          {value.mode === "custom" && <button type="button" className={styles.sortToggle} aria-pressed={sorting} title="Hiện mọi ký hiệu kèm số giai đoạn để gom nhóm"
            onClick={() => { setSorting(s => !s); setDrawingFrame(false); }}><ListTree size={15} />Phân giai đoạn</button>}
          {!drawingFrame && !sorting && value.mode === "custom" && activePhase && activeIndex > 0 && <label className={styles.phaseToggle}><input type="checkbox" checked={showPast} onChange={e => setShowPast(e.target.checked)} />Hiện mờ giai đoạn trước</label>}
        </div>}
        {sorting && <p className={styles.sortHint}>Chọn ký hiệu (giữ <kbd>Shift</kbd> để chọn thêm, hoặc kéo khung trên vùng trống), rồi bấm phím <kbd>1</kbd>–<kbd>9</kbd> để đưa vào giai đoạn, <kbd>0</kbd> để đưa về «Luôn hiện».</p>}
        <BattleMapCanvas value={value} title={title} selectedId={selectedId} selectedIds={selection} placingType={placingType} placingColor={activeFaction?.color}
          symbolView={symbolView} phaseBadge={phaseBadge}
          onMarquee={value.mode === "custom" ? (ids, additive) => setSelection(sel => additive ? [...new Set([...sel, ...ids])] : ids) : undefined}
          cameraFrame={activePhase?.camera === "frame" ? activePhase.focus ?? null : null}
          onDrawFrame={drawingFrame && activePhase ? rect => {
            changePhase(activePhase.id, { camera: "frame", focus: rect });
            setDrawingFrame(false);
          } : undefined}
          onSelect={value.mode === "custom" ? selectSymbol : undefined} onMove={(id, x, y) => setValue(v => ({ ...v, symbols: v.symbols.map(s => s.id === id ? moveSymbol(s, x, y) : s) }))}
          onPointsChange={(id, points) => setValue(v => ({ ...v, symbols: v.symbols.map(s => s.id === id ? withPoints(s, points) : s) }))}
          onTransform={(id, patch) => changeSymbol(id, patch)}
          onAdd={addSymbol} onDelete={removeSymbol} legendTitle={title}
          quickLabel={quickLabel && value.symbols.some(s => s.id === quickLabel) ? {
            id: quickLabel, onChange: label => changeSymbol(quickLabel, { label }), onDone: () => setQuickLabel(null),
          } : undefined} />
      </main>

      <aside className={styles.inspector} aria-label={selection.length > 1 ? "Ký hiệu đã chọn" : selected ? "Chỉnh ký hiệu" : activePhase ? "Chỉnh giai đoạn" : "Danh sách ký hiệu"}>
        {selection.length > 1 ? <>
          <div className={styles.inspectorHead}>
            <Layers size={17} />
            <h2>Đã chọn {selection.length} ký hiệu</h2>
            <button type="button" className={styles.iconButton} aria-label="Bỏ chọn" title="Bỏ chọn (Esc)" onClick={() => setSelection([])}><X size={16} /></button>
          </div>
          <div className={styles.field}>Chuyển vào giai đoạn
            <div className={styles.phaseSteps} role="group" aria-label="Chuyển các ký hiệu đã chọn vào">
              <button type="button" className={styles.phaseStepWide} onClick={() => assignPhase(selection, null)}>Luôn hiện</button>
              {phases.map((p, i) => <button key={p.id} type="button" title={p.title} onClick={() => assignPhase(selection, p.id)}>{i + 1}</button>)}
              <button type="button" className={styles.phaseStepWide} onClick={() => assignPhase(selection, "new")}><Plus size={14} />Giai đoạn mới</button>
            </div>
          </div>
          {phases.length > 0 && <p className={styles.hint}><span>Hoặc bấm phím <kbd>1</kbd>–<kbd>{Math.min(9, phases.length)}</kbd>, phím <kbd>0</kbd> để đưa về «Luôn hiện».</span></p>}
          <ul className={styles.layerList}>
            {value.symbols.filter(s => selection.includes(s.id)).map(s => {
              const faction = value.factions.find(f => f.id === s.factionId);
              const i = phaseIndexOf(s);
              return <li key={s.id}>
                <button type="button" onClick={() => selectSymbol(s.id)}>
                  <span className={styles.layerGlyph} style={{ color: faction?.color }}><SymbolGlyph type={s.type} text={s.label} /></span>
                  <span className={styles.layerText}><strong>{s.label || SYMBOL_LABELS[s.type]}</strong><small>{i === -1 ? "Luôn hiện" : `Giai đoạn ${i + 1}`} · {faction?.name}</small></span>
                </button>
                <button type="button" className={styles.iconButton} aria-label="Bỏ khỏi lựa chọn" title="Bỏ khỏi lựa chọn" onClick={() => selectSymbol(s.id, true)}><X size={14} /></button>
              </li>;
            })}
          </ul>
          <button type="button" className={styles.delete} onClick={() => removeSymbols(selection)}><Trash2 size={15} />Xóa {selection.length} ký hiệu</button>
        </> : selected ? <>
          <div className={styles.inspectorHead}>
            <span className={styles.inspectorGlyph} style={{ color: value.factions.find(f => f.id === selected.factionId)?.color }}><SymbolGlyph type={selected.type} text={selected.label} /></span>
            <h2>{SYMBOL_LABELS[selected.type]}</h2>
            <button type="button" className={styles.iconButton} aria-label="Bỏ chọn" title="Bỏ chọn (Esc)" onClick={() => setSelectedId(null)}><X size={16} /></button>
          </div>
          <label className={styles.field}>
            {selected.type === "step" ? "Số / ký tự trong vòng tròn" : selected.type === "label" ? "Nội dung chữ trên lược đồ" : "Ghi chú"}
            <input value={selected.label} maxLength={selected.type === "step" ? 3 : 120}
              placeholder={selected.type === "step" ? "1" : selected.type === "label" ? "Ví dụ: Sông Bạch Đằng" : "Ví dụ: Quân Nguyên rút chạy"}
              aria-describedby={isNoteSymbol(selected.type) ? "symbol-note-hint" : undefined}
              onChange={e => changeSymbol(selected.id, { label: e.target.value })} />
          </label>
          {isNoteSymbol(selected.type) && <small id="symbol-note-hint" className={styles.fieldHint}>Hiện trong bảng chú giải và khi rê chuột vào ký hiệu.</small>}
          {isNoteSymbol(selected.type) && (() => {
            const others = value.symbols.filter(s => s.id !== selected.id && s.type === selected.type && s.factionId === selected.factionId && s.label !== selected.label);
            return others.length > 0 && <button type="button" className={styles.applyAll}
              onClick={() => update({ symbols: value.symbols.map(s => others.some(o => o.id === s.id) ? { ...s, label: selected.label } : s) })}>
              Dùng ghi chú này cho {others.length} ký hiệu {SYMBOL_LABELS[selected.type].toLowerCase()} khác của phe này
            </button>;
          })()}
          <div className={styles.field}>Thuộc phe
            <div className={styles.chips} role="radiogroup" aria-label="Thuộc phe">
              {value.factions.map(f => <button key={f.id} type="button" role="radio" aria-checked={selected.factionId === f.id}
                className={cn(styles.chip, selected.factionId === f.id && styles.chipActive)} style={{ "--chip": f.color } as React.CSSProperties}
                onClick={() => changeSymbol(selected.id, { factionId: f.id })}><i />{f.name || "Chưa đặt tên"}</button>)}
            </div>
          </div>
          {phases.length > 0 && <>
            <label className={styles.field}>Xuất hiện ở
              <select value={phaseIndexOf(selected) === -1 ? "" : selected.phaseId} onChange={e => {
                const next = e.target.value || null;
                changeSymbol(selected.id, { phaseId: next ?? undefined }); setPhaseId(next);
              }}>
                <option value="">Luôn hiện</option>
                {phases.map((p, i) => <option key={p.id} value={p.id}>{i + 1}. {p.title || "Chưa đặt tên"}</option>)}
              </select>
            </label>
            <small className={styles.fieldHint}>Phím tắt: <kbd>1</kbd>–<kbd>9</kbd> chuyển giai đoạn, <kbd>0</kbd> về «Luôn hiện».</small>
            <div className={styles.field}>Hiệu ứng xuất hiện
              <span className={styles.inline}>
                <select value={selected.effect ?? "auto"} onChange={e => {
                  changeSymbol(selected.id, { effect: e.target.value as SymbolEffect });
                  setEffectPreview(p => ({ id: selected.id, n: (p?.n ?? 0) + 1 }));
                }}>
                  {(Object.keys(SYMBOL_EFFECTS) as SymbolEffect[]).map(fx => <option key={fx} value={fx}>
                    {fx === "auto" ? `Tự động (${SYMBOL_EFFECTS[autoEffect(selected.type)].toLowerCase()})` : SYMBOL_EFFECTS[fx]}</option>)}
                </select>
                <button type="button" onClick={() => setEffectPreview(p => ({ id: selected.id, n: (p?.n ?? 0) + 1 }))}>Chạy thử</button>
              </span>
            </div>
          </>}
          {isLineSymbol(selected.type) ? <>
            <label className={styles.field}>
              <span className={styles.fieldRow}>Độ đậm nét <output>{Math.round((selected.weight ?? 1) * 100)}%</output></span>
              <input type="range" min={LINE_WEIGHT_MIN} max={LINE_WEIGHT_MAX} step=".1" value={selected.weight ?? 1}
                onChange={e => changeSymbol(selected.id, { weight: Number(e.target.value) === 1 ? undefined : Number(e.target.value) })} />
            </label>
            <button type="button" className={styles.applyAll} onClick={() => changeSymbol(selected.id, selected.points
              ? { points: [...selected.points].reverse() } : { rotation: (selected.rotation + 180) % 360 })}>
              <ArrowLeftRight size={15} />Đảo chiều
            </button>
          </> : <>
            <label className={styles.field}>
              <span className={styles.fieldRow}>Hướng xoay <output>{selected.rotation}°</output></span>
              <input type="range" min="0" max="359" value={selected.rotation} onChange={e => changeSymbol(selected.id, { rotation: Number(e.target.value) })} />
            </label>
            <div className={styles.quickRotate} aria-label="Xoay nhanh">
              {[0, 90, 180, 270].map(deg => <button key={deg} type="button" aria-pressed={selected.rotation === deg} onClick={() => changeSymbol(selected.id, { rotation: deg })}>
                {({ 0: "→", 90: "↓", 180: "←", 270: "↑" } as Record<number, string>)[deg]}
              </button>)}
            </div>
            <label className={styles.field}>
              <span className={styles.fieldRow}>Kích thước <output>{selected.size}%</output></span>
              <input type="range" min={SYMBOL_SIZE_MIN} max={SYMBOL_SIZE_MAX} value={selected.size} onChange={e => changeSymbol(selected.id, { size: Number(e.target.value) })} />
            </label>
          </>}
          <ul className={styles.shortcuts}>
            <li><span>Di chuyển</span><em>Kéo ký hiệu, hoặc phím mũi tên</em></li>
            {isLineSymbol(selected.type) ? <>
              <li><span>Uốn đường</span><em>Kéo các điểm tròn trên đường · kéo điểm nhỏ ở giữa để thêm điểm uốn</em></li>
              <li><span>Bỏ điểm uốn</span><em>Nhấp đúp vào điểm tròn</em></li>
            </> : <>
              <li><span>Xoay</span><em>Kéo nút <RotateCw size={13} /> phía trên ký hiệu · giữ Shift để xoay từng 15°</em></li>
              <li><span>Kích thước</span><em>Kéo nút <MoveHorizontal size={13} /> bên cạnh ký hiệu</em></li>
            </>}
            <li><span>Nhân bản</span><em><kbd>Ctrl</kbd> + <kbd>C</kbd> rồi <kbd>Ctrl</kbd> + <kbd>V</kbd>, hoặc <kbd>Ctrl</kbd> + <kbd>D</kbd></em></li>
            <li><span>Xóa</span><em><kbd>Delete</kbd></em></li>
          </ul>
          <div className={styles.inspectorActions}>
            <button type="button" title="Nhân bản (Ctrl+D)" onClick={() => duplicate(selected)}><Copy size={15} />Nhân bản</button>
            <button type="button" className={styles.delete} title="Xóa (Delete)" onClick={() => removeSymbol(selected.id)}><Trash2 size={15} />Xóa ký hiệu</button>
          </div>
        </> : <>
          {activePhase && <>
            <div className={styles.inspectorHead}>
              <b className={styles.phaseNum}>{activeIndex + 1}</b>
              <h2>Giai đoạn {activeIndex + 1} / {phases.length}</h2>
              <button type="button" className={styles.iconButton} aria-label="Đưa giai đoạn lên trước" title="Lên trước" disabled={activeIndex === 0} onClick={() => movePhase(activePhase.id, -1)}><ArrowUp size={15} /></button>
              <button type="button" className={styles.iconButton} aria-label="Đưa giai đoạn xuống sau" title="Xuống sau" disabled={activeIndex === phases.length - 1} onClick={() => movePhase(activePhase.id, 1)}><ArrowDown size={15} /></button>
              <button type="button" className={styles.iconButton} aria-label="Xóa giai đoạn" title="Xóa giai đoạn" onClick={() => removePhase(activePhase)}><Trash2 size={15} /></button>
            </div>
            <label className={styles.field}>Tên giai đoạn
              <input value={activePhase.title} maxLength={120} placeholder="Ví dụ: Nhử địch vào bãi cọc" onChange={e => changePhase(activePhase.id, { title: e.target.value })} />
            </label>
            <label className={styles.field}>Lời thuyết minh
              <textarea className={cn(styles.narration, styles.phaseNarration)} value={activePhase.narration} maxLength={PHASE_NARRATION_MAX} rows={6}
                placeholder="Viết câu ngắn. Mỗi câu được đọc và hiện phụ đề riêng."
                onChange={e => changePhase(activePhase.id, { narration: e.target.value })} />
            </label>
            <small className={styles.narrationCount}>{splitSentences(activePhase.narration).length} câu · đọc ≈ {Math.round(sceneDurationMs(activePhase.narration) / 1000)} giây</small>
            <div className={styles.field}>Camera
              <div className={styles.segmented} role="group" aria-label="Camera của giai đoạn">
                {([["auto", "Tự động"], ["frame", "Khung"], ["full", "Toàn cảnh"]] as const).map(([cam, label]) =>
                  <button key={cam} type="button" aria-pressed={activePhase.camera === cam} onClick={() => setCamera(activePhase, cam)}>{label}</button>)}
              </div>
            </div>
            <div className={styles.cameraHint}>
              {activePhase.camera === "auto" && (value.mode === "image"
                ? "Ảnh vẽ sẵn không có ký hiệu để bám theo: chọn «Khung» để camera phóng vào đúng chỗ."
                : "Phóng vào vùng có ký hiệu của giai đoạn này.")}
              {activePhase.camera === "full" && "Giữ nguyên toàn bộ lược đồ."}
              {activePhase.camera === "frame" && (drawingFrame ? "Kéo trên lược đồ để khoanh vùng."
                : activePhase.focus ? "Camera phóng vào khung nét đứt trên lược đồ." : "Chưa có khung.")}
              {activePhase.camera === "frame" && !drawingFrame && <button type="button" onClick={() => { setDrawingFrame(true); setPlacingType(null); setSelectedId(null); }}>
                {activePhase.focus ? "Vẽ lại khung" : "Vẽ khung"}</button>}
            </div>
          </>}
          {phases.length > 0 && !activePhase && <p className={styles.hint}>Ký hiệu ở lớp này hiện suốt trận: địa danh, thành lũy, doanh trại…</p>}
          <div className={styles.inspectorHead}>
            <Layers size={17} />
            <h2>{activePhase ? "Thứ tự xuất hiện" : phases.length ? "Lớp luôn hiện" : "Ký hiệu trên lược đồ"}</h2>
            <em>{listedSymbols.length}</em>
          </div>
          {listedSymbols.length > 1 && <p className={styles.fieldHint}>{activePhase ? "Kéo để đổi thứ tự xuất hiện. " : ""}Kéo thả lên nút số giai đoạn phía trên lược đồ để chuyển giai đoạn.</p>}
          {listedSymbols.length === 0 ? <p className={styles.hint}>Chọn ký hiệu ở tab «Ký hiệu» bên trái rồi bấm lên lược đồ để đặt.</p>
            : <ul className={styles.layerList}>
              {listedSymbols.map((s, i) => {
                const faction = value.factions.find(f => f.id === s.factionId);
                const name = s.label || SYMBOL_LABELS[s.type];
                return <li key={s.id} className={styles.dragRow} draggable
                  data-dragging={dragId === s.id || undefined}
                  data-drop={dropAt?.id === s.id ? (dropAt.after ? "after" : "before") : undefined}
                  onDragStart={e => { setDragId(s.id); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", s.id); }}
                  onDragEnd={() => { setDragId(null); setDropAt(null); setDropPhase(null); }}
                  onDragOver={e => {
                    if (!dragId || dragId === s.id) return;
                    e.preventDefault();
                    const r = e.currentTarget.getBoundingClientRect();
                    setDropAt({ id: s.id, after: e.clientY > r.top + r.height / 2 });
                  }}
                  onDrop={e => {
                    e.preventDefault();
                    if (dragId && dropAt) reorder(dragId, dropAt.id, dropAt.after);
                    setDragId(null); setDropAt(null);
                  }}>
                  <span className={styles.dragHandle} aria-hidden="true"><GripVertical size={14} /></span>
                  <input type="checkbox" className={styles.rowCheck} checked={selection.includes(s.id)} aria-label={`Chọn ${name}`}
                    onChange={() => selectSymbol(s.id, true)} />
                  <button type="button" onClick={e => selectSymbol(s.id, e.shiftKey || e.ctrlKey || e.metaKey)}
                    title="Alt + ↑/↓ để đổi thứ tự"
                    onKeyDown={e => {
                      // Keyboard alternative to dragging.
                      if (!e.altKey || (e.key !== "ArrowUp" && e.key !== "ArrowDown")) return;
                      const neighbour = listedSymbols[i + (e.key === "ArrowUp" ? -1 : 1)];
                      if (neighbour) { e.preventDefault(); reorder(s.id, neighbour.id, e.key === "ArrowDown"); }
                    }}>
                    <span className={styles.layerGlyph} style={{ color: faction?.color }}><SymbolGlyph type={s.type} text={s.label} /></span>
                    <span className={styles.layerText}><strong>{s.type === "step" ? `${SYMBOL_LABELS.step} ${s.label}` : s.label || SYMBOL_LABELS[s.type]}</strong><small>{s.label && s.type !== "step" ? `${SYMBOL_LABELS[s.type]} · ` : ""}{faction?.name}</small></span>
                  </button>
                  <button type="button" className={styles.iconButton} aria-label={`Xóa ${s.label || SYMBOL_LABELS[s.type]}`} title="Xóa" onClick={() => removeSymbol(s.id)}><Trash2 size={14} /></button>
                </li>;
              })}
            </ul>}
        </>}
      </aside>
    </div>
  </section>;
}
