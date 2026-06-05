/**
 * Kiểm tra URL hợp lệ cho next/image. 
 * Next.js yêu cầu URL phải bắt đầu bằng "/" hoặc "http://" hoặc "https://".
 * @param url Chuỗi URL cần kiểm tra
 * @returns true nếu hợp lệ, false nếu là "string" (vô nghĩa) hoặc rỗng hoặc định dạng sai.
 */
export function isValidUrl(url?: string | null): boolean {
  const value = url?.trim();
  if (!value) return false;
  // Loại bỏ các từ khóa vô nghĩa thường có trong mock data hoặc api error
  if (value.toLowerCase() === "string") return false;

  if (value.startsWith("data:image/")) return true;
  if (value.startsWith("/") && !value.startsWith("//")) return true;

  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}
