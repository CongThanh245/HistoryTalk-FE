export default function MarketingPage() {
  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 md:py-32">
        <div className="text-center space-y-8">
          <h1 className="text-5xl md:text-7xl font-bold">
            <span className="bg-gradient-to-br from-[#c9a24d] to-[#e2c77a] bg-clip-text text-transparent">
              Khám Phá Lịch Sử
            </span>
            <br />
            <span className="text-[#e7ddc8]">
              Qua Cuộc Trò Chuyện
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-[#9a948c] max-w-3xl mx-auto">
            Trò chuyện trực tiếp với các nhân vật lịch sử, khám phá những câu chuyện 
            chưa kể và trải nghiệm lịch sử theo cách hoàn toàn mới.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button className="
              group relative inline-flex items-center gap-2 px-8 py-4
              bg-gradient-to-br from-[#c9a24d] to-[#c46a2f]
              text-[#0e1a2b] text-lg font-semibold
              rounded-[10px] shadow-[0_8px_24px_rgba(201,162,77,0.35)]
              hover:shadow-[0_12px_32px_rgba(201,162,77,0.45)]
              hover:-translate-y-1
              transition-all duration-300
              overflow-hidden
            ">
              <span className="absolute inset-0 -left-full group-hover:left-full transition-all duration-500 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              <span className="relative">Bắt Đầu Ngay</span>
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 16 16" 
                fill="none"
                className="relative group-hover:translate-x-1 transition-transform"
              >
                <path 
                  d="M6 3L11 8L6 13" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            <button className="
              px-8 py-4 text-lg font-medium
              text-[#e7ddc8] border-2 border-[#c9a24d]/30
              rounded-[10px]
              hover:bg-[#c9a24d]/10 hover:border-[#c9a24d]
              transition-all duration-300
            ">
              Xem Demo
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-[#1a2436] border border-white/10 rounded-[16px] p-8 hover:border-[#c9a24d]/30 transition-all duration-300">
            <div className="text-4xl mb-4">🎭</div>
            <h3 className="text-2xl font-bold text-[#e7ddc8] mb-3">
              Nhân Vật Thật
            </h3>
            <p className="text-[#9a948c]">
              Trò chuyện với các vĩ nhân lịch sử như Napoleon, Cleopatra, Einstein và nhiều hơn nữa.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-[#1a2436] border border-white/10 rounded-[16px] p-8 hover:border-[#c9a24d]/30 transition-all duration-300">
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="text-2xl font-bold text-[#e7ddc8] mb-3">
              AI Thông Minh
            </h3>
            <p className="text-[#9a948c]">
              Công nghệ AI tiên tiến mang đến cuộc trò chuyện chân thực và sâu sắc.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-[#1a2436] border border-white/10 rounded-[16px] p-8 hover:border-[#c9a24d]/30 transition-all duration-300">
            <div className="text-4xl mb-4">📚</div>
            <h3 className="text-2xl font-bold text-[#e7ddc8] mb-3">
              Học Qua Trải Nghiệm
            </h3>
            <p className="text-[#9a948c]">
              Cách học lịch sử thú vị và tương tác chưa từng có, phù hợp mọi lứa tuổi.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <div className="bg-gradient-to-br from-[#1a2436] to-[#24314a] border border-[#c9a24d]/20 rounded-[24px] p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-[#e7ddc8] mb-4">
            Sẵn Sàng Khám Phá?
          </h2>
          <p className="text-xl text-[#9a948c] mb-8">
            Tham gia hàng ngàn người đang trải nghiệm lịch sử theo cách mới.
          </p>
          <button className="
            group relative inline-flex items-center gap-2 px-8 py-4
            bg-gradient-to-br from-[#c9a24d] to-[#c46a2f]
            text-[#0e1a2b] text-lg font-semibold
            rounded-[10px] shadow-[0_8px_24px_rgba(201,162,77,0.35)]
            hover:shadow-[0_12px_32px_rgba(201,162,77,0.45)]
            hover:-translate-y-1
            transition-all duration-300
            overflow-hidden
          ">
            <span className="absolute inset-0 -left-full group-hover:left-full transition-all duration-500 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <span className="relative">Dùng Thử Miễn Phí</span>
          </button>
        </div>
      </section>
    </div>
  );
}