import { createHash } from 'crypto';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

/**
 * Simple in-memory cache with TTL for Gemini API response deduplication.
 * Prevents redundant API calls for identical user profiles.
 */
export class InsightsCache<T> {
  private store = new Map<string, CacheEntry<T>>();
  private readonly ttlMs: number;
  private readonly maxSize: number;

  constructor(ttlMinutes = 30, maxSize = 200) {
    this.ttlMs = ttlMinutes * 60 * 1000;
    this.maxSize = maxSize;
  }

  /** Generate a deterministic cache key from breakdown + inputs. */
  static hashKey(breakdown: Record<string, number>, inputs: unknown): string {
    const raw = JSON.stringify({ breakdown, inputs });
    return createHash('sha256').update(raw).digest('hex').slice(0, 16);
  }

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }

    return entry.value;
  }

  set(key: string, value: T): void {
    // Evict oldest entries if cache is full
    if (this.store.size >= this.maxSize) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey) this.store.delete(oldestKey);
    }

    this.store.set(key, {
      value,
      expiresAt: Date.now() + this.ttlMs,
    });
  }

  get size(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }
}
