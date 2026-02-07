import { Container } from "../container";
import { SectionHeading } from "../section-heading";

export function ProblemSection() {
  const problems = [
    "Nhân vật lịch sử cảm thấy xa vời và không thực",
    "Sự kiện mất đi ý nghĩa cảm xúc",
    "Học tập trở thành ghi nhớ thay vì hiểu biết",
    "Lịch sử trở thành thứ để vượt qua kỳ thi, không phải để suy ngẫm",
  ];

  return (
    <section className="py-20 md:py-32 bg-[var(--bg-deep)] relative">
      {/* Decorative line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-[var(--border-default)]" />

      <Container>
        <SectionHeading
          title="Tại sao lịch sử cảm thấy xa vời ngày nay"
          subtitle="Trên toàn thế giới, lịch sử thường được dạy như dòng thời gian, ngày tháng và kết quả."
        />

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Main problem statement */}
          <div className="text-center space-y-4 mb-12">
            <p className="text-lg md:text-xl text-[var(--text-secondary)] leading-relaxed">
              Học sinh được yêu cầu nhớ <span className="text-[var(--text-primary)] font-medium">điều gì đã xảy ra</span> —
            </p>
            <p className="text-lg md:text-xl text-[var(--text-secondary)] leading-relaxed">
              nhưng hiếm khi được mời để hiểu <span className="text-[var(--accent-gold)] font-medium">tại sao nó xảy ra</span>.
            </p>
          </div>

          {/* As a result section */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[var(--radius-lg)] p-8 md:p-12">
            <p className="text-xl font-semibold text-[var(--accent-gold)] mb-6">
              Kết quả là:
            </p>
            
            <div className="space-y-4">
              {problems.map((problem, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--accent-gold)]/20 flex items-center justify-center mt-1">
                    <div className="w-2 h-2 rounded-full bg-[var(--accent-gold)]" />
                  </div>
                  <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
                    {problem}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Closing statement */}
          <div className="text-center pt-8">
            <p className="text-xl md:text-2xl text-[var(--text-primary)] font-medium italic">
              Lịch sử trở thành điều gì đó để vượt qua kỳ thi,<br />
              không phải điều gì đó để suy ngẫm.
            </p>
          </div>
        </div>
      </Container>

      {/* Decorative line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-[var(--border-default)]" />
    </section>
  );
}