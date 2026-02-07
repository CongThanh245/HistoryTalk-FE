import { Container } from "../container";
import { SectionHeading } from "../section-heading";

export function SolutionSection() {
  const solutions = [
    {
      old: "Đọc về nhân vật lịch sử",
      new: "Trò chuyện với họ",
    },
    {
      old: "Ghi nhớ kết quả",
      new: "Khám phá động lực",
    },
    {
      old: "Một câu chuyện chính thống",
      new: "Nhiều góc nhìn",
    },
  ];

  return (
    <section className="py-20 md:py-32 bg-[var(--bg-main)] relative">
      <Container>
        <SectionHeading
          title="Biến lịch sử thành cuộc trò chuyện"
          subtitle="HistoryTalk chuyển đổi lịch sử từ nội dung tĩnh thành đối thoại sống động."
        />

        <div className="max-w-4xl mx-auto space-y-12">
          {/* Transformation grid */}
          <div className="space-y-6">
            {solutions.map((item, index) => (
              <div
                key={index}
                className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[var(--radius-lg)] p-6 md:p-8 hover:border-[var(--accent-gold)]/30 transition-all duration-300"
              >
                <div className="grid md:grid-cols-2 gap-6 items-center">
                  {/* Old way */}
                  <div className="space-y-2">
                    <p className="text-sm text-[var(--text-muted)] uppercase tracking-wider">
                      Thay vì
                    </p>
                    <p className="text-lg text-[var(--text-secondary)] line-through">
                      {item.old}
                    </p>
                  </div>

                  {/* Arrow */}
                  <div className="hidden md:flex justify-center">
                    <svg 
                      width="40" 
                      height="40" 
                      viewBox="0 0 24 24" 
                      fill="none"
                      className="text-[var(--accent-gold)]"
                    >
                      <path 
                        d="M5 12h14m0 0l-7-7m7 7l-7 7" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>

                  {/* New way */}
                  <div className="space-y-2">
                    <p className="text-sm text-[var(--accent-gold)] uppercase tracking-wider font-medium">
                      Bạn sẽ
                    </p>
                    <p className="text-lg md:text-xl text-[var(--text-primary)] font-medium">
                      {item.new}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Key message */}
          <div className="bg-[var(--bg-surface)] border border-[var(--accent-gold)]/20 rounded-[var(--radius-lg)] p-8 md:p-12 text-center">
            <p className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-4">
              Bạn không còn ở ngoài lịch sử.
            </p>
            <p className="text-2xl md:text-3xl font-bold text-[var(--accent-gold)]">
              Bạn đang ở trong cuộc trò chuyện.
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}