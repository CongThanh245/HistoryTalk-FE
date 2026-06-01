/**
 * Web Speech API TTS - Client-side fallback
 * Không giới hạn, miễn phí, nhưng chất lượng thấp hơn Gemini
 * Chỉ dùng khi: API quota hết, không có cache, hoặc user chọn "Economy mode"
 */

export interface WebSpeechOptions {
  rate?: number;      // 0.1 - 10, default 1
  pitch?: number;     // 0 - 2, default 1
  volume?: number;    // 0 - 1, default 1
  voice?: SpeechSynthesisVoice;
}

export class WebSpeechTTS {
  private synthesis: SpeechSynthesis;
  private voices: SpeechSynthesisVoice[] = [];
  private isReady = false;

  constructor() {
    this.synthesis = window.speechSynthesis;
    this.loadVoices();
    
    // Voices có thể load async
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = () => this.loadVoices();
    }
  }

  private loadVoices() {
    this.voices = this.synthesis.getVoices();
    this.isReady = this.voices.length > 0;
    
    // Log Vietnamese voices
    const viVoices = this.voices.filter(v => v.lang.startsWith('vi'));
    if (viVoices.length > 0) {
      console.log('[WebSpeech] Vietnamese voices:', viVoices.map(v => v.name));
    }
  }

  isSupported(): boolean {
    return 'speechSynthesis' in window && this.isReady;
  }

  getVoices(): SpeechSynthesisVoice[] {
    return this.voices.filter(v => v.lang.startsWith('vi'));
  }

  /**
   * Speak text với voice phù hợp cho nhân vật
   */
  speak(text: string, options: WebSpeechOptions = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isSupported()) {
        reject(new Error('Web Speech API not supported'));
        return;
      }

      // Cancel any ongoing speech
      this.synthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Cấu hình
      utterance.rate = options.rate ?? 0.9; // Hơi chậm cho rõ
      utterance.pitch = options.pitch ?? 1;
      utterance.volume = options.volume ?? 1;
      utterance.lang = 'vi-VN';

      // Chọn voice
      if (options.voice) {
        utterance.voice = options.voice;
      } else {
        // Auto chọn voice Vietnamese
        const viVoice = this.voices.find(v => v.lang === 'vi-VN') || 
                         this.voices.find(v => v.lang.startsWith('vi'));
        if (viVoice) {
          utterance.voice = viVoice;
        }
      }

      // Events
      utterance.onend = () => resolve();
      utterance.onerror = (e) => {
        if (e.error === 'canceled') {
          resolve(); // User cancelled is OK
        } else {
          reject(new Error(`Speech error: ${e.error}`));
        }
      };

      // Start speaking
      this.synthesis.speak(utterance);
    });
  }

  /**
   * Hủy phát âm hiện tại
   */
  cancel(): void {
    this.synthesis.cancel();
  }

  /**
   * Pause/Resume
   */
  pause(): void {
    this.synthesis.pause();
  }

  resume(): void {
    this.synthesis.resume();
  }

  /**
   * Kiểm tra đang phát không
   */
  isSpeaking(): boolean {
    return this.synthesis.speaking;
  }
}

// Singleton instance
let webSpeechInstance: WebSpeechTTS | null = null;

export function getWebSpeechTTS(): WebSpeechTTS {
  if (!webSpeechInstance && typeof window !== 'undefined') {
    webSpeechInstance = new WebSpeechTTS();
  }
  return webSpeechInstance!;
}

/**
 * TTS wrapper: Thử Gemini API trước, fallback sang Web Speech nếu lỗi
 */
export async function speakWithFallback(
  text: string,
  audioBuffer: ArrayBuffer | null, // Từ API nếu có
  onFallback?: () => void
): Promise<void> {
  // Nếu có audio từ API (cache hit), dùng nó
  if (audioBuffer && audioBuffer.byteLength > 0) {
    try {
      await playAudioBuffer(audioBuffer);
      return;
    } catch (e) {
      console.warn('[TTS] Audio playback failed, trying fallback:', e);
    }
  }

  // Fallback to Web Speech API
  try {
    const tts = getWebSpeechTTS();
    if (tts.isSupported()) {
      onFallback?.();
      await tts.speak(text);
    } else {
      throw new Error('Web Speech API not available');
    }
  } catch (e) {
    console.error('[TTS] Fallback also failed:', e);
    throw e;
  }
}

/**
 * Play ArrayBuffer audio
 */
function playAudioBuffer(buffer: ArrayBuffer): Promise<void> {
  return new Promise((resolve, reject) => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    audioContext.decodeAudioData(buffer.slice(0), 
      (audioBuffer) => {
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.onended = () => {
          audioContext.close();
          resolve();
        };
        source.start(0);
      },
      (e) => {
        audioContext.close();
        reject(new Error(`Decode error: ${e}`));
      }
    );
  });
}
