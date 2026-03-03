import { Container } from "../container";
import { FeatureCard } from "../feature-card";

export function ImpactSection() {
  const impacts = [
    {
      icon: "🧠",
      title: "Hiểu lịch sử như kinh nghiệm sống của con người",
      description: "Không chỉ là sự kiện, mà là những quyết định và cảm xúc đằng sau chúng.",
    },
    {
      icon: "💡",
      title: "Phát triển tư duy phản biện và suy ngẫm",
      description: "Học cách đặt câu hỏi, phân tích và hình thành quan điểm riêng.",
    },
    {
      icon: "🌏",
      title: "Tôn trọng đa dạng văn hóa và phức tạp lịch sử",
      description: "Khám phá nhiều góc nhìn và hiểu rằng lịch sử không đơn giản.",
    },
    {
      icon: "🔗",
      title: "Kết nối quyết định quá khứ với thực tế hiện tại",
      description: "Thấy được cách lịch sử định hình thế giới chúng ta đang sống.",
    },
  ];

  return (
    <section className="py-20 md:py-32 bg-[var(--bg-deep)] relative">
      {/* Top decorative line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-[var(--border-default)]" />

      <Container>
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Opening statement */}
          <div className="text-center space-y-6">
            <p className="text-2xl md:text-3xl text-[var(--text-primary)] font-medium">
              HistoryTalk không nói cho bạn phải nghĩ gì.
            </p>
            <p className="text-xl md:text-2xl text-[var(--accent-gold)]">
              Nó giúp bạn:
            </p>
          </div>

          {/* Impact grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {impacts.map((impact, index) => (
              <FeatureCard
                key={index}
                icon={impact.icon}
                title={impact.title}
                description={impact.description}
              />
            ))}
          </div>

          {/* Closing statement */}
          <div className="bg-[var(--bg-surface)] border border-[var(--accent-gold)]/20 rounded-[var(--radius-lg)] p-8 md:p-12 text-center space-y-4">
            <p className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">
              HistoryTalk không dạy câu trả lời.
            </p>
            <p className="text-2xl md:text-3xl font-bold text-[var(--accent-gold)]">
              Nó dạy sự hiểu biết.
            </p>
          </div>
        </div>
      </Container>

      {/* Bottom decorative line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-[var(--border-default)]" />
    </section>
  );
}