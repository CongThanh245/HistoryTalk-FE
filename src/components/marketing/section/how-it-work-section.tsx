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
    <section id="how-it-works" className="relative flex h-auto min-h-[600px] items-start overflow-hidden bg-(--bg-main) py-16 md:h-svh md:items-center md:py-0">
      <div className="absolute inset-x-0 top-0 h-px bg-(--text-primary)" />

      <div className="relative z-10 w-full py-16 md:py-0">
        <Container>
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[0.9fr_1.4fr] lg:gap-20">
            <div>
              <h2 className="archive-title mb-4 text-[clamp(2.2rem,5.5vw,4.5rem)] leading-[1.1]">
                Bốn bước
                <br />
                <em>đơn giản</em>
              </h2>
              <p className="max-w-[320px] border-t border-(--text-primary) pt-3 text-sm leading-relaxed text-(--text-secondary) lg:text-base">
                Bắt đầu hành trình khám phá lịch sử của bạn qua những cuộc đối thoại ý nghĩa.
              </p>
            </div>

            <div className="-mx-4 overflow-hidden px-4">
              <div className="max-w-5xl">
          {/* Steps — ruled grid */}
          <div className="grid border-l border-t border-(--text-primary) md:grid-cols-2">
            {steps.map((step, index) => (
              <div
                key={index}
                className="group border-b border-r border-(--text-primary) bg-(--bg-surface) p-6 transition-colors duration-200 hover:bg-(--text-primary) md:p-8"
              >
                {/* Step number & icon */}
                <div className="mb-4 flex items-center justify-between gap-4">
                  <span className="font-display text-4xl font-extrabold leading-none text-(--accent-gold) transition-colors group-hover:text-(--accent-on-ink)">
                    [{step.number}]
                  </span>
                  <span
                    aria-hidden="true"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[2px] border border-(--border-strong) text-xl grayscale transition-[filter] group-hover:grayscale-0"
                  >
                    {step.icon}
                  </span>
                </div>

                {/* Content */}
                <div className="space-y-3 border-t border-(--border-default) pt-4 group-hover:border-(--text-inverse)/20">
                  <h3 className="archive-title is-plain text-[18px] transition-colors group-hover:text-(--text-inverse) md:text-[20px]">
                    {step.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-(--text-secondary) transition-colors group-hover:text-(--text-inverse) md:text-base">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
              </div>

              {/* Bottom message */}
              <div className="mt-8 border-(--accent-gold) pl-6">
                <p className="max-w-3xl text-lg font-semibold leading-relaxed text-(--text-primary) md:text-xl">
                  Mỗi cuộc trò chuyện là độc nhất. Mỗi người học có một con đường khác nhau.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </div>

      <div className="absolute inset-x-0 bottom-0 h-px bg-(--text-primary)" />
    </section>
  );
}
