/**
 * Zod Validation Schemas for API Request Payloads
 * 
 * Enforces strict type-safety and sanitization on all incoming user data
 * to prevent malicious payloads, prompt injection, and server crashes.
 */
import { z } from 'zod';

// ─── Transport Inputs Schema ────────────────────────────────────
const transportSchema = z.object({
  car_km_per_week: z.number().min(0).max(10000).default(0),
  car_fuel_type: z.enum(['petrol', 'diesel', 'hybrid', 'electric']).default('petrol'),
  motorcycle_km_per_week: z.number().min(0).max(10000).default(0),
  transit_km_per_week: z.number().min(0).max(10000).default(0),
  flights_short: z.number().int().min(0).max(100).default(0),
  flights_long: z.number().int().min(0).max(100).default(0),
}).partial();

// ─── Home Energy Inputs Schema ──────────────────────────────────
const homeSchema = z.object({
  electricity_kwh_per_month: z.number().min(0).max(50000).default(0),
  natural_gas_kwh_per_month: z.number().min(0).max(50000).default(0),
  heating_oil_kwh_per_month: z.number().min(0).max(50000).default(0),
  lpg_kwh_per_month: z.number().min(0).max(50000).default(0),
  renewable_energy_pct: z.number().min(0).max(100).default(0),
  water_m3_per_month: z.number().min(0).max(1000).default(0),
  household_size: z.number().int().min(1).max(20).default(1),
}).partial();

// ─── Diet Inputs Schema ─────────────────────────────────────────
const dietSchema = z.object({
  type: z.enum(['heavy_meat', 'medium_meat', 'low_meat', 'pescatarian', 'vegetarian', 'vegan']).default('vegetarian'),
}).partial();

// ─── Consumption Inputs Schema ──────────────────────────────────
const consumptionSchema = z.object({
  shopping_spend_usd_per_month: z.number().min(0).max(100000).default(0),
  waste_landfill_kg_per_week: z.number().min(0).max(1000).default(0),
  recycling_pct: z.number().min(0).max(100).default(0),
}).partial();

// ─── Complete Footprint Input Schema ────────────────────────────
export const footprintInputSchema = z.object({
  transport: transportSchema.optional().default({}),
  home: homeSchema.optional().default({}),
  diet: dietSchema.optional().default({}),
  consumption: consumptionSchema.optional().default({}),
}).partial();

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
