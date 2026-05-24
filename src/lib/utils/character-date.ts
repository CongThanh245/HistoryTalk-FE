export type CharacterDateParts = {
  bornYear?: number | null;
  bornMonth?: number | null;
  bornDay?: number | null;
  isBornBc?: boolean;
  deathYear?: number | null;
  deathMonth?: number | null;
  deathDay?: number | null;
  isDeathBc?: boolean;
};

function formatPart(value: number | null | undefined): string {
  return value == null ? "?" : String(value);
}

function formatDate(day?: number | null, month?: number | null, year?: number | null, isBc?: boolean): string {
  return `${formatPart(day)}/${formatPart(month)}/${formatPart(year)}${isBc ? " TCN" : ""}`;
}

export function formatCharacterLifespan(character: CharacterDateParts): string {
  return `${formatDate(character.bornDay, character.bornMonth, character.bornYear, character.isBornBc)} - ${formatDate(
    character.deathDay,
    character.deathMonth,
    character.deathYear,
    character.isDeathBc,
  )}`;
}
