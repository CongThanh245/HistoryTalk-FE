export const theme = {
  // ... các cấu hình khác giữ nguyên
  colors: {
    // Nền tối sâu hơn để làm nổi bật các thẻ (Card)
    background: "#0F1115", 
    cardBg: "#1A1D23",
    cardBorder: "rgba(255, 255, 255, 0.06)",

    // Tông màu vàng đồng (Gold) chủ đạo cho dự án History Talk
    accentGold: "#C9A24D",
    accentGoldSoft: "#E2C77A",
    
    // Màu chữ
    heading: "#FFFFFF",
    textMuted: "#94A3B8", // Xám xanh nhẹ nhàng hơn
  }
};

// CSS Variables để dán vào file CSS toàn cục (globals.css) hoặc inject qua theme.ts
const cssVariables = 
:root {
  /* Background sâu hơn để làm nổi bật nội dung */
  --bg-main: #0a0c10; 
  --card-light-bg: rgba(255, 255, 255, 0.03);
  --card-light-border: rgba(255, 255, 255, 0.08);

  /* Màu nhấn: Chuyển từ vàng thư viện sang vàng Champagne/Bronze */
  --accent-gold: #d4af37; 
  --accent-gold-glow: rgba(212, 175, 55, 0.15);
  --accent-bronze: #cd7f32;
  
  /* Text */
  --text-primary: #ffffff;
  --text-secondary: #a0a0a0;
  --text-tertiary: #d4af37; /* Dùng cho subtitle sống động */
}