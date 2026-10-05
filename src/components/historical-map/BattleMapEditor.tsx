"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, AudioLines, Copy, Download, Eye, ImageIcon, Layers, Loader2, MapPin, MousePointerClick, MoveHorizontal, Plus, RotateCw, Save, Shapes, Trash2, Upload, Users, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { getApiErrorMessage } from "@/lib/utils/api-error";
import { battleMapImageService } from "@/services/media.service";
import { BattleMapCanvas, SymbolGlyph } from "./BattleMapCanvas";
import {
  defaultSymbolSize, isNoteSymbol, SYMBOL_GROUPS, SYMBOL_LABELS, SYMBOL_SIZE_MAX, SYMBOL_SIZE_MIN,
  type BattleMap, type BattleSymbol, type BattleSymbolType,
} from "./battle-map.types";
import styles from "./battle-map-editor.module.css";

type Tab = "image" | "factions" | "symbols" | "narration";
const TABS: { id: Tab; label: string; icon: typeof ImageIcon }[] = [
  { id: "image", label: "Ảnh nền", icon: ImageIcon },
  { id: "factions", label: "Phe", icon: Users },
  { id: "symbols", label: "Ký hiệu", icon: Shapes },
  { id: "narration", label: "Thuyết minh", icon: AudioLines },
];

const NARRATION_MAX = 5000;

/** New maps start with two editable sides so admins can place symbols right away. */
function withDefaultFactions(map: BattleMap): BattleMap {
  if (map.factions.length > 0) return map;
  return { ...map, factions: [
    { id: crypto.randomUUID(), name: "Quân ta", color: "#b91c1c" },
    { id: crypto.randomUUID(), name: "Quân địch", color: "#1d4ed8" },
  ] };
}

