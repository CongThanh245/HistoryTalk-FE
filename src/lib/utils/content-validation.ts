import { isValidUrl } from "@/lib/utils/url";

export type ValidationErrors<T extends string> = Partial<Record<T, string>>;

const CURRENT_YEAR = new Date().getFullYear();
const MIN_YEAR = 5000;

function isBlank(value: string | null | undefined): boolean {
  return !value?.trim();
}

function parseInteger(value: string): number | null {
  if (isBlank(value)) return null;
  if (!/^-?\d+$/.test(value.trim())) return null;
  return Number(value);
}

function validateRequired(
  errors: ValidationErrors<string>,
  field: string,
  value: string | null | undefined,
  label: string,
) {
  if (isBlank(value)) {
    errors[field] = `${label} là bắt buộc.`;
  }
}

function validateYear(
  errors: ValidationErrors<string>,
  field: string,
  value: string,
  label: string,
  required = true,
): number | null {
  if (isBlank(value)) {
    if (required) errors[field] = `${label} là bắt buộc.`;
    return null;
  }

  const year = parseInteger(value);
  if (year == null || year === 0) {
    errors[field] = `${label} phải là số nguyên khác 0.`;
    return null;
  }

  if (Math.abs(year) > MIN_YEAR || year > CURRENT_YEAR) {
    errors[field] = `${label} phải nằm trong khoảng hợp lý.`;
    return null;
  }

  return year;
}

function validateDayMonthYear(
  errors: ValidationErrors<string>,
  prefix: "born" | "death",
  dayValue: string,
  monthValue: string,
  yearValue: string,
  label: string,
) {
  const hasAnyValue = !isBlank(dayValue) || !isBlank(monthValue) || !isBlank(yearValue);
  if (!hasAnyValue) return;

  const day = parseInteger(dayValue);
  const month = parseInteger(monthValue);
  const year = validateYear(errors, `${prefix}Year`, yearValue, `${label} - năm`, false);

  if (!isBlank(dayValue) && day == null) {
    errors[`${prefix}Day`] = `${label} - ngày phải là số nguyên.`;
  }
  if (!isBlank(monthValue) && month == null) {
    errors[`${prefix}Month`] = `${label} - tháng phải là số nguyên.`;
  }

  if (day != null && (day < 1 || day > 31)) {
    errors[`${prefix}Day`] = `${label} - ngày phải từ 1 đến 31.`;
  }
  if (month != null && (month < 1 || month > 12)) {
    errors[`${prefix}Month`] = `${label} - tháng phải từ 1 đến 12.`;
  }

  if (day != null && month != null && year != null) {
    const daysInMonth = new Date(Math.abs(year), month, 0).getDate();
    if (day > daysInMonth) {
      errors[`${prefix}Day`] = `${label} không tồn tại trong tháng đã chọn.`;
    }
  }
}

function signedYear(yearValue: string, isBc: boolean): number | null {
  const year = parseInteger(yearValue);
  if (year == null) return null;
  return isBc ? -Math.abs(year) : year;
}

export type CharacterValidationField =
  | "name"
  | "title"
  | "background"
  | "personality"
  | "image"
  | "modelUrl"
  | "bornDay"
  | "bornMonth"
  | "bornYear"
  | "deathDay"
  | "deathMonth"
  | "deathYear";

export type CharacterValidationInput = {
  name: string;
  title: string;
  background: string;
  personality: string;
  image: string;
  modelUrl: string;
  bornDay: string;
  bornMonth: string;
  bornYear: string;
  isBornBc: boolean;
  deathDay: string;
  deathMonth: string;
  deathYear: string;
  isDeathBc: boolean;
};

export function validateCharacterDraft(
  draft: CharacterValidationInput,
  options: { requirePublishReady?: boolean } = {},
): ValidationErrors<CharacterValidationField> {
  const errors: ValidationErrors<string> = {};
  const requirePublishReady = options.requirePublishReady ?? false;

  validateRequired(errors, "name", draft.name, "Tên nhân vật");
  validateRequired(errors, "title", draft.title, "Chức vị");
  validateRequired(errors, "background", draft.background, "Tiểu sử/bối cảnh");
  validateRequired(errors, "personality", draft.personality, "Tính cách");
  if (requirePublishReady) {
    validateRequired(errors, "image", draft.image, "URL hình ảnh nhân vật");
  }
  validateDayMonthYear(errors, "born", draft.bornDay, draft.bornMonth, draft.bornYear, "Ngày sinh");
  validateDayMonthYear(errors, "death", draft.deathDay, draft.deathMonth, draft.deathYear, "Ngày mất");

  if (!isBlank(draft.image) && !isValidUrl(draft.image.trim())) {
    errors.image = "URL hình ảnh không hợp lệ.";
  }
  if (!isBlank(draft.modelUrl) && !isValidUrl(draft.modelUrl.trim())) {
    errors.modelUrl = "URL mô hình 3D không hợp lệ.";
  }

  const born = signedYear(draft.bornYear, draft.isBornBc);
  const death = signedYear(draft.deathYear, draft.isDeathBc);
  if (born != null && death != null && death < born) {
    errors.deathYear = "Năm mất phải sau hoặc bằng năm sinh.";
  }

  return errors as ValidationErrors<CharacterValidationField>;
}

export type ContextValidationField =
  | "name"
  | "description"
  | "era"
  | "year"
  | "location"
  | "imageUrl"
  | "videoUrl";

export type ContextValidationInput = {
  name: string;
  description: string;
  era: string;
  year: string;
  location: string;
  imageUrl: string;
  videoUrl: string;
};

export function validateContextDraft(
  draft: ContextValidationInput,
): ValidationErrors<ContextValidationField> {
  const errors: ValidationErrors<string> = {};

  validateRequired(errors, "name", draft.name, "Tên bối cảnh");
  validateRequired(errors, "description", draft.description, "Mô tả");
  validateRequired(errors, "era", draft.era, "Thời đại");
  validateRequired(errors, "location", draft.location, "Địa điểm");
  validateYear(errors, "year", draft.year, "Năm");

  // Catches obvious placeholder/test data (e.g. "2121212") — a real
  // location name always has at least one letter.
  if (!isBlank(draft.location) && !/\p{L}/u.test(draft.location.trim())) {
    errors.location = "Địa điểm không hợp lệ (phải chứa chữ, không thể chỉ là số).";
  }

  if (!isBlank(draft.imageUrl) && !isValidUrl(draft.imageUrl.trim())) {
    errors.imageUrl = "URL hình ảnh không hợp lệ.";
  }
  if (!isBlank(draft.videoUrl) && !isValidUrl(draft.videoUrl.trim())) {
    errors.videoUrl = "URL video không hợp lệ.";
  }

  return errors as ValidationErrors<ContextValidationField>;
}

export function hasValidationErrors(errors: ValidationErrors<string>): boolean {
  return Object.keys(errors).length > 0;
}
