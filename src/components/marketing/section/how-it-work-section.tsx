import { Container } from "../container";
import { SectionHeading } from "../section-heading";

export function HowItWorksSection() {
  const steps = [
    {
      number: "01",
      icon: "🎭",
      title: "Chọn nhân vật lịch sử hoặc thời đại",
      description: "Từ các nhà lãnh đạo vĩ đại đến các nghệ sĩ, nhà khoa học và chiến binh.",
    },
    {
      number: "02",
      icon: "💬",
      title: "Đặt câu hỏi tự do — không có kịch bản cố định",
      description: "Trò chuyện tự nhiên như bạn đang nói chuyện với một người thật.",
    },
    {
      number: "03",
      icon: "🔍",
      title: "Khám phá quyết định, niềm tin, xung đột và hậu quả",
      description: "Hiểu bối cảnh lịch sử từ góc nhìn của những người đã sống qua nó.",
    },
    {
      number: "04",
      icon: "🌟",
      title: "Học lịch sử như một chuỗi lựa chọn con người",
      description: "Không chỉ là sự kiện — mà là tại sao và làm thế nào chúng xảy ra.",
    },
  ];

  return (
    <section id="how-it-works" className="py-20 md:py-32 bg-[var(--bg-deep)] relative">
      {/* Top decorative line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-[var(--border-default)]" />

      <Container>
        <SectionHeading
          title="Cách hoạt động"
          subtitle="Bốn bước đơn giản để bắt đầu hành trình khám phá lịch sử của bạn"
        />

        <div className="max-w-5xl mx-auto">
          {/* Steps grid */}
          <div className="grid md:grid-cols-2 gap-8">
            {steps.map((step, index) => (
              <div
                key={index}
                className="
                  bg-[var(--bg-surface)] 
                  border border-[var(--border-default)] 
                  rounded-[var(--radius-lg)] 
                  p-8
                  hover:border-[var(--accent-gold)]/30 
                  hover:bg-[var(--bg-elevated)]
                  transition-all duration-300
                  group
                "
              >
                {/* Step number & icon */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0">
                    <div className="text-5xl group-hover:scale-110 transition-transform duration-300">
                      {step.icon}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <span className="text-4xl font-bold text-[var(--accent-gold)]/20 group-hover:text-[var(--accent-gold)]/40 transition-colors">
                      {step.number}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-[var(--text-primary)]">
                    {step.title}
                  </h3>
                  <p className="text-[var(--text-secondary)] leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom message */}
          <div className="mt-12 text-center space-y-4">
            <p className="text-xl md:text-2xl text-[var(--accent-gold)] font-medium italic">
              Mỗi cuộc trò chuyện là độc nhất.
            </p>
            <p className="text-xl md:text-2xl text-[var(--text-primary)] font-medium italic">
              Mỗi người học có một con đường khác nhau.
            </p>
          </div>
        </div>
      </Container>

      {/* Bottom decorative line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-[var(--border-default)]" />
    </section>
  );
}