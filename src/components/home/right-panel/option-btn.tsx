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
  let bg = "transparent",
    border = "var(--card-light-border)",
    color = "var(--content-text)";
  if (answered) {
    if (isAnswer) {
      bg = "rgba(16,40,24,0.08)";
      border = "rgba(74,178,98,0.45)";
      color = "#2d6b3e";
    } else if (isSelected) {
      bg = "rgba(90,35,35,0.08)";
      border = "rgba(184,50,42,0.45)";
      color = "#9b2222";
    } else {
      color = "var(--content-muted)";
    }
  }
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-2.5 py-2 text-xs text-left flex items-center gap-2 w-full transition-colors duration-100 ${
        answered ? "cursor-default" : "cursor-pointer"
      }`}
      style={{
        background: bg,
        border: `1px solid ${border}`,
        color,
      }}
      onMouseEnter={(e) => {
        if (!answered)
          e.currentTarget.style.background = "rgba(201,162,77,0.06)";
      }}
      onMouseLeave={(e) => {
        if (!answered) e.currentTarget.style.background = bg;
      }}
    >
      <span className="text-[9px] font-extrabold min-w-[18px] h-[18px] flex items-center justify-center rounded shrink-0 bg-accent-gold/10 text-gold-on-light">
        {letters[index]}
      </span>
      <span className="flex-1 font-medium">{label}</span>
    </button>
  );
}
