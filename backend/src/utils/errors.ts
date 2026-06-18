import { ENV } from '../config';

/** Returns a safe client-facing error message without leaking internals in production. */
export function safeErrorMessage(error: unknown, fallback: string): string {
  if (ENV !== 'production' && error instanceof Error) {
    return error.message;
  }
  return fallback;
}