export function BattleMapEditor({ initialValue, title, onSave, onClose, onPreview, narration }: {
  initialValue: BattleMap; title: string; onClose: () => void;
  /** Publishes the map to the server; rejects when the save failed. */
  onSave: (map: BattleMap) => Promise<void>;
  /** Saves and shows the learner-facing battle page. */
  onPreview?: () => void;
  /** Narration read aloud on the battle page (the map pin's description); null when the battle has no pin yet. */
  narration?: { value: string; onSave: (text: string) => Promise<void> } | null;
}) {
  const [start] = useState(() => withDefaultFactions(initialValue));
  const [value, setValue] = useState(start);
  const [saved, setSaved] = useState(() => JSON.stringify(start));
  const [hasDraft, setHasDraft] = useState(!!initialValue.imageUrl);
  const [tab, setTab] = useState<Tab>(start.imageUrl ? "symbols" : "image");
  const [imageUrlInput, setImageUrlInput] = useState(start.imageUrl.startsWith("data:") ? "" : start.imageUrl);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [placingType, setPlacingType] = useState<BattleSymbolType | null>(null);
  const [factionId, setFactionId] = useState(start.factions[0]?.id ?? "");
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#15803d");
  const [error, setError] = useState("");
  const [clipboard, setClipboard] = useState<BattleSymbol | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [narrationText, setNarrationText] = useState(narration?.value ?? "");
  const [savedNarration, setSavedNarration] = useState(narration?.value ?? "");
  const selected = value.symbols.find(s => s.id === selectedId);
  const activeFaction = value.factions.find(f => f.id === factionId);
  const mapDirty = JSON.stringify(value) !== saved;
  const narrationDirty = !!narration && narrationText.trim() !== savedNarration.trim();
  const dirty = mapDirty || narrationDirty;
  // The map needs a background image; a narration-only edit can be saved without one.
  const canSave = dirty && (!mapDirty || !!value.imageUrl.trim());
  const canDraw = value.mode === "custom" && !!value.imageUrl && !!activeFaction;

  const update = (patch: Partial<BattleMap>) => setValue(v => ({ ...v, ...patch }));
  const changeSymbol = (id: string, patch: Partial<BattleSymbol>) =>
    setValue(v => ({ ...v, symbols: v.symbols.map(s => s.id === id ? { ...s, ...patch } : s) }));
  const removeSymbol = (id: string) => { update({ symbols: value.symbols.filter(s => s.id !== id) }); if (selectedId === id) setSelectedId(null); };
  const close = () => { if (!dirty || window.confirm("Bỏ các thay đổi chưa lưu trên lược đồ?")) onClose(); };

  useEffect(() => {
    const beforeUnload = (e: BeforeUnloadEvent) => { if (dirty) e.preventDefault(); };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [dirty]);

  const addSymbol = (type: BattleSymbolType, x = 50, y = 50, shape?: { size: number; rotation: number }) => {
    if (!canDraw) return;
    const id = crypto.randomUUID();
    // A new symbol reuses the note of the latest same-type symbol of this side, so a legend row covers them all.
    const sameKind = value.symbols.filter(s => s.type === type && s.factionId === factionId);
    const label = type === "label" ? "Chú thích" : type === "step" ? String(value.symbols.filter(s => s.type === "step").length + 1) : sameKind.at(-1)?.label ?? "";
    update({ symbols: [...value.symbols, { id, type, factionId, label, x, y, size: shape?.size ?? defaultSymbolSize(type), rotation: shape?.rotation ?? 0 }] });
    // The tool is one-shot: the new symbol stays selected so its handles can be dragged right away.
    setSelectedId(id);
    setPlacingType(null);
  };

  const duplicate = (symbol: BattleSymbol) => {
    const id = crypto.randomUUID();
    const copy = {
      ...symbol, id, x: Math.min(100, symbol.x + 3), y: Math.min(100, symbol.y + 3),
      // A copied symbol whose side was deleted joins the side currently being drawn.
      factionId: value.factions.some(f => f.id === symbol.factionId) ? symbol.factionId : factionId,
    };
    if (!value.factions.some(f => f.id === copy.factionId)) return null;
    update({ symbols: [...value.symbols, copy] });
    setSelectedId(id);
    return copy;
  };

  // Esc steps back; Ctrl+C / Ctrl+V copy-paste, Ctrl+D duplicate, Delete removes — ignored while typing in a field.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Escape works wherever focus is (clicking the image leaves focus on <body>).
      if (e.key === "Escape") {
        e.preventDefault();
        if (placingType) setPlacingType(null);
        else if (selectedId) setSelectedId(null);
        else close();
        return;
      }
      if (e.defaultPrevented || value.mode !== "custom") return;
      const target = e.target as HTMLElement;
      if (target.closest("input, textarea, select, [contenteditable=true]")) return;
      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();
      if (mod && key === "c" && selected) { e.preventDefault(); setClipboard(selected); }
      else if (mod && key === "v" && clipboard) { e.preventDefault(); const pasted = duplicate(clipboard); if (pasted) setClipboard(pasted); }
      else if (mod && key === "d" && selected) { e.preventDefault(); duplicate(selected); }
      else if ((e.key === "Delete" || e.key === "Backspace") && selected) { e.preventDefault(); removeSymbol(selected.id); }
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
      if (narrationDirty && narration) {
        await narration.onSave(narrationText.trim());
        setSavedNarration(narrationText.trim());
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
      <button type="button" onClick={exportMap} aria-label="Xuất JSON" title="Tải thiết kế dưới dạng JSON"><Download size={16} /><span>Xuất JSON</span></button>
      {onPreview && <button type="button" aria-label="Lưu và xem trước" title="Lưu rồi xem trang trận đánh như người học" disabled={busy || (mapDirty && !value.imageUrl.trim())} onClick={async () => { if (!dirty || await save()) onPreview(); }}><Eye size={16} /><span>Lưu &amp; xem trước</span></button>}
      <button type="button" className={styles.primary} aria-label="Lưu lược đồ" disabled={!canSave || busy} onClick={() => void save()}>{saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}<span>Lưu</span></button>
    </header>

    <div className={styles.layout}>
      <aside className={styles.settings}>
        <div className={styles.tabs} role="tablist" aria-label="Nhóm thiết lập">
          {TABS.map(t => <button key={t.id} type="button" role="tab" id={`map-tab-${t.id}`} aria-selected={tab === t.id} aria-controls="map-tab-panel"
            className={cn(styles.tab, tab === t.id && styles.tabActive)} onClick={() => setTab(t.id)}>
            <t.icon size={16} />{t.label}
            {t.id === "factions" && <em>{value.factions.length}</em>}
            {t.id === "narration" && narrationDirty && <em aria-label="Có thay đổi">•</em>}
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

          {tab === "narration" && <div className={styles.group}>
            <h2>Thuyết minh diễn biến</h2>
            {narration ? <>
              <p className={styles.hint}><AudioLines size={14} /> Đọc thành audio ở trang trận đánh. Viết theo trình tự diễn biến, câu ngắn để giọng đọc rõ ràng.</p>
              <textarea
                className={styles.narration}
                value={narrationText}
                maxLength={NARRATION_MAX}
                rows={14}
                placeholder="Ví dụ: Cuối năm 938, quân Nam Hán do Hoằng Tháo chỉ huy tiến vào sông Bạch Đằng…"
                aria-label="Thuyết minh diễn biến"
                onChange={e => setNarrationText(e.target.value)}
              />
              <small className={styles.narrationCount}>{narrationText.length.toLocaleString("vi-VN")} / {NARRATION_MAX.toLocaleString("vi-VN")} ký tự</small>
            </> : <div className={styles.callout}>
              <span><MapPin size={14} className="inline -mt-0.5 mr-1" />Trận đánh này chưa được ghim trên bản đồ. Ghim vị trí trước rồi mới thêm thuyết minh.</span>
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
              <p className={styles.hint}><MousePointerClick size={14} /> Chọn ký hiệu rồi bấm lên lược đồ để đặt. Với mũi tên và phòng tuyến: nhấn giữ rồi kéo để vẽ theo hướng.</p>
              {SYMBOL_GROUPS.map(group => <div className={styles.group} key={group.title}>
                <h2>{group.title}</h2>
                <div className={styles.tools} style={{ color: activeFaction?.color }}>
                  {group.types.map(type => <button key={type} type="button" disabled={!canDraw} draggable={canDraw} aria-pressed={placingType === type}
                    className={cn(placingType === type && styles.toolActive)}
                    onDragStart={e => { e.dataTransfer.setData("application/x-battle-symbol", type); e.dataTransfer.effectAllowed = "copy"; }}
                    onClick={() => setPlacingType(p => p === type ? null : type)}>
                    <SymbolGlyph type={type} /><span>{SYMBOL_LABELS[type]}</span>
                  </button>)}
                </div>
              </div>)}
            </>}
          </>}
        </div>
      </aside>

      <main className={styles.workspace}>
        {error && <p className={styles.error} role="alert">{error}<button type="button" aria-label="Đóng thông báo" onClick={() => setError("")}><X size={14} /></button></p>}
        <BattleMapCanvas value={value} title={title} selectedId={selectedId} placingType={placingType} placingColor={activeFaction?.color}
          onSelect={value.mode === "custom" ? setSelectedId : undefined} onMove={(id, x, y) => changeSymbol(id, { x, y })}
          onTransform={(id, patch) => changeSymbol(id, patch)}
          onAdd={addSymbol} onDelete={removeSymbol} legendTitle={title} />
      </main>

      <aside className={styles.inspector} aria-label={selected ? "Chỉnh ký hiệu" : "Danh sách ký hiệu"}>
        {selected ? <>
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
          <ul className={styles.shortcuts}>
            <li><span>Di chuyển</span><em>Kéo ký hiệu, hoặc phím mũi tên</em></li>
            <li><span>Xoay</span><em>Kéo nút <RotateCw size={13} /> phía trên ký hiệu · giữ Shift để xoay từng 15°</em></li>
            <li><span>Kích thước</span><em>Kéo nút <MoveHorizontal size={13} /> bên cạnh ký hiệu</em></li>
            <li><span>Nhân bản</span><em><kbd>Ctrl</kbd> + <kbd>C</kbd> rồi <kbd>Ctrl</kbd> + <kbd>V</kbd>, hoặc <kbd>Ctrl</kbd> + <kbd>D</kbd></em></li>
            <li><span>Xóa</span><em><kbd>Delete</kbd></em></li>
          </ul>
          <div className={styles.inspectorActions}>
            <button type="button" title="Nhân bản (Ctrl+D)" onClick={() => duplicate(selected)}><Copy size={15} />Nhân bản</button>
            <button type="button" className={styles.delete} title="Xóa (Delete)" onClick={() => removeSymbol(selected.id)}><Trash2 size={15} />Xóa ký hiệu</button>
          </div>
        </> : <>
          <div className={styles.inspectorHead}>
            <Layers size={17} />
            <h2>Ký hiệu trên lược đồ</h2>
            <em>{value.symbols.length}</em>
          </div>
          {value.symbols.length === 0 ? <p className={styles.hint}>Chưa có ký hiệu nào. Chọn ký hiệu ở cột trái để bắt đầu.</p>
            : <ul className={styles.layerList}>
              {value.symbols.map(s => {
                const faction = value.factions.find(f => f.id === s.factionId);
                return <li key={s.id}>
                  <button type="button" onClick={() => setSelectedId(s.id)}>
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
