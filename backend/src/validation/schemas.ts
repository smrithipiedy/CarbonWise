/**
 * Zod Validation Schemas for API Request Payloads
 * 
 * Enforces strict type-safety and sanitization on all incoming user data
 * to prevent malicious payloads, prompt injection, and server crashes.
 */
import { z } from 'zod';
import { footprintInputSchema } from '../../../shared/schemas';
export { footprintInputSchema };

// ─── Insights Request Schema ────────────────────────────────────
export const insightsRequestSchema = z.object({
  breakdown: z.object({
    transport: z.number().min(0),
    home: z.number().min(0),
    diet: z.number().min(0),
    consumption: z.number().min(0),
  }),
  inputs: footprintInputSchema.optional().default({}),
});

// ─── Save Entry Request Schema ──────────────────────────────────
export const saveEntrySchema = z.object({
  deviceId: z.string().uuid(),
  breakdown: z.object({
    transport: z.number().min(0),
    home: z.number().min(0),
    diet: z.number().min(0),
    consumption: z.number().min(0),
  }),
  totalEmission: z.number().min(0),
  inputs: footprintInputSchema.optional().default({}),
});

export const deviceIdParamSchema = z.string().uuid();

export const entryIdParamSchema = z.string().uuid();

export type FootprintInput = z.infer<typeof footprintInputSchema>;
export type InsightsRequest = z.infer<typeof insightsRequestSchema>;
export type SaveEntryRequest = z.infer<typeof saveEntrySchema>;
