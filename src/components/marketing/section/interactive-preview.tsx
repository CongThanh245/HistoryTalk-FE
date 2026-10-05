"use client";

import React, { useState, useEffect } from "react";
import { 
  User, Check, Trophy, Flame, Play, MessageCircle, MapPin, Sparkles, 
  HelpCircle, ChevronRight, AlertTriangle, Heart, Zap, 
  History, RefreshCw 
} from "lucide-react";
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
        <div className="w-full h-full bg-[var(--bg-surface)] p-6 sm:p-8 flex flex-col justify-between text-[var(--text-primary)] animate-fadeIn">
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-[var(--text-primary)] pb-3">
              <span className="text-sm text-[var(--text-secondary)] flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-[var(--accent-gold)]" /> Hoàn thành 90%</span>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">Tên sử hữu của bạn</label>
              <div className="relative">
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-[2px] px-3 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--text-primary)] transition-colors"
                />
                <User className="absolute right-3 top-3 w-4 h-4 text-[var(--text-muted)]" />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">Chọn Anh Hùng Đồng Hành Mở Đầu</label>
              <div className="grid grid-cols-2 gap-3.5">
                {avatars.map((av) => (
                  <button
                    key={av.id}
                    onClick={() => setSelectedAvatar(av.id)}
                    className={cn(
                      "flex items-center gap-3.5 p-3.5 rounded-[2px] border transition-colors text-left group",
                      selectedAvatar === av.id
                        ? "bg-[var(--text-primary)] border-[var(--text-primary)] text-[var(--text-inverse)]"
                        : "bg-[var(--bg-elevated)] border-[var(--border-strong)] text-[var(--text-primary)] hover:border-[var(--text-primary)]"
                    )}
                  >
                    <div className="w-11 h-10 rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)] flex items-center justify-center text-xl group-hover:scale-105 transition-transform">
                      {av.img}
                    </div>
                    <div className="min-w-0">
                      <p className="archive-title is-plain text-[15px] text-current truncate">{av.name}</p>
                      <p className={cn(
                        "text-[10px] truncate",
                        selectedAvatar === av.id ? "text-[var(--text-inverse)] opacity-75" : "text-[var(--text-tertiary)]"
                      )}>{av.label}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button className="btn-crimson w-full mt-5 text-xs tracking-widest py-3.5">
            <span>Khai mở vận mệnh học tập</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      );
    }

    // STEP 2: BATTLE / MAP SELECTOR
    if (stepIndex === 1) {
      return (
        <div className="w-full h-full bg-[var(--bg-surface)] relative p-5 flex flex-col justify-between overflow-hidden text-[var(--text-primary)] animate-fadeIn">
          {/* Simulated Map Canvas */}
          <div className="absolute inset-0 opacity-60 pointer-events-none">
            <div className="w-full h-full" style={{
              backgroundImage: `radial-gradient(circle, color-mix(in srgb, var(--accent-gold) 35%, transparent) 1px, transparent 1px), linear-gradient(color-mix(in srgb, var(--text-primary) 6%, transparent) 1px, transparent 1px)`,
              backgroundSize: "20px 20px, 40px 40px"
            }} />
          </div>

          <div className="relative z-10 flex items-center justify-between border-b border-[var(--text-primary)] pb-3">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-[var(--accent-gold)] animate-spin-slow" />
              <span className="font-display text-[15px] font-extrabold tracking-[0.04em] uppercase text-[var(--text-primary)]">Bản Đồ Chiến Tích Lịch Sử</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-[2px] bg-[var(--bg-elevated)] text-[var(--gold-on-light)] font-mono font-bold border border-[var(--border-strong)]">VIET NAM - 3D</span>
          </div>

          {/* Interactive Map Area */}
          <div className="relative z-10 flex-1 my-4 bg-[var(--bg-elevated)] border border-[var(--text-primary)] rounded-[2px] overflow-hidden flex items-center justify-center">
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
                      selectedBattle === bt.id ? "bg-[var(--accent-gold)]" : "bg-[var(--text-tertiary)]"
                    )}></span>
                    <span className={cn(
                      "relative inline-flex rounded-full h-4.5 w-4.5 border-2 border-[var(--bg-elevated)] items-center justify-center",
                      selectedBattle === bt.id ? "bg-[var(--accent-gold)]" : "bg-[var(--text-secondary)]"
                    )}>
                      <MapPin className="w-2.5 h-2.5 text-[var(--bg-elevated)]" />
                    </span>
                  </span>
                  <span className={cn(
                    "absolute left-6 -top-1 px-2 py-0.5 rounded-[2px] text-[9px] font-extrabold border whitespace-nowrap transition-opacity",
                    selectedBattle === bt.id
                      ? "bg-[var(--text-primary)] border-[var(--text-primary)] text-[var(--text-inverse)] opacity-100"
                      : "bg-[var(--bg-surface)] border-[var(--border-strong)] text-[var(--text-primary)] opacity-70 group-hover:opacity-100"
                  )}>
                    {bt.name} ({bt.year})
                  </span>
                </button>
              ))}
            </div>

            {/* Bottom Floating Info Drawer */}
            <div className="absolute bottom-2.5 left-2.5 right-2.5 bg-[var(--bg-surface)] border border-[var(--text-primary)] rounded-[2px] p-3.5 text-left shadow-[var(--shadow-soft)] animate-slideUp">
              <div className="flex items-center justify-between mb-1.5">
                <h4 className="archive-title is-plain text-[17px] text-[var(--gold-on-light)]">{currentBattleInfo.name} ({currentBattleInfo.year})</h4>
                <span className="text-[10px] text-[var(--text-tertiary)]">Tướng: {currentBattleInfo.commander}</span>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed line-clamp-2">{currentBattleInfo.desc}</p>
            </div>
          </div>

          <div className="relative z-10 flex gap-3">
            <button className="btn-line flex-1 text-xs min-h-0 py-2.5 px-3">
              Xem Toàn Cảnh 3D
            </button>
            <button className="btn-crimson flex-1 text-xs min-h-0 py-2.5 px-3 gap-1">
              <span>Trò chuyện Ngay</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      );
    }

    // STEP 3: LIVE CHAT SIMULATOR
    if (stepIndex === 2) {
      return (
        <div className="w-full h-full bg-[var(--bg-surface)] border border-[var(--text-primary)] p-5 flex flex-col justify-between text-[var(--text-primary)] animate-fadeIn relative">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--text-primary)] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full border border-[var(--text-primary)] bg-[var(--bg-elevated)] flex items-center justify-center text-lg">
                ⚔️
              </div>
              <div>
                <h4 className="archive-title is-plain text-[17px] flex items-center gap-1.5">
                  Ngô Quyền
                  <span className="w-2 h-2 rounded-full bg-[var(--status-success)] inline-block animate-pulse"></span>
                </h4>
                <p className="text-[10px] text-[var(--text-tertiary)]">Tiền Ngô Vương • Trận Bạch Đằng 938</p>
              </div>
            </div>
              <div className="flex gap-2">
              <button
                onClick={handleResetChat}
                title="Tải lại đoạn chat"
                className="p-1.5 rounded-[2px] border border-transparent hover:border-[var(--text-primary)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <span className="text-[9px] bg-[var(--accent-gold-active-bg)] px-2 py-0.5 rounded-[2px] text-[var(--gold-on-light)] border border-[var(--accent-gold)] font-bold tracking-[0.1em] flex items-center">MÔ PHỎNG AI</span>
            </div>
          </div>

          {/* Message Area */}
          <div className="flex-1 overflow-y-auto py-3.5 space-y-3.5 thin-scroll flex flex-col justify-end min-h-0">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={cn(
                  "max-w-[85%] rounded-[2px] border p-3 text-[12px] leading-relaxed animate-slideUp",
                  msg.sender === "ai"
                    ? "bg-[var(--bg-elevated)] border-[var(--border-strong)] text-[var(--text-secondary)] self-start"
                    : "bg-[var(--text-primary)] border-[var(--text-primary)] text-[var(--text-inverse)] font-semibold self-end"
                )}
              >
                <p>{msg.text}</p>
                <span className={cn(
                  "block text-[9px] mt-1.5 text-right",
                  msg.sender === "ai" ? "text-[var(--text-muted)]" : "text-[var(--text-inverse)] opacity-70"
                )}>{msg.time}</span>
              </div>
            ))}

            {isTyping && (
              <div className="bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-[2px] p-3 self-start max-w-[80%] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)] animate-bounce [animation-delay:0ms]"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)] animate-bounce [animation-delay:150ms]"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)] animate-bounce [animation-delay:300ms]"></span>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="border-t border-[var(--text-primary)] pt-3.5">
            {chatMessages.length < 3 ? (
              <button
                onClick={handleSimulateChat}
                disabled={isTyping}
                className="w-full bg-transparent hover:bg-[var(--text-primary)] border border-[var(--text-primary)] text-xs text-[var(--text-primary)] hover:text-[var(--text-inverse)] font-bold py-2.5 px-3.5 rounded-[2px] flex items-center justify-center gap-2 transition-colors active:scale-95 disabled:opacity-60"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Bấm vào đây để đối thoại với Ngô Quyền!</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 text-[11px] text-[var(--text-tertiary)] justify-center py-1.5">
                <Sparkles className="w-4 h-4 text-[var(--accent-gold)] animate-pulse" />
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
        <div className="w-full h-full bg-[var(--bg-surface)] p-5 sm:p-7 flex flex-col justify-between text-[var(--text-primary)] animate-fadeIn">
          <div>
            <div className="flex items-center justify-between border-b border-[var(--text-primary)] pb-2.5 mb-4">
              <span className="text-[11px] font-bold tracking-[0.1em] text-[var(--gold-on-light)] flex items-center gap-1.5 uppercase">
                <HelpCircle className="w-4 h-4" /> Thử Thách Quiz Chớp Nhoáng
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-[2px] bg-[var(--accent-gold-active-bg)] text-[var(--gold-on-light)] border border-[var(--accent-gold)] font-extrabold">+15 XP</span>
            </div>

            <p className="text-[12.5px] sm:text-sm leading-relaxed font-bold text-[var(--text-primary)] mb-4">
              {quizQuestion.question}
            </p>

            <div className="space-y-2.5">
              {quizQuestion.options.map((opt, idx) => {
                let btnStyle = "bg-[var(--bg-elevated)] border-[var(--border-strong)] text-[var(--text-secondary)]";
                let iconEl = null;

                if (isQuizSubmitted) {
                  if (idx === quizQuestion.correct) {
                    btnStyle = "bg-[var(--status-success-bg)] border-[var(--status-success)] text-[var(--status-success)] font-semibold";
                    iconEl = <Check className="w-3.5 h-3.5 text-[var(--status-success)] shrink-0" />;
                  } else if (idx === selectedQuizOption) {
                    btnStyle = "bg-[var(--status-danger-bg)] border-[var(--accent-danger)] text-[var(--accent-danger)]";
                    iconEl = <AlertTriangle className="w-3.5 h-3.5 text-[var(--accent-danger)] shrink-0" />;
                  } else {
                    btnStyle = "bg-[var(--bg-elevated)] border-[var(--border-default)] text-[var(--text-muted)] opacity-60";
                  }
                } else if (selectedQuizOption === idx) {
                  btnStyle = "bg-[var(--text-primary)] border-[var(--text-primary)] text-[var(--text-inverse)]";
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleOptionClick(idx)}
                    disabled={isQuizSubmitted}
                    className={cn(
                      "w-full text-left p-3 rounded-[2px] border text-xs sm:text-[13px] leading-relaxed flex items-center justify-between gap-3.5 transition-colors",
                      !isQuizSubmitted && "hover:border-[var(--text-primary)] hover:text-[var(--text-primary)]",
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
            <div className="mt-4 bg-[var(--bg-elevated)] border-[var(--accent-gold)] p-3 rounded-[2px] text-[11px] sm:text-xs leading-relaxed text-[var(--text-secondary)] animate-fadeIn">
              <span className="font-bold text-[var(--gold-on-light)] block mb-1">💡 Kiến giải lịch sử:</span>
              <p>{quizQuestion.explanation}</p>
              <button
                onClick={handleResetQuiz}
                className="archive-link text-[10px] mt-2.5 flex w-fit ml-auto"
              >
                Thử lại câu hỏi khác
              </button>
            </div>
          ) : (
            <p className="text-[10px] text-[var(--text-muted)] text-center mt-4">Chọn một phương án để kiểm nghiệm sử thức!</p>
          )}
        </div>
      );
    }

    // STEP 2: SUMMARY & RESULTS DASHBOARD
    if (stepIndex === 1) {
      return (
        <div className="w-full h-full bg-[var(--bg-surface)] p-6 sm:p-8 flex flex-col justify-between text-[var(--text-primary)] animate-fadeIn">
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-[var(--text-primary)] pb-3">
              <span className="text-[11px] font-bold tracking-[0.1em] text-[var(--status-success)] uppercase bg-[var(--status-success-bg)] px-2.5 py-0.5 rounded-[2px] border border-[var(--status-success-border)]">Hoàn Thành!</span>
              <span className="text-xs text-[var(--text-tertiary)]">Hôm nay, 08:30</span>
            </div>

            {/* Score Ring & Circle Banner */}
            <div className="flex items-center gap-5 bg-[var(--bg-elevated)] p-4.5 rounded-[2px] border border-[var(--text-primary)]">
              <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                <svg className="absolute w-full h-full transform -rotate-90">
                  <circle cx="32" cy="32" r="28" stroke="var(--border-default)" strokeWidth="5" fill="transparent" />
                  <circle cx="32" cy="32" r="28" stroke="var(--accent-gold)" strokeWidth="5" fill="transparent"
                    strokeDasharray={175} strokeDashoffset={175 - (175 * 100) / 100} strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="text-center">
                  <span className="font-display text-base font-extrabold block text-[var(--text-primary)]">10/10</span>
                  <span className="text-[9px] text-[var(--text-tertiary)] uppercase tracking-widest">Đúng</span>
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="archive-title is-plain text-[17px] flex items-center gap-1.5">
                  Trận Bạch Đằng (938) <Trophy className="w-4 h-4 text-[var(--accent-gold)] animate-bounce" />
                </h4>
                <p className="text-xs text-[var(--text-secondary)]">Nhận: <span className="text-[var(--gold-on-light)] font-bold">+150 XP</span> & <span className="text-[var(--status-warning)] font-bold">+20 Sử Ngọc</span></p>
                <div className="flex items-center gap-1.5 pt-1.5">
                  <span className="text-[9px] px-2 py-0.5 rounded-[2px] bg-[var(--status-success-bg)] text-[var(--status-success)] font-bold">100% Khớp</span>
                  <span className="text-[9px] px-2 py-0.5 rounded-[2px] bg-[var(--text-primary)] text-[var(--text-inverse)] font-semibold">Trạng Nguyên</span>
                </div>
              </div>
            </div>

            {/* Question status blocks */}
            <div className="space-y-2">
              <p className="text-[10px] uppercase font-bold tracking-[0.1em] text-[var(--text-tertiary)]">Kiểm tra chi tiết</p>
              <div className="grid grid-cols-5 gap-2.5">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <div key={num} className="bg-[var(--status-success-bg)] border border-[var(--status-success-border)] text-[var(--status-success)] rounded-[2px] p-1.5 text-center font-bold text-xs flex flex-col items-center justify-center gap-0.5">
                    <span>Q{num}</span>
                    <Check className="w-3 h-3 text-[var(--status-success)]" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-3">
            <button className="btn-line flex-1 text-xs min-h-0 py-2.5 px-3">
              Ôn Lại Câu Sai
            </button>
            <button className="btn-crimson flex-1 text-xs min-h-0 py-2.5 px-3 gap-1">
              <span>Đại Lộ Sự Tích</span>
              <ChevronRight className="w-3.5 h-3.5" />
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
        <div className="w-full h-full bg-[var(--bg-surface)] p-6 sm:p-8 flex flex-col justify-between text-[var(--text-primary)] animate-fadeIn relative overflow-hidden">
          <div className="text-center space-y-4 relative z-10">
            <div className="flex justify-center">
              <div className={cn(
                "w-22 h-20 rounded-[2px] border border-[var(--accent-gold)] bg-[var(--accent-gold-active-bg)] flex items-center justify-center relative transition-transform duration-500",
                streakClaimed ? "scale-110" : "animate-pulse"
              )}>
                <Flame className="w-12 h-12 text-[var(--accent-gold)]" />
                <span className="absolute -bottom-2.5 bg-[var(--accent-gold)] text-white text-[10px] font-extrabold tracking-[0.1em] px-3 py-0.5 rounded-[2px] border-2 border-[var(--bg-surface)]">
                  7 NGÀY
                </span>
              </div>
            </div>

            <div className="space-y-1 pt-1.5">
              <h3 className="archive-title text-[20px]">HỎA CHÍ SỬ THỨC BÙNG CHÁY!</h3>
              <p className="text-[11px] text-[var(--text-tertiary)]">Học tập liên tục để duy trì hào khí và thăng hạng nhân vật.</p>
            </div>

            {/* Weekly Strip */}
            <div className="grid grid-cols-7 gap-2 pt-2">
              {weekDays.map((day, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "rounded-[2px] p-2 flex flex-col items-center justify-between gap-1 border text-center transition-colors",
                    day.status === "completed"
                      ? "bg-[var(--accent-gold-active-bg)] border-[var(--accent-gold)] text-[var(--gold-on-light)]"
                      : day.status === "active"
                        ? "bg-[var(--accent-gold)] border-[var(--accent-gold)] text-white animate-pulse"
                        : "bg-[var(--bg-elevated)] border-[var(--border-default)] text-[var(--text-muted)]"
                  )}
                >
                  <span className="text-[9px] font-bold block">{day.name}</span>
                  <div className="w-5.5 h-5.5 rounded-full bg-[color-mix(in_srgb,var(--text-primary)_6%,transparent)] flex items-center justify-center text-[10px]">
                    {day.status === "completed" ? (
                      <Check className="w-3.5 h-3.5 text-[var(--accent-gold)]" />
                    ) : day.status === "active" ? (
                      <Flame className="w-3.5 h-3.5 text-white" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--border-strong)]"></span>
                    )}
                  </div>
                  <span className={cn(
                    "text-[8px] font-mono",
                    day.status === "active" ? "text-white" : "text-[var(--text-tertiary)]"
                  )}>{day.xp}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 pt-2.5">
            <button
              onClick={() => setStreakClaimed(true)}
              disabled={streakClaimed}
              className={cn(
                "w-full text-xs font-bold py-3 rounded-[2px] border tracking-wider uppercase transition-colors active:scale-98 flex items-center justify-center gap-1.5",
                streakClaimed
                  ? "bg-[var(--bg-elevated)] border-[var(--border-default)] text-[var(--text-muted)] cursor-default"
                  : "bg-[var(--accent-gold)] border-[var(--accent-gold)] text-white hover:bg-[var(--accent-bronze)] hover:border-[var(--accent-bronze)]"
              )}
            >
              <Zap className={cn("w-4 h-4", !streakClaimed && "animate-bounce")} />
              <span>{streakClaimed ? "Đã nhận quà điểm danh!" : "Nhận Quà Điểm Danh Hàng Ngày"}</span>
            </button>
          </div>
        </div>
      );
    }
  }

  // Fallback
  return (
    <div className="w-full h-full bg-[var(--bg-surface)] flex items-center justify-center text-[var(--text-muted)] text-xs">
      No Preview Available
    </div>
  );
}
