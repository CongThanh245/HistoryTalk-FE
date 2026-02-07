import { Container } from "../container";
import { SectionHeading } from "../section-heading";
import { FeatureCard } from "../feature-card";

export function FeaturesSection() {
  const features = [
    {
      icon: "💬",
      title: "Học lịch sử qua đối thoại",
      description: "Đặt câu hỏi tự nhiên và nhận phản hồi theo ngữ cảnh, chính xác về thời đại.",
    },
    {
      icon: "🔄",
      title: "Nhiều góc nhìn",
      description: "Khám phá cùng một sự kiện lịch sử qua nhiều giọng nói và quan điểm khác nhau.",
    },
    {
      icon: "🎭",
      title: "Bối cảnh sống động",
      description: "Nhân vật nói từ thời đại của họ — được định hình bởi văn hóa, giá trị và xung đột.",
    },
    {
      icon: "📚",
      title: "Hành trình học tập cá nhân",
      description: "Lưu cuộc trò chuyện, xem lại hiểu biết và theo dõi những gì bạn đã khám phá — không phải những gì bạn đã ghi nhớ.",
    },
    {
      icon: "🌍",
      title: "Thiết kế cho người học toàn cầu",
      description: "Hiện đại, trực quan và dễ tiếp cận cho học sinh trên toàn thế giới.",
    },
  ];

  return (
    <section className="py-20 md:py-32 bg-[var(--bg-main)] relative">
      <Container>
        <SectionHeading
          title="Tính năng nổi bật"
          subtitle="Những gì làm cho HistoryTalk khác biệt trong việc học lịch sử"
        />

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </Container>
    </section>
  );
}