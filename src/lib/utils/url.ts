/**
 * Kiểm tra URL hợp lệ cho next/image. 
 * Next.js yêu cầu URL phải bắt đầu bằng "/" hoặc "http://" hoặc "https://".
 * @param url Chuỗi URL cần kiểm tra
 * @returns true nếu hợp lệ, false nếu là "string" (vô nghĩa) hoặc rỗng hoặc định dạng sai.
 */
export function isValidUrl(url?: string | null): boolean {
  if (!url) return false;
  // Loại bỏ các từ khóa vô nghĩa thường có trong mock data hoặc api error
  if (url.toLowerCase() === "string") return false;
  
  return url.startsWith("http") || url.startsWith("/") || url.startsWith("data:image/");
}
