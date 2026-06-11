/**
 * Web Speech API STT - Client-side Speech Recognition
 * Không giới hạn, miễn phí, dùng cho "Pure Web Speech Mode"
 * 
 * Lưu ý: Chất lượng nhận dạng tiếng Việt không tốt bằng cloud API
 * Nhưng đủ dùng cho basic conversation và miễn phí hoàn toàn
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SpeechRecognitionType = any;

export interface WebSpeechSTTOptions {
  continuous?: boolean;     // Tiếp tục nhận dạng sau khi nói xong
  interimResults?: boolean; // Hiển thị kết quả tạm thời
  lang?: string;           // Ngôn ngữ, default 'vi-VN'
  maxDuration?: number;    // Giới hạn thời gian (ms)
}

export type STTResult = {
  transcript: string;
  isFinal: boolean;
  confidence: number;
};

export class WebSpeechSTT {
  private recognition: SpeechRecognitionType | null = null;
  private isListening = false;
  private transcript = '';
  private interimTranscript = '';
  private timeoutId: NodeJS.Timeout | null = null;

  isSupported(): boolean {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  }

  /**
   * Bắt đầu nhận dạng giọng nói
   * Trả về Promise với final transcript
   */
  start(options: WebSpeechSTTOptions = {}): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.isSupported()) {
        reject(new Error('Web Speech Recognition not supported'));
        return;
      }

      const SpeechRecognition =
        (window as Window & {
          SpeechRecognition?: SpeechRecognitionType;
          webkitSpeechRecognition?: SpeechRecognitionType;
        }).SpeechRecognition ||
        (window as Window & {
          SpeechRecognition?: SpeechRecognitionType;
          webkitSpeechRecognition?: SpeechRecognitionType;
        }).webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      
      const recognition = this.recognition!;
      
      recognition.continuous = options.continuous ?? false;
      recognition.interimResults = options.interimResults ?? true;
      recognition.lang = options.lang ?? 'vi-VN';
      recognition.maxAlternatives = 1;

      this.transcript = '';
      this.interimTranscript = '';
      this.isListening = true;

      // Timeout để tự động dừng nếu im lặng quá lâu
      if (options.maxDuration) {
        this.timeoutId = setTimeout(() => {
          this.stop();
          if (this.transcript || this.interimTranscript) {
            resolve(this.transcript || this.interimTranscript);
          } else {
            reject(new Error('No speech detected'));
          }
        }, options.maxDuration);
      }

      recognition.onstart = () => {
        console.log('[WebSpeechSTT] Started listening');
        this.isListening = true;
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          this.transcript += finalTranscript;
        }
        this.interimTranscript = interimTranscript;

        // Emit transcript cho UI update, gồm cả final để không mất chữ khi browser finalize giữa chừng.
        if (options.interimResults) {
          this.onInterimResult?.(`${this.transcript}${interimTranscript}`.trim());
        }
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onerror = (event: any) => {
        if (event.error !== 'no-speech') {
          console.error('[WebSpeechSTT] Error:', event.error);
        }
        this.isListening = false;
        this.clearTimeout();

        // Một số lỗi có thể bỏ qua
        if (event.error === 'no-speech') {
          if (this.transcript || this.interimTranscript) {
            resolve(this.transcript || this.interimTranscript);
          } else {
            reject(new Error('No speech detected'));
          }
          return;
        }

        if (event.error === 'aborted') {
          // User cancelled - resolve với transcript hiện tại
          resolve(this.transcript || this.interimTranscript);
          return;
        }

        reject(new Error(`Speech recognition error: ${event.error}`));
      };

      recognition.onend = () => {
        this.isListening = false;
        this.clearTimeout();
        
        // Resolve với transcript đầy đủ
        const result = this.transcript || this.interimTranscript;
        if (result) {
          console.log('[WebSpeechSTT] Final transcript:', result);
          resolve(result);
        } else {
          reject(new Error('No speech detected'));
        }
      };

      try {
        recognition.start();
      } catch (e) {
        reject(e);
      }
    });
  }

  /**
   * Dừng nhận dạng
   */
  stop(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
    this.clearTimeout();
    this.isListening = false;
  }

  /**
   * Hủy ngay lập tức
   */
  abort(): void {
    if (this.recognition) {
      this.recognition.abort();
    }
    this.clearTimeout();
    this.isListening = false;
  }

  /**
   * Kiểm tra đang nghe không
   */
  isActive(): boolean {
    return this.isListening;
  }

  /**
   * Lấy transcript tạm thời hiện tại (cho UI realtime)
   */
  getInterimTranscript(): string {
    return this.interimTranscript;
  }

  private clearTimeout(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  // Callback cho interim results
  onInterimResult: ((transcript: string) => void) | null = null;
}

// Singleton instance
let webSpeechSTTInstance: WebSpeechSTT | null = null;

export function getWebSpeechSTT(): WebSpeechSTT {
  if (!webSpeechSTTInstance && typeof window !== 'undefined') {
    webSpeechSTTInstance = new WebSpeechSTT();
  }
  return webSpeechSTTInstance!;
}

/**
 * Quick function: Record once và trả về text
 */
export async function recordSpeech(
  maxDurationMs: number = 30000,
  onInterim?: (text: string) => void
): Promise<string> {
  const stt = getWebSpeechSTT();
  
  if (onInterim) {
    stt.onInterimResult = onInterim;
  }
  
  return stt.start({
    continuous: false,
    interimResults: true,
    maxDuration: maxDurationMs,
  });
}

/**
 * Check browser support
 */
export function isWebSpeechSupported(): { stt: boolean; tts: boolean } {
  return {
    stt: 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window,
    tts: 'speechSynthesis' in window,
  };
}
