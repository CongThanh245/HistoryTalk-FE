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
const cssVariables = `
:root {
  --background: #0F1115;
  --card-light-bg: #1A1D23;
  --card-light-border: rgba(255, 255, 255, 0.08);
  
  --content-heading: #F8FAFC;
  --content-text: #E2E8F0;
  --content-muted: #94A3B8;
  
  --gold-on-light: #D4AF37;
  --accent-gold: #C9A24D;
  --accent-bronze: #A85125;
  --burning-flame: #F56523;
  --accent-teal: #2DD4BF;
  
  /* Hiệu ứng đổ bóng cho Card */
  --card-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.5);
}
`;