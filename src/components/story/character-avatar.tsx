import { BookOpen } from "lucide-react";
import type { StoryCharacter } from "@/features/story/types";

/** Round face crop of a character, a monogram without a portrait, or a book for the narrator. */
export function CharacterAvatar({ character, size = 24 }: { character: StoryCharacter | null; size?: number }) {
  const style = { width: size, height: size };
  if (!character) {
    return (
      <span style={style} className="grid shrink-0 place-items-center rounded-full border border-[var(--border-strong)] bg-[var(--bg-deep)] text-[var(--text-tertiary)]">
        <BookOpen style={{ width: size * 0.55, height: size * 0.55 }} />
      </span>
    );
  }
  if (!character.portraitUrl) {
    const initials = character.name
      .split(" ")
      .slice(-2)
      .map((w) => w[0])
      .join("");
    return (
      <span
        style={{ ...style, background: character.accent, fontSize: size * 0.4 }}
        className="grid shrink-0 place-items-center rounded-full font-bold text-white"
      >
        {initials}
      </span>
    );
  }
  return (
    <span
      style={{ ...style, backgroundImage: `url(${character.portraitUrl})`, backgroundColor: character.accent }}
      className="shrink-0 rounded-full border border-[var(--border-strong)] bg-[length:260%] bg-[position:50%_14%] bg-no-repeat"
    />
  );
}
