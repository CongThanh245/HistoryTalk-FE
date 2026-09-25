import { ImageResponse } from "next/og";

export const alt = "HistoryTalk – Học lịch sử qua trò chuyện";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", width: "100%", height: "100%", padding: 80, background: "#0e1a2b", color: "#dfdab5" }}>
      <div style={{ fontSize: 88, color: "#EA7A0A", fontWeight: 700 }}>HistoryTalk</div>
      <div style={{ fontSize: 48, marginTop: 28 }}>Học lịch sử qua trò chuyện</div>
      <div style={{ fontSize: 30, marginTop: 24 }}>Nhân vật · Sự kiện · Câu đố lịch sử</div>
    </div>, size,
  );
}
