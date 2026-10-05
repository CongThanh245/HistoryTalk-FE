"use client";

import { useState } from "react";
import { Check, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useGamificationStudyDays } from "@/features/gamification/hooks";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

function dateKey(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function StudyCalendar({ today, open, onOpenChange }: { today: string; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [monthDate, setMonthDate] = useState(() => {
    const [year, month] = today.split("-").map(Number);
    return new Date(year, month - 1, 1);
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth() + 1;
  const studyDays = useGamificationStudyDays(year, month, open);
  const studied = new Set(studyDays.data ?? []);
  const firstWeekday = (monthDate.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month, 0).getDate();
  const currentMonth = today.slice(0, 7);
  const viewingMonth = dateKey(year, month, 1).slice(0, 7);
  const canGoBack = year > 2000 || month > 1;
  const canGoForward = viewingMonth < currentMonth;

  function moveMonth(offset: number) {
    setMonthDate(new Date(year, month - 1 + offset, 1));
    setSelectedDate(null);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-[2px] border-[var(--text-primary)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-[var(--shadow-soft)] sm:max-w-[430px]">
        <DialogHeader className="border-b border-[var(--text-primary)] pb-3">
          <DialogTitle className="archive-title text-[24px]">Chuỗi ngày học</DialogTitle>
          <DialogDescription className="text-[var(--text-tertiary)]">Các ngày đã học được đánh dấu trong lịch.</DialogDescription>
        </DialogHeader>
        <div>
          <div className="flex items-center justify-between gap-3">
            <button type="button" onClick={() => moveMonth(-1)} disabled={!canGoBack} aria-label="Tháng trước" className="grid h-10 w-10 place-items-center rounded-[2px] border border-[var(--text-primary)] text-[var(--text-primary)] transition-colors hover:enabled:bg-[var(--text-primary)] hover:enabled:text-[var(--text-inverse)] disabled:opacity-40"><ChevronLeft size={18} /></button>
            <strong className="font-display text-[18px] font-extrabold uppercase text-[var(--text-primary)]">Tháng {month}/{year}</strong>
            <button type="button" onClick={() => moveMonth(1)} disabled={!canGoForward} aria-label="Tháng sau" className="grid h-10 w-10 place-items-center rounded-[2px] border border-[var(--text-primary)] text-[var(--text-primary)] transition-colors hover:enabled:bg-[var(--text-primary)] hover:enabled:text-[var(--text-inverse)] disabled:opacity-40"><ChevronRight size={18} /></button>
          </div>
          <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
            {WEEKDAYS.map((day) => <span key={day}>{day}</span>)}
          </div>
          {studyDays.isPending ? (
            <div className="flex min-h-52 items-center justify-center gap-2 text-sm text-[var(--text-tertiary)]"><Loader2 size={16} className="animate-spin" />Đang tải lịch học...</div>
          ) : studyDays.isError ? (
            <div className="flex min-h-52 flex-col items-center justify-center gap-2 text-sm text-[var(--text-tertiary)]"><p>Không tải được lịch học.</p><button type="button" onClick={() => void studyDays.refetch()} className="archive-link">Thử lại</button></div>
          ) : (
            <>
              <div className="mt-1 grid grid-cols-7 gap-1">
                {Array.from({ length: firstWeekday }, (_, index) => <span key={`empty-${index}`} />)}
                {Array.from({ length: daysInMonth }, (_, index) => {
                  const day = index + 1;
                  const key = dateKey(year, month, day);
                  const isFuture = key > today;
                  const isStudied = studied.has(key);
                  return <button key={key} type="button" disabled={isFuture} onClick={() => setSelectedDate(key)} aria-label={`${day}/${month}/${year}: ${isStudied ? "đã học" : isFuture ? "chưa đến" : "chưa ghi nhận học"}`} aria-pressed={selectedDate === key} className={`grid aspect-square min-h-9 place-items-center rounded-[2px] border text-xs font-bold focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--accent-gold)] ${isStudied ? (key === today ? "border-[var(--accent-gold)] bg-[var(--accent-gold)] text-white" : "border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--text-inverse)]") : key === today ? "border-2 border-[var(--accent-gold)] bg-[var(--bg-elevated)] text-[var(--gold-on-light)]" : "border-[var(--border-strong)] bg-[var(--bg-elevated)] text-[var(--text-primary)]"} ${selectedDate === key ? "outline-2 outline-[var(--accent-gold)]" : ""} disabled:opacity-35`}>{isStudied ? <Check size={16} strokeWidth={3} /> : day}</button>;
                })}
              </div>
              <p className="mt-3 text-xs text-[var(--text-tertiary)]" aria-live="polite">
                {selectedDate ? `${selectedDate.split("-").reverse().join("/")}: ${studied.has(selectedDate) ? "Đã học" : "Chưa ghi nhận học"}` : `${studied.size} ngày học trong tháng`}
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
