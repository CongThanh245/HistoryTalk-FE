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
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto border-[var(--card-light-border)] bg-[var(--card-light-bg)] text-[var(--content-heading)] sm:max-w-[430px]">
        <DialogHeader>
          <DialogTitle>Chuỗi ngày học</DialogTitle>
          <DialogDescription className="text-[var(--content-muted)]">Các ngày đã học được đánh dấu trong lịch.</DialogDescription>
        </DialogHeader>
        <div>
          <div className="flex items-center justify-between gap-3">
            <button type="button" onClick={() => moveMonth(-1)} disabled={!canGoBack} aria-label="Tháng trước" className="grid h-10 w-10 place-items-center rounded-md border border-[var(--card-light-border)] disabled:opacity-40"><ChevronLeft size={18} /></button>
            <strong className="text-sm text-[var(--content-heading)]">Tháng {month}/{year}</strong>
            <button type="button" onClick={() => moveMonth(1)} disabled={!canGoForward} aria-label="Tháng sau" className="grid h-10 w-10 place-items-center rounded-md border border-[var(--card-light-border)] disabled:opacity-40"><ChevronRight size={18} /></button>
          </div>
          <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs font-semibold text-[var(--content-muted)]">
            {WEEKDAYS.map((day) => <span key={day}>{day}</span>)}
          </div>
          {studyDays.isPending ? (
            <div className="flex min-h-52 items-center justify-center gap-2 text-sm text-[var(--content-muted)]"><Loader2 size={16} className="animate-spin" />Đang tải lịch học...</div>
          ) : studyDays.isError ? (
            <div className="flex min-h-52 flex-col items-center justify-center gap-2 text-sm text-[var(--content-muted)]"><p>Không tải được lịch học.</p><button type="button" onClick={() => void studyDays.refetch()} className="underline">Thử lại</button></div>
          ) : (
            <>
              <div className="mt-1 grid grid-cols-7 gap-1">
                {Array.from({ length: firstWeekday }, (_, index) => <span key={`empty-${index}`} />)}
                {Array.from({ length: daysInMonth }, (_, index) => {
                  const day = index + 1;
                  const key = dateKey(year, month, day);
                  const isFuture = key > today;
                  const isStudied = studied.has(key);
                  return <button key={key} type="button" disabled={isFuture} onClick={() => setSelectedDate(key)} aria-label={`${day}/${month}/${year}: ${isStudied ? "đã học" : isFuture ? "chưa đến" : "chưa ghi nhận học"}`} aria-pressed={selectedDate === key} className={`grid aspect-square min-h-9 place-items-center rounded-md border text-xs font-bold focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--streak-text)] ${isStudied ? "border-[var(--streak-text)] bg-[var(--streak-text)] text-white" : "border-[var(--card-light-border)] text-[var(--content-heading)]"} ${key === today ? "ring-2 ring-[var(--streak-border)]" : ""} ${selectedDate === key ? "outline-2 outline-[var(--streak-text)]" : ""} disabled:opacity-35`}>{isStudied ? <Check size={16} strokeWidth={3} /> : day}</button>;
                })}
              </div>
              <p className="mt-3 text-xs text-[var(--content-muted)]" aria-live="polite">
                {selectedDate ? `${selectedDate.split("-").reverse().join("/")}: ${studied.has(selectedDate) ? "Đã học" : "Chưa ghi nhận học"}` : `${studied.size} ngày học trong tháng`}
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
