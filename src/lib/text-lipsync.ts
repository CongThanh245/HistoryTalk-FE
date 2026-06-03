/**
 * Text-based Lip-sync Simulation for Web Speech API
 * Mô phỏng lip-sync dựa trên phân tích text tiếng Việt, không cần audio data
 * 
 * Cách hoạt động:
 * 1. Phân tích text → đếm âm tiết, nguyên âm
 * 2. Ước tính thời gian nói (tốc độ ~4.5 âm tiết/giây)
 * 3. Tạo "fake" AnalyserNode tự động thay đổi volume theo pattern ngẫu nhiên
 */

// Đếm âm tiết tiếng Việt (ước tính đơn giản)
function countVietnameseSyllables(text: string): number {
  // Loại bỏ dấu câu
  const cleanText = text.toLowerCase().replace(/[,.!?;:…\-"'()\[\]]/g, ' ');
  // Tách từ và đếm số từ (mỗi từ tiếng Việt ~ 1 âm tiết)
  const words = cleanText.split(/\s+/).filter(w => w.length > 0);
  return words.length;
}

// Kiểm tra ký tự là nguyên âm
function isVowel(char: string): boolean {
  return 'aeiouăâêôơưyáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ'.includes(char.toLowerCase());
}

// Tính toán pattern lip-sync cho một đoạn text
export interface LipSyncPattern {
  duration: number;      // Thời gian nói (giây)
  syllableCount: number; // Số âm tiết
  vowelRatio: number;    // Tỷ lệ nguyên âm (0-1)
}

export function analyzeTextForLipSync(text: string, speechRate: number = 4.5): LipSyncPattern {
  const syllableCount = countVietnameseSyllables(text);
  
  // Đếm nguyên âm
  let vowelCount = 0;
  let totalChars = 0;
  for (const char of text) {
    if (/[a-zA-ZÀ-ỹ]/.test(char)) {
      totalChars++;
      if (isVowel(char)) {
        vowelCount++;
      }
    }
  }
  
  const vowelRatio = totalChars > 0 ? vowelCount / totalChars : 0.4;
  
  // Thời gian = số âm tiết / tốc độ nói
  // Thêm buffer cho dấu câu và pause
  const punctuationPause = (text.match(/[,.!?;:…]/g) || []).length * 0.3;
  const duration = (syllableCount / speechRate) + punctuationPause;
  
  return {
    duration: Math.max(duration, 0.5), // Tối thiểu 0.5s
    syllableCount,
    vowelRatio: Math.max(0.3, Math.min(0.7, vowelRatio)),
  };
}

/**
 * Simulated AnalyserNode cho Web Speech API
 * Tạo ra dữ liệu frequency giả lập dựa trên thời gian và pattern
 * 
 * NOTE: getByteFrequencyData được gọi bởi ExternalAudioLipDriver mỗi frame,
 * nên không cần internal RAF.
 */
export class SimulatedAnalyserNode {
  public fftSize = 256;
  public frequencyBinCount = 128;
  public smoothingTimeConstant = 0.4; // Giảm smoothing để đóng mở nhanh hơn
  
  private isRunning = false;
  private startTime = 0;
  private duration = 0;
  private vowelRatio = 0.5;
  private syllableCount = 0;
  private lastVolume = 0;
  
  // Kích hoạt lip-sync với text mới
  start(text: string, speechRate: number = 4.5): void {
    const pattern = analyzeTextForLipSync(text, speechRate);
    this.duration = pattern.duration;
    this.vowelRatio = pattern.vowelRatio;
    this.syllableCount = pattern.syllableCount;
    this.startTime = performance.now();
    this.isRunning = true;
    this.lastVolume = 0;
  }
  
  stop(): void {
    this.isRunning = false;
    this.lastVolume = 0;
  }
  
  // Giả lập getByteFrequencyData - được gọi bởi ExternalAudioLipDriver mỗi frame
  getByteFrequencyData(dataArray: Uint8Array): void {
    const elapsed = (performance.now() - this.startTime) / 1000;
    const progress = Math.min(elapsed / this.duration, 1);
    
    if (!this.isRunning || progress >= 1) {
      // Không nói → tất cả 0
      dataArray.fill(0);
      return;
    }
    
    // Tính toán volume dựa trên:
    // 1. Thời gian đã trôi qua
    // 2. Pattern ngẫu nhiên (mô phỏng tiếng nói tự nhiên)
    // 3. Tỷ lệ nguyên âm
    
    const syllableDuration = this.duration / Math.max(this.syllableCount, 1);
    const syllableProgress = (elapsed % syllableDuration) / syllableDuration;
    
    // Tạo hiệu ứng "mở miệng" theo từng âm tiết
    // Giảm intensity để miệng không mở quá to
    let baseVolume: number;
    
    if (syllableProgress < 0.3) {
      // Đầu âm tiết - phụ âm (miệng gần như đóng)
      baseVolume = 0.1 + (this.vowelRatio * 0.15);
    } else if (syllableProgress < 0.6) {
      // Giữa âm tiết - nguyên âm (miệng mở vừa phải)
      baseVolume = 0.4 + (this.vowelRatio * 0.25);
    } else {
      // Cuối âm tiết - giảm dần về đóng
      baseVolume = 0.1 + (this.vowelRatio * 0.1);
    }
    
    // Thêm nhiễu ngẫu nhiên - tần số cao hơn để có nhiều chu kỳ đóng mở
    const noise = (Math.sin(elapsed * 25) + Math.sin(elapsed * 35)) * 0.08;
    let targetVolume = Math.max(0, Math.min(1, baseVolume + noise));
    
    // Smoothing
    this.lastVolume = this.lastVolume * this.smoothingTimeConstant + 
                      targetVolume * (1 - this.smoothingTimeConstant);
    
    // Scale lên 0-255 cho Uint8Array
    const byteValue = Math.floor(this.lastVolume * 255);
    
    // Điền dữ liệu: tần số thấp (index nhỏ) có giá trị cao hơn (mô phỏng giọng nói)
    for (let i = 0; i < dataArray.length; i++) {
      // Decay theo tần số - giọng nói tập trung ở tần số thấp
      const decay = 1 - (i / dataArray.length) * 0.7;
      const freqNoise = Math.random() * 10; // Nhiễu nhỏ
      dataArray[i] = Math.min(255, Math.floor(byteValue * decay + freqNoise));
    }
  }
  
  // Check xem còn đang nói không
  get isActive(): boolean {
    if (!this.isRunning) return false;
    const elapsed = (performance.now() - this.startTime) / 1000;
    return elapsed < this.duration;
  }
}

// Helper để tạo simulated analyser cho Web Speech
export function createSimulatedAnalyser(): SimulatedAnalyserNode {
  return new SimulatedAnalyserNode();
}
