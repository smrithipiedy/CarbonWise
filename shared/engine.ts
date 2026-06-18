import {
  CAR_FUEL_FACTORS,
  MOTORCYCLE_CO2_PER_KM,
  PUBLIC_TRANSIT_CO2_PER_KM,
  FLIGHT_SHORT_HAUL_CO2,
  FLIGHT_LONG_HAUL_CO2,
  ELECTRICITY_CO2_PER_KWH,
  NATURAL_GAS_CO2_PER_KWH,
  HEATING_OIL_CO2_PER_KWH,
  LPG_CO2_PER_KWH,
  WATER_CO2_PER_M3,
  DIET_FACTORS,
  SHOPPING_CO2_PER_USD,
  WASTE_CO2_PER_KG,
  PARIS_SUSTAINABLE_ANNUAL_TARGET,
  GLOBAL_AVERAGE_ANNUAL,
} from './factors';
import type { FootprintInputs, FootprintResult } from './types';

/** Round to two decimal places for stable API responses. */
function roundKg(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Deterministic carbon footprint engine.
 * Converts lifestyle inputs into annual kg CO₂e per category.
 */
export function calculateFootprint(inputs: FootprintInputs): FootprintResult {
  const trans = inputs.transport ?? {};
  const carKmWeek = Number(trans.car_km_per_week ?? 0);
  const fuelType = (trans.car_fuel_type ?? 'petrol').toLowerCase();
  const fuelFactor =
    CAR_FUEL_FACTORS[fuelType] !== undefined ? CAR_FUEL_FACTORS[fuelType] : CAR_FUEL_FACTORS.petrol;
  const carEmissionAnnual = carKmWeek * 52 * fuelFactor;

  const motorcycleKmWeek = Number(trans.motorcycle_km_per_week ?? 0);
  const motorcycleEmissionAnnual = motorcycleKmWeek * 52 * MOTORCYCLE_CO2_PER_KM;

  const transitKmWeek = Number(trans.transit_km_per_week ?? 0);
  const transitEmissionAnnual = transitKmWeek * 52 * PUBLIC_TRANSIT_CO2_PER_KM;

  const flightsShort = Number(trans.flights_short ?? 0);
  const flightsLong = Number(trans.flights_long ?? 0);

  const transportEmission =
    carEmissionAnnual +
    motorcycleEmissionAnnual +
    transitEmissionAnnual +
    flightsShort * FLIGHT_SHORT_HAUL_CO2 +
    flightsLong * FLIGHT_LONG_HAUL_CO2;

  const home = inputs.home ?? {};
  const electricityKwhMonth = Number(home.electricity_kwh_per_month ?? 0);
  const gasKwhMonth = Number(home.natural_gas_kwh_per_month ?? 0);
  const heatingOilKwhMonth = Number(home.heating_oil_kwh_per_month ?? 0);
  const lpgKwhMonth = Number(home.lpg_kwh_per_month ?? 0);
  const renewablePct = Math.min(100, Math.max(0, Number(home.renewable_energy_pct ?? 0)));
  const waterM3Month = Number(home.water_m3_per_month ?? 0);
  const householdSize = Math.max(1, Number(home.household_size ?? 1));

  const electricityFactor = 1 - renewablePct / 100;

  const totalHomeEmission =
    electricityKwhMonth * 12 * ELECTRICITY_CO2_PER_KWH * electricityFactor +
    gasKwhMonth * 12 * NATURAL_GAS_CO2_PER_KWH +
    heatingOilKwhMonth * 12 * HEATING_OIL_CO2_PER_KWH +
    lpgKwhMonth * 12 * LPG_CO2_PER_KWH +
    waterM3Month * 12 * WATER_CO2_PER_M3;

  const homeEmission = totalHomeEmission / householdSize;

  const diet = inputs.diet ?? {};
  const dietType = (diet.type ?? 'vegetarian').toLowerCase();
  const dietEmission =
    DIET_FACTORS[dietType] !== undefined ? DIET_FACTORS[dietType] : DIET_FACTORS.vegetarian;

  const cons = inputs.consumption ?? {};
  const shoppingSpendMonth = Number(cons.shopping_spend_usd_per_month ?? 0);
  const wasteLandfillWeek = Number(cons.waste_landfill_kg_per_week ?? 0);
  const recyclingPct = Math.min(100, Math.max(0, Number(cons.recycling_pct ?? 0)));
  const landfillFactor = 1 - recyclingPct / 100;

  const consumptionEmission =
    shoppingSpendMonth * 12 * SHOPPING_CO2_PER_USD +
    wasteLandfillWeek * 52 * WASTE_CO2_PER_KG * landfillFactor;

  const totalEmission = transportEmission + homeEmission + dietEmission + consumptionEmission;

  const breakdown = {
    transport: roundKg(transportEmission),
    home: roundKg(homeEmission),
    diet: roundKg(dietEmission),
    consumption: roundKg(consumptionEmission),
  };

  let highestCategory = 'transport';
  let maxVal = breakdown.transport;
  for (const [cat, val] of Object.entries(breakdown)) {
    if (val > maxVal) {
      maxVal = val;
      highestCategory = cat;
    }
  }

  return {
    breakdown,
    totalEmission: roundKg(totalEmission),
    highestCategory,
    targets: {
      parisSustainableTarget: PARIS_SUSTAINABLE_ANNUAL_TARGET,
      globalAverage: GLOBAL_AVERAGE_ANNUAL,
    },
  };
}
