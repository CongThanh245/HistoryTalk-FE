"use client";

import React, { useState, useEffect } from "react";
import { 
  UserIcon, CheckIcon, TrophyIcon, FlameIcon, PlayIcon, ChatTextIcon, MapPinIcon, SparkleIcon, 
  QuestionIcon, CaretRightIcon, WarningIcon, HeartIcon, LightningIcon, 
  ClockCounterClockwiseIcon, ArrowClockwiseIcon 
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils/cn";

interface InteractivePreviewProps {
  blockIndex: number; // 0 for Chat features, 1 for Quiz features
  stepIndex: number;  // 0, 1, or 2 for current active step
}

export function InteractivePreview({ blockIndex, stepIndex }: InteractivePreviewProps) {
  // Common states for interactions
  const [selectedAvatar, setSelectedAvatar] = useState<number | null>(null);
  const [profileName, setProfileName] = useState("Sĩ tử chí lớn");
  const [selectedBattle, setSelectedBattle] = useState<string>("bachdang");
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "ai" | "user"; text: string; time: string }>>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedQuizOption, setSelectedQuizOption] = useState<number | null>(null);
  const [isQuizSubmitted, setIsQuizSubmitted] = useState(false);
  const [streakClaimed, setStreakClaimed] = useState(false);

  // Restart chat simulation when step changes
  useEffect(() => {
    if (blockIndex === 0 && stepIndex === 2) {
      setChatMessages([
        { sender: "ai", text: "Hỡi hào kiệt trẻ tuổi, ta là Ngô Quyền! Ngươi muốn nghe về kế sách cắm cọc gỗ trên sông Bạch Đằng đánh tan quân Nam Hán năm 938 chăng?", time: "Vừa xong" }
      ]);
      setIsTyping(false);
    }
  }, [blockIndex, stepIndex]);

  // Handle battle map interaction
  const battles = [
    { id: "bachdang", name: "Sông Bạch Đằng", year: "938", commander: "Ngô Quyền", x: "32%", y: "45%", desc: "Trận chiến lừng lẫy tiêu diệt hoàn toàn quân xâm lược nhờ kế sách cắm cọc gỗ dưới lòng sông." },
    { id: "chilang", name: "Ải Chi Lăng", year: "1427", commander: "Lê Lợi", x: "48%", y: "25%", desc: "Bẫy mai phục hiểm trở tiêu diệt danh tướng Liễu Thăng, đập tan ý chí xâm lược nhà Minh." },
    { id: "dienbienphu", name: "Điện Biên Phủ", year: "1954", commander: "Võ Nguyên Giáp", x: "18%", y: "30%", desc: "Chiến thắng 'lừng lẫy năm châu, chấn động địa cầu' chấm dứt ách đô hộ của thực dân Pháp." }
  ];

  const handleSimulateChat = () => {
    if (isTyping || chatMessages.length >= 4) return;
    setIsTyping(true);
    setTimeout(() => {
      setChatMessages(prev => [
        ...prev,
        { sender: "user", text: "Hùng dũng quá thưa Tiền Ngô Vương! Làm sao Ngài biết lúc nào thủy triều sẽ rút để dụ địch?", time: "Vừa xong" }
      ]);
      setIsTyping(false);
      
      // AI reply
      setTimeout(() => {
        setIsTyping(true);
        setTimeout(() => {
          setChatMessages(prev => [
            ...prev,
            { sender: "ai", text: "Ta đã cho người đo đạc kỹ con nước mỗi ngày. Khi nước dâng cao che lấp cọc nhọn, ta giả vờ thua chạy. Khi triều rút nhanh, thuyền địch mắc cạn vào cọc nhọn sắt chính là lúc tổng tiến công!", time: "Vừa xong" }
          ]);
          setIsTyping(false);
        }, 1500);
      }, 800);
    }, 1000);
  };

  const handleResetChat = () => {
    setChatMessages([
      { sender: "ai", text: "Hỡi hào kiệt trẻ tuổi, ta là Ngô Quyền! Ngươi muốn nghe về kế sách cắm cọc gỗ trên sông Bạch Đằng đánh tan quân Nam Hán năm 938 chăng?", time: "Vừa xong" }
    ]);
  };

  const currentBattleInfo = battles.find(b => b.id === selectedBattle) || battles[0];

  // ----------------------------------------------------
  // RENDER: CHAT SYSTEM PREVIEWS (BLOCK INDEX 0)
  // ----------------------------------------------------
  if (blockIndex === 0) {
    // STEP 1: CREATE ACCOUNT & AVATAR SELECTOR
    if (stepIndex === 0) {
      const avatars = [
        { id: 1, name: "Trần Hưng Đạo", label: "Hưng Đạo Vương", img: "🛡️" },
        { id: 2, name: "Hai Bà Trưng", label: "Nữ Vương Khởi Nghĩa", img: "🐘" },
        { id: 3, name: "Quang Trung", label: "Tây Sơn Thần Tốc", img: "🔥" },
        { id: 4, name: "Ngô Quyền", label: "Tiền Ngô Vương", img: "⚔️" },
      ];

      return (
        <div className="w-full h-full bg-gradient-to-br from-[#101b2d] to-[#1a2b44] p-6 sm:p-8 flex flex-col justify-between text-white animate-fadeIn">
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] tracking-widest text-[var(--accent-gold)] font-bold uppercase bg-[var(--accent-gold)]/10 px-2.5 py-1 rounded">Hồ Sơ Sử Học</span>
              <span className="text-sm text-zinc-300 flex items-center gap-1.5"><SparkleIcon className="w-4 h-4 text-[var(--accent-gold)]" /> Hoàn thành 90%</span>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300">Tên sử hữu của bạn</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={profileName} 
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full bg-[#16223a] border border-[var(--border-default)] rounded-md px-3 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-gold)] transition-colors"
                />
                <UserIcon className="absolute right-3 top-3 w-4 h-4 text-zinc-500" />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300">Chọn Anh Hùng Đồng Hành Mở Đầu</label>
              <div className="grid grid-cols-2 gap-3.5">
                {avatars.map((av) => (
                  <button
                    key={av.id}
                    onClick={() => setSelectedAvatar(av.id)}
                    className={cn(
                      "flex items-center gap-3.5 p-3.5 rounded-lg border transition-all text-left group",
                      selectedAvatar === av.id 
                        ? "bg-[#1f324d] border-[var(--accent-gold)] shadow-[0_0_12px_rgba(255,146,21,0.2)]" 
                        : "bg-[#16223a] border-[var(--border-default)] hover:border-zinc-500"
                    )}
                  >
                    <div className="w-11 h-10 rounded-full bg-[#1b2a42] flex items-center justify-center text-xl shadow-inner group-hover:scale-105 transition-transform">
                      {av.img}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-zinc-100 truncate">{av.name}</p>
                      <p className="text-[10px] text-[var(--text-secondary)] truncate">{av.label}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button className="w-full mt-5 bg-gradient-to-r from-[var(--accent-gold)] to-[#e2c77a] hover:from-[#e2c77a] hover:to-[var(--accent-gold)] text-[var(--bg-deep)] font-extrabold text-xs uppercase tracking-widest py-3.5 rounded-md shadow-lg hover:shadow-[var(--accent-gold-glow)] transition-all flex items-center justify-center gap-2">
            <span>Khai mở vận mệnh học tập</span>
            <CaretRightIcon className="w-4 h-4" />
          </button>
        </div>
      );
    }

    // STEP 2: BATTLE / MAP SELECTOR
    if (stepIndex === 1) {
      return (
        <div className="w-full h-full bg-[#0d1627] relative p-5 flex flex-col justify-between overflow-hidden text-white animate-fadeIn">
          {/* Simulated Map Canvas */}
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="w-full h-full" style={{
              backgroundImage: `radial-gradient(circle, #EA7A0A 1px, transparent 1px), linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px)`,
              backgroundSize: "20px 20px, 40px 40px"
            }} />
          </div>

          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClockCounterClockwiseIcon className="w-4 h-4 text-[var(--accent-gold)] animate-spin-slow" />
              <span className="text-xs font-bold tracking-wider uppercase text-zinc-200">Bản Đồ Chiến Tích Lịch Sử</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-[var(--accent-gold)] font-mono border border-zinc-700">VIET NAM - 3D</span>
          </div>

          {/* Interactive Map Area */}
          <div className="relative z-10 flex-1 my-4 bg-[#111c2e] border border-[var(--border-default)] rounded-lg overflow-hidden flex items-center justify-center">
            {/* Visual map shapes simulating VN */}
            <div className="absolute w-[80%] h-[90%] flex flex-col justify-between items-center py-4">
              {battles.map((bt) => (
                <button
                  key={bt.id}
                  onClick={() => setSelectedBattle(bt.id)}
                  style={{ left: bt.x, top: bt.y }}
                  className="absolute group transition-transform hover:scale-110"
                >
                  <span className="relative flex h-4.5 w-4.5">
                    <span className={cn(
                      "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                      selectedBattle === bt.id ? "bg-[var(--accent-gold)]" : "bg-sky-400"
                    )}></span>
                    <span className={cn(
                      "relative inline-flex rounded-full h-4.5 w-4.5 border-2 border-[#111c2e] items-center justify-center",
                      selectedBattle === bt.id ? "bg-[var(--accent-gold)]" : "bg-sky-500"
                    )}>
                      <MapPinIcon className="w-2.5 h-2.5 text-white" />
                    </span>
                  </span>
                  <span className="absolute left-6 -top-1 px-2 py-0.5 rounded bg-[#16223a]/95 text-[9px] font-extrabold border border-zinc-700 whitespace-nowrap opacity-70 group-hover:opacity-100 transition-opacity">
                    {bt.name} ({bt.year})
                  </span>
                </button>
              ))}
            </div>

            {/* Bottom Floating Info Drawer */}
            <div className="absolute bottom-2.5 left-2.5 right-2.5 bg-[#16223a]/95 backdrop-blur border border-[var(--accent-gold)]/30 rounded-lg p-3.5 text-left animate-slideUp">
              <div className="flex items-center justify-between mb-1.5">
                <h4 className="text-xs font-bold text-[var(--accent-gold)]">{currentBattleInfo.name} ({currentBattleInfo.year})</h4>
                <span className="text-[10px] text-zinc-400">Tướng: {currentBattleInfo.commander}</span>
              </div>
              <p className="text-[11px] text-zinc-300 leading-relaxed line-clamp-2">{currentBattleInfo.desc}</p>
            </div>
          </div>

          <div className="relative z-10 flex gap-3">
            <button className="flex-1 bg-[#16223a] border border-[var(--border-default)] hover:border-zinc-500 text-xs py-2.5 rounded font-semibold text-zinc-300 transition-colors">
              Xem Toàn Cảnh 3D
            </button>
            <button className="flex-1 bg-[var(--accent-gold)] hover:bg-[#e2c77a] text-[var(--bg-deep)] font-extrabold text-xs py-2.5 rounded transition-colors flex items-center justify-center gap-1 shadow-md hover:shadow-[var(--accent-gold-glow)]">
              <span>Trò chuyện Ngay</span>
              <CaretRightIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      );
    }

    // STEP 3: LIVE CHAT SIMULATOR
    if (stepIndex === 2) {
      return (
        <div className="w-full h-full bg-[#111a2e] border border-[var(--border-default)] p-5 flex flex-col justify-between text-white animate-fadeIn relative">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#c9a24d] to-[#EA7A0A] flex items-center justify-center text-lg shadow-md">
                ⚔️
              </div>
              <div>
                <h4 className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                  Ngô Quyền
                  <span className="w-2 h-2 rounded-full bg-green-500 inline-block animate-pulse"></span>
                </h4>
                <p className="text-[10px] text-[var(--text-secondary)]">Tiền Ngô Vương • Trận Bạch Đằng 938</p>
              </div>
            </div>
              <div className="flex gap-2">
              <button 
                onClick={handleResetChat} 
                title="Tải lại đoạn chat"
                className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 transition-colors"
              >
                <ArrowClockwiseIcon className="w-4 h-4" />
              </button>
              <span className="text-[9px] bg-[#1a2436] px-2 py-0.5 rounded text-[var(--accent-gold)] border border-yellow-500/20 font-bold flex items-center">MÔ PHỎNG AI</span>
            </div>
          </div>

          {/* Message Area */}
          <div className="flex-1 overflow-y-auto py-3.5 space-y-3.5 thin-scroll flex flex-col justify-end min-h-0">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={cn(
                  "max-w-[85%] rounded-lg p-3 text-[12px] leading-relaxed animate-slideUp",
                  msg.sender === "ai"
                    ? "bg-[#1a2436] border border-yellow-500/10 text-zinc-100 self-start rounded-tl-none"
                    : "bg-[var(--accent-gold)] text-[var(--bg-deep)] font-extrabold self-end rounded-tr-none shadow-md"
                )}
              >
                <p>{msg.text}</p>
                <span className={cn(
                  "block text-[9px] mt-1.5 text-right",
                  msg.sender === "ai" ? "text-zinc-500" : "text-[var(--bg-deep)]/70"
                )}>{msg.time}</span>
              </div>
            ))}

            {isTyping && (
              <div className="bg-[#1a2436] border border-yellow-500/10 text-zinc-300 rounded-lg rounded-tl-none p-3 self-start max-w-[80%] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: "0ms" }}></span>
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: "150ms" }}></span>
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: "300ms" }}></span>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="border-t border-[var(--border-default)] pt-3.5">
            {chatMessages.length < 3 ? (
              <button 
                onClick={handleSimulateChat}
                disabled={isTyping}
                className="w-full bg-[#1a2436] hover:bg-[#202e47] border border-[var(--accent-gold)]/40 hover:border-[var(--accent-gold)] text-xs text-[var(--accent-gold)] font-extrabold py-2.5 px-3.5 rounded flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(201,162,77,0.05)] active:scale-95"
              >
                <ChatTextIcon className="w-4 h-4" />
                <span>Bấm vào đây để đối thoại với Ngô Quyền!</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 text-[11px] text-zinc-400 justify-center py-1.5">
                <SparkleIcon className="w-4 h-4 text-[var(--accent-gold)] animate-pulse" />
                <span>Lịch sử đã mở rộng! Bạn vừa hoàn thành bài đối thoại.</span>
              </div>
            )}
          </div>
        </div>
      );
    }
  }

  // ----------------------------------------------------
  // RENDER: QUIZ & STUDY PREVIEWS (BLOCK INDEX 1)
  // ----------------------------------------------------
  if (blockIndex === 1) {
    // STEP 1: INTERACTIVE QUIZ CARD
    if (stepIndex === 0) {
      const quizQuestion = {
        question: "Trong trận chiến Bạch Đằng lịch sử năm 938, Ngô Quyền đã dùng mưu kế gì độc đáo để đập tan hạm đội quân Nam Hán?",
        options: [
          "Bày trận hỏa công thiêu rụi chiến thuyền địch",
          "Cắm cọc gỗ nhọn bịt sắt dưới lòng sông rồi nhử địch lúc triều lên",
          "Xây đê chắn nước dâng để nhấn chìm toàn bộ đại doanh địch",
          "Mai phục bắn cung tên tẩm thuốc độc từ các vách đá ven sông"
        ],
        correct: 1,
        explanation: "Chính xác! Ngô Quyền đã lợi dụng hiện tượng thủy triều lên xuống để cắm cọc nhọn bịt sắt ẩn dưới lòng sông Bạch Đằng, lừa hạm đội giặc vào bẫy mai phục rồi phản công khi triều rút."
      };

      const handleOptionClick = (idx: number) => {
        if (isQuizSubmitted) return;
        setSelectedQuizOption(idx);
        setIsQuizSubmitted(true);
      };

      const handleResetQuiz = () => {
        setSelectedQuizOption(null);
        setIsQuizSubmitted(false);
      };

      return (
        <div className="w-full h-full bg-gradient-to-b from-[#111e30] to-[#0c1626] p-5 sm:p-7 flex flex-col justify-between text-white animate-fadeIn">
          <div>
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5 mb-4">
              <span className="text-[11px] font-bold text-[var(--accent-gold)] flex items-center gap-1.5 uppercase">
                <QuestionIcon className="w-4 h-4" /> Thử Thách Quiz Chớp Nhoáng
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 font-extrabold">+15 XP</span>
            </div>

            <p className="text-[12.5px] sm:text-sm leading-relaxed font-extrabold text-zinc-100 mb-4">
              {quizQuestion.question}
            </p>

            <div className="space-y-2.5">
              {quizQuestion.options.map((opt, idx) => {
                let btnStyle = "bg-[#16223a] border-zinc-800 hover:border-zinc-700 text-zinc-300";
                let iconEl = null;

                if (isQuizSubmitted) {
                  if (idx === quizQuestion.correct) {
                    btnStyle = "bg-emerald-950/80 border-emerald-500/60 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.15)]";
                    iconEl = <CheckIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
                  } else if (idx === selectedQuizOption) {
                    btnStyle = "bg-rose-950/80 border-rose-500/60 text-rose-300";
                    iconEl = <WarningIcon className="w-3.5 h-3.5 text-rose-400 shrink-0" />;
                  } else {
                    btnStyle = "bg-[#16223a]/40 border-zinc-900/50 text-zinc-500 opacity-60";
                  }
                } else if (selectedQuizOption === idx) {
                  btnStyle = "bg-[#1f324d] border-[var(--accent-gold)] text-white";
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleOptionClick(idx)}
                    disabled={isQuizSubmitted}
                    className={cn(
                      "w-full text-left p-3 rounded-lg border text-xs sm:text-[13px] leading-relaxed flex items-center justify-between gap-3.5 transition-all",
                      !isQuizSubmitted && "hover:bg-[#1e2d48] hover:translate-x-1",
                      btnStyle
                    )}
                  >
                    <span>{opt}</span>
                    {iconEl}
                  </button>
                );
              })}
            </div>
          </div>

          {isQuizSubmitted ? (
            <div className="mt-4 bg-zinc-900/40 border border-zinc-800 p-3 rounded text-[11px] sm:text-xs leading-relaxed text-zinc-300 animate-fadeIn">
              <span className="font-bold text-[var(--accent-gold)] block mb-1">💡 Kiến giải lịch sử:</span>
              <p>{quizQuestion.explanation}</p>
              <button 
                onClick={handleResetQuiz}
                className="text-[10px] text-[var(--accent-gold)] underline font-bold mt-2.5 hover:text-[#e2c77a] block ml-auto"
              >
                Thử lại câu hỏi khác
              </button>
            </div>
          ) : (
            <p className="text-[10px] text-zinc-500 text-center mt-4">Chọn một phương án để kiểm nghiệm sử thức!</p>
          )}
        </div>
      );
    }

    // STEP 2: SUMMARY & RESULTS DASHBOARD
    if (stepIndex === 1) {
      return (
        <div className="w-full h-full bg-[#0f192b] p-6 sm:p-8 flex flex-col justify-between text-white animate-fadeIn">
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-400 uppercase bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/25">Hoàn Thành!</span>
              <span className="text-xs text-zinc-400">Hôm nay, 08:30</span>
            </div>

            {/* Score Ring & Circle Banner */}
            <div className="flex items-center gap-5 bg-[#16223a] p-4.5 rounded-xl border border-[var(--border-default)]">
              <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                <svg className="absolute w-full h-full transform -rotate-90">
                  <circle cx="32" cy="32" r="28" stroke="rgba(255,255,255,0.05)" strokeWidth="5" fill="transparent" />
                  <circle cx="32" cy="32" r="28" stroke="var(--accent-gold)" strokeWidth="5" fill="transparent" 
                    strokeDasharray={175} strokeDashoffset={175 - (175 * 100) / 100} strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="text-center">
                  <span className="text-sm font-extrabold block text-[var(--text-primary)]">10/10</span>
                  <span className="text-[9px] text-zinc-400 uppercase tracking-widest">Đúng</span>
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                  Trận Bạch Đằng (938) <TrophyIcon className="w-4 h-4 text-[var(--accent-gold)] animate-bounce" />
                </h4>
                <p className="text-xs text-zinc-300">Nhận: <span className="text-[var(--accent-gold)] font-bold">+150 XP</span> & <span className="text-yellow-500 font-bold">+20 Sử Ngọc</span></p>
                <div className="flex items-center gap-1.5 pt-1.5">
                  <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold">100% Khớp</span>
                  <span className="text-[9px] px-2 py-0.5 rounded bg-[#1f324d] text-sky-300 font-semibold">Trạng Nguyên</span>
                </div>
              </div>
            </div>

            {/* Question status blocks */}
            <div className="space-y-2">
              <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">Kiểm tra chi tiết</p>
              <div className="grid grid-cols-5 gap-2.5">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <div key={num} className="bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 rounded p-1.5 text-center font-bold text-xs flex flex-col items-center justify-center gap-0.5">
                    <span>Q{num}</span>
                    <CheckIcon className="w-3 h-3 text-emerald-400" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-3">
            <button className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-xs py-2.5 rounded font-bold text-zinc-300 transition-colors">
              Ôn Lại Câu Sai
            </button>
            <button className="flex-1 bg-gradient-to-r from-[var(--accent-gold)] to-[#e2c77a] text-[var(--bg-deep)] font-extrabold text-xs py-2.5 rounded transition-colors flex items-center justify-center gap-1 shadow-md hover:shadow-[var(--accent-gold-glow)]">
              <span>Đại Lộ Sự Tích</span>
              <CaretRightIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      );
    }

    // STEP 3: DAILY STREAK CALENDAR & FIRE GLOW
    if (stepIndex === 2) {
      const weekDays = [
        { name: "T2", status: "completed", xp: "+50" },
        { name: "T3", status: "completed", xp: "+50" },
        { name: "T4", status: "completed", xp: "+50" },
        { name: "T5", status: "completed", xp: "+50" },
        { name: "T6", status: "completed", xp: "+50" },
        { name: "T7", status: "active", xp: "+100" },
        { name: "CN", status: "pending", xp: "+150" },
      ];

      return (
        <div className="w-full h-full bg-[#0a1122] p-6 sm:p-8 flex flex-col justify-between text-white animate-fadeIn relative overflow-hidden">
          {/* Glowing aura */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-[var(--accent-gold)]/5 rounded-full blur-3xl pointer-events-none" />

          <div className="text-center space-y-4 relative z-10">
            <div className="flex justify-center">
              <div className={cn(
                "w-22 h-20 rounded-full flex items-center justify-center relative transition-transform duration-500",
                streakClaimed ? "scale-110" : "animate-pulse"
              )} style={{
                background: "radial-gradient(circle, rgba(255,146,21,0.2) 0%, rgba(255,146,21,0.03) 70%)"
              }}>
                <FlameIcon className="w-12 h-12 text-[var(--accent-gold)] filter drop-shadow-[0_0_15px_rgba(255,146,21,0.6)]" />
                <span className="absolute -bottom-1 bg-gradient-to-r from-[var(--accent-gold)] to-[#e2c77a] text-[var(--bg-deep)] text-[10px] font-extrabold px-3 py-0.5 rounded-full shadow border-2 border-[#0a1122]">
                  7 NGÀY
                </span>
              </div>
            </div>

            <div className="space-y-1 pt-1.5">
              <h3 className="text-sm font-extrabold text-[var(--text-primary)]">HỎA CHÍ SỬ THỨC BÙNG CHÁY!</h3>
              <p className="text-[11px] text-zinc-400">Học tập liên tục để duy trì hào khí và thăng hạng nhân vật.</p>
            </div>

            {/* Weekly Strip */}
            <div className="grid grid-cols-7 gap-2 pt-2">
              {weekDays.map((day, idx) => (
                <div 
                  key={idx} 
                  className={cn(
                    "rounded p-2 flex flex-col items-center justify-between gap-1 border text-center transition-all",
                    day.status === "completed" 
                      ? "bg-amber-950/30 border-amber-500/40 text-[var(--accent-gold)]" 
                      : day.status === "active"
                        ? "bg-[#16223a] border-[var(--accent-gold)] text-white shadow-[0_0_10px_rgba(255,146,21,0.2)] animate-pulse"
                        : "bg-zinc-900/60 border-zinc-800 text-zinc-600"
                  )}
                >
                  <span className="text-[9px] font-bold block">{day.name}</span>
                  <div className="w-5.5 h-5.5 rounded-full bg-zinc-950/40 flex items-center justify-center text-[10px]">
                    {day.status === "completed" ? (
                      <CheckIcon className="w-3.5 h-3.5 text-[var(--accent-gold)]" />
                    ) : day.status === "active" ? (
                      <FlameIcon className="w-3.5 h-3.5 text-amber-500" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-700"></span>
                    )}
                  </div>
                  <span className="text-[8px] font-mono text-zinc-400">{day.xp}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 pt-2.5">
            <button 
              onClick={() => setStreakClaimed(true)}
              disabled={streakClaimed}
              className={cn(
                "w-full text-xs font-bold py-3 rounded-lg tracking-wider uppercase transition-all shadow-md active:scale-98 flex items-center justify-center gap-1.5",
                streakClaimed 
                  ? "bg-zinc-800 border border-zinc-700 text-zinc-500 cursor-default" 
                  : "bg-gradient-to-r from-amber-500 to-[var(--accent-gold)] text-[var(--bg-deep)] hover:brightness-110 hover:shadow-[var(--accent-gold-glow)]"
              )}
            >
              <LightningIcon className={cn("w-4 h-4", !streakClaimed && "animate-bounce")} />
              <span>{streakClaimed ? "Đã nhận quà điểm danh!" : "Nhận Quà Điểm Danh Hàng Ngày"}</span>
            </button>
          </div>
        </div>
      );
    }
  }

  // Fallback
  return (
    <div className="w-full h-full bg-[var(--bg-surface)] flex items-center justify-center text-zinc-500 text-xs">
      No Preview Available
    </div>
  );
}
