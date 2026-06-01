/**
 * TTS Cache - LRU cache for synthesized speech
 * 
 * Cache key: hash(text + voiceName) → audio buffer
 * Storage: In-memory with TTL + Redis/Upstash nếu cần persistent
 */

import { createHash } from "crypto";

interface CacheEntry {
  audio: Buffer;
  mimeType: string;
  timestamp: number;
  hits: number;
}

// LRU Cache với limit
class TTSCache {
  private cache = new Map<string, CacheEntry>();
  private maxSize = 100; // Giữ 100 audio gần nhất
  private ttlMs = 24 * 60 * 60 * 1000; // 24 hours

  private generateKey(text: string, voiceName: string): string {
    return createHash("sha256").update(`${text}|${voiceName}`).digest("hex").slice(0, 32);
  }

  get(text: string, voiceName: string): { audio: Buffer; mimeType: string } | null {
    const key = this.generateKey(text, voiceName);
    const entry = this.cache.get(key);

    if (!entry) return null;

    // Check TTL
    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.cache.delete(key);
      return null;
    }

    // Update hits và thời gian truy cập (LRU)
    entry.hits++;
    entry.timestamp = Date.now();
    this.cache.delete(key);
    this.cache.set(key, entry);

    console.log(`[TTS Cache] HIT: "${text.slice(0, 30)}..." (${voiceName}), hits=${entry.hits}`);
    return { audio: entry.audio, mimeType: entry.mimeType };
  }

  set(text: string, voiceName: string, audio: Buffer, mimeType: string): void {
    // Evict nếu đầy
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    const key = this.generateKey(text, voiceName);
    this.cache.set(key, {
      audio,
      mimeType,
      timestamp: Date.now(),
      hits: 1,
    });

    console.log(`[TTS Cache] SET: "${text.slice(0, 30)}..." (${voiceName}), size=${this.cache.size}`);
  }

  getStats(): { size: number; hitRates: number[] } {
    const entries = Array.from(this.cache.values());
    return {
      size: this.cache.size,
      hitRates: entries.map((e) => e.hits),
    };
  }

  clear(): void {
    this.cache.clear();
  }
}

// Global instance (shared across requests trong same instance)
export const ttsCache = new TTSCache();

// Voice mapping mở rộng cho Gemini 1.5 Flash (8+ voices)
export const VOICE_MAP: Record<string, string> = {
  // Nữ
  "nguyen-hue": "Aoede",      // Mạnh mẽ, quyết đoán (nữ tướng)
  "hai-ba-trung": "Kore",     // Trẻ trung, kiên cường
  "vo-thi-sau": "Vera",       // Trẻ, dịu dàng
  "le-thi-hoa": "Celeste",    // Trưởng thành, ấm áp
  
  // Nam
  "tran-hung-dao": "Charon",   // Trầm, uy nghiêm (lão tướng)
  "ly-thuong-kiet": "Algenon", // Trầm, ổn định, chiến lược gia
  "ho-chi-minh": "Fenrir",     // Mạnh mẽ, đầy năng lượng
  "nguyen-trai": "Puck",       // Trẻ, thông minh
  "nguyen-tri-phuong": "Zephyr", // Trung niên, điềm tĩnh
  "pham-ngu-lao": "Orus",      // Mạnh, quyết liệt
  
  // Default
  "default": "Aoede",
};

export function getVoiceForCharacter(characterId: string): string {
  return VOICE_MAP[characterId] ?? VOICE_MAP["default"];
}

// List available voices cho UI
export const AVAILABLE_VOICES = [
  { id: "Aoede", name: "Aoede", gender: "female", style: "Mạnh mẽ, rõ ràng" },
  { id: "Kore", name: "Kore", gender: "female", style: "Trẻ trung, tươi sáng" },
  { id: "Vera", name: "Vera", gender: "female", style: "Dịu dàng, ấm áp" },
  { id: "Celeste", name: "Celeste", gender: "female", style: "Trưởng thành, uyển chuyển" },
  { id: "Charon", name: "Charon", gender: "male", style: "Trầm, uy nghiêm" },
  { id: "Algenon", name: "Algenon", gender: "male", style: "Trầm, ổn định" },
  { id: "Fenrir", name: "Fenrir", gender: "male", style: "Mạnh mẽ, năng lượng" },
  { id: "Puck", name: "Puck", gender: "male", style: "Trẻ, thông minh" },
  { id: "Zephyr", name: "Zephyr", gender: "male", style: "Trung niên, điềm tĩnh" },
  { id: "Orus", name: "Orus", gender: "male", style: "Quyết liệt, chiến binh" },
];
