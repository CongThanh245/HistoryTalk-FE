import { Container } from "../container";

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
    <section id="how-it-works" className="relative flex h-auto min-h-[600px] items-start overflow-hidden bg-[var(--bg-deep)] py-16 md:h-svh md:items-center md:py-0">
      <div className="absolute inset-x-0 top-0 h-px bg-[var(--border-default)]" />

      <div className="relative z-10 w-full py-16 md:py-0">
        <Container>
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[0.9fr_1.4fr] lg:gap-20">
            <div>
              <span className="mb-4 block text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-[var(--accent-gold)]">
                Cách hoạt động
              </span>
              <h2 className="mb-4 text-[clamp(2.2rem,5.5vw,5.5rem)] font-bold uppercase leading-[0.95] tracking-wide text-[var(--text-secondary)]">
                Bốn bước
                <br />
                <span className="text-[var(--accent-gold)] font-title">đơn giản</span>
              </h2>
              <p className="max-w-[320px] text-sm leading-relaxed text-[var(--text-secondary)] lg:text-base">
                Bắt đầu hành trình khám phá lịch sử của bạn qua những cuộc đối thoại ý nghĩa.
              </p>
            </div>

            <div className="-mx-4 overflow-hidden px-4">
              <div className="max-w-5xl">
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
              </div>

              {/* Bottom message */}
              <div className="mt-8 border-l-2 border-[var(--accent-gold)]/50 pl-6">
                <p className="max-w-3xl text-lg font-semibold leading-relaxed text-[var(--text-secondary)] md:text-xl">
                  Mỗi cuộc trò chuyện là độc nhất. Mỗi người học có một con đường khác nhau.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </div>

      <div className="absolute inset-x-0 bottom-0 h-px bg-[var(--border-default)]" />
    </section>
  );
}