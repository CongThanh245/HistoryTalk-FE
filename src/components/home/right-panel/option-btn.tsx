"use client";

export function OptionBtn({
  label,
  index,
  answered,
  isAnswer,
  isSelected,
  onClick,
}: {
  label: string;
  index: number;
  answered: boolean;
  isAnswer: boolean;
  isSelected: boolean;
  onClick: () => void;
}) {
  const letters = ["A", "B", "C", "D"];
  let tone =
    "bg-[var(--bg-elevated)] border-[var(--border-strong)] text-[var(--text-primary)] hover:border-[var(--text-primary)]";
  let letterTone = "border-[var(--text-primary)] text-[var(--text-primary)]";
  if (answered) {
    if (isAnswer) {
      tone = "bg-[var(--status-success-bg)] border-[var(--status-success)] text-[var(--status-success)]";
      letterTone = "border-[var(--status-success)] bg-[var(--status-success)] text-[var(--text-inverse)]";
    } else if (isSelected) {
      tone = "bg-[var(--status-danger-bg)] border-[var(--accent-danger)] text-[var(--accent-danger)]";
      letterTone = "border-[var(--accent-danger)] bg-[var(--accent-danger)] text-[var(--text-inverse)]";
    } else {
      tone = "bg-[var(--bg-elevated)] border-[var(--border-default)] text-[var(--text-muted)]";
      letterTone = "border-[var(--border-strong)] text-[var(--text-muted)]";
    }
  } else if (isSelected) {
    tone = "bg-[var(--text-primary)] border-[var(--text-primary)] text-[var(--text-inverse)]";
    letterTone = "border-[var(--text-inverse)] text-[var(--text-inverse)]";
  }
  return (
    <button
      onClick={onClick}
      className={`rounded-[2px] border px-2.5 py-2 text-xs text-left flex items-center gap-2 w-full transition-colors duration-100 ${tone} ${
        answered ? "cursor-default" : "cursor-pointer"
      }`}
    >
      <span
        className={`text-[10px] font-extrabold min-w-[20px] h-[20px] flex items-center justify-center rounded-[2px] border shrink-0 transition-colors duration-100 ${letterTone}`}
      >
        {letters[index]}
      </span>
      <span className="flex-1 font-semibold">{label}</span>
    </button>
  );
}
