/**
 * TTS Cache - LRU cache for synthesized speech
 * 
 * Cache key: hash(text + voiceName) → audio buffer
 * Storage: In-memory with TTL + Redis/Upstash nếu cần persistent
 */

interface CacheEntry {
  audio: Uint8Array;
  mimeType: string;
  timestamp: number;
  hits: number;
}

// Simple sync hash for Edge Runtime compatibility
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  // Convert to positive hex string and pad to 32 chars
  return Math.abs(hash).toString(16).padStart(32, '0').slice(0, 32);
}

// LRU Cache với limit
class TTSCache {
  private cache = new Map<string, CacheEntry>();
  private maxSize = 100; // Giữ 100 audio gần nhất
  private ttlMs = 24 * 60 * 60 * 1000; // 24 hours

  private generateKey(text: string, voiceName: string): string {
    // Use simple hash + slice of text for readability
    const hash = simpleHash(`${text}|${voiceName}`);
    const textKey = text.slice(0, 20).replace(/[^a-zA-Z0-9]/g, '_');
    return `${textKey}_${hash}`;
  }

  get(text: string, voiceName: string): { audio: Uint8Array; mimeType: string } | null {
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

  set(text: string, voiceName: string, audio: Uint8Array, mimeType: string): void {
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
