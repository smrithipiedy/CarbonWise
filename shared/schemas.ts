import { z } from 'zod';

export const transportSchema = z.object({
  car_km_per_week: z.number().min(0, 'Must be positive').max(10000).default(0),
  car_fuel_type: z.enum(['petrol', 'diesel', 'hybrid', 'electric']).default('petrol'),
  motorcycle_km_per_week: z.number().min(0).max(10000).default(0),
  transit_km_per_week: z.number().min(0).max(10000).default(0),
  flights_short: z.number().int().min(0).max(100).default(0),
  flights_long: z.number().int().min(0).max(100).default(0),
}).partial();

export const homeSchema = z.object({
  electricity_kwh_per_month: z.number().min(0).max(50000).default(0),
  natural_gas_kwh_per_month: z.number().min(0).max(50000).default(0),
  heating_oil_kwh_per_month: z.number().min(0).max(50000).default(0),
  lpg_kwh_per_month: z.number().min(0).max(50000).default(0),
  renewable_energy_pct: z.number().min(0).max(100).default(0),
  water_m3_per_month: z.number().min(0).max(1000).default(0),
  household_size: z.number().int().min(1, 'At least 1 person required').max(20).default(1),
}).partial();

export const dietSchema = z.object({
  type: z.enum(['heavy_meat', 'medium_meat', 'low_meat', 'pescatarian', 'vegetarian', 'vegan']).default('vegetarian'),
}).partial();

export const consumptionSchema = z.object({
  shopping_spend_usd_per_month: z.number().min(0).max(100000).default(0),
  waste_landfill_kg_per_week: z.number().min(0).max(1000).default(0),
  recycling_pct: z.number().min(0).max(100).default(0),
}).partial();

export const footprintInputSchema = z.object({
  transport: transportSchema.optional().default({}),
  home: homeSchema.optional().default({}),
  diet: dietSchema.optional().default({}),
  consumption: consumptionSchema.optional().default({}),
}).partial();

export type FootprintInput = z.infer<typeof footprintInputSchema>;
