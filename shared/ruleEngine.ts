import {
  CAR_FUEL_FACTORS,
  MOTORCYCLE_CO2_PER_KM,
  FLIGHT_SHORT_HAUL_CO2,
  FLIGHT_LONG_HAUL_CO2,
  ELECTRICITY_CO2_PER_KWH,
  WATER_CO2_PER_M3,
  SHOPPING_CO2_PER_USD,
  WASTE_CO2_PER_KG,
  PARIS_SUSTAINABLE_ANNUAL_TARGET,
} from './factors';
import type { FootprintInputs, ActionItem, RuleEngineResult } from './types';

/**
 * Deterministic rule-based insights engine.
 * Provides contextual, quantified recommendations when Gemini is unavailable.
 */
export function runRuleEngine(
  breakdown: Record<string, number>,
  inputs: FootprintInputs
): RuleEngineResult {
  const totalEmission = Object.values(breakdown).reduce((a, b) => a + b, 0);
  const totalTonnes = (totalEmission / 1000).toFixed(2);
  const diffTonnes = Math.abs(totalEmission - PARIS_SUSTAINABLE_ANNUAL_TARGET) / 1000;

  const summary =
    totalEmission <= PARIS_SUSTAINABLE_ANNUAL_TARGET
      ? `Excellent! Your estimated footprint is ${totalTonnes} tonnes CO₂e/year, which is within the sustainable target of 2.0 tonnes. Here is a breakdown of your habits.`
      : `Your estimated footprint is ${totalTonnes} tonnes CO₂e/year, which is about ${diffTonnes.toFixed(2)} tonnes above the sustainable 2.0-tonne Paris Agreement target. Review the detailed feedback below for optimization.`;

  const recommendations: ActionItem[] = [];

  const trans = inputs.transport ?? {};
  const carKm = Number(trans.car_km_per_week ?? 0);
  if (carKm > 0) {
    const fuelType = trans.car_fuel_type ?? 'petrol';
    const fuelFactor = CAR_FUEL_FACTORS[fuelType] ?? CAR_FUEL_FACTORS.petrol;
    const carSaving = carKm * 52 * fuelFactor * 0.3;
    recommendations.push({
      category: 'transport',
      action:
        carKm > 300
          ? '🚗 Car Travel: Your fuel emissions are high (Bad). Reduce journeys by 30% through public transit, walking, or hybrid/electric carpooling.'
          : '🚗 Car Travel: Your fuel emissions are moderate (Moderate). Shift local errands to walking or cycling to save fuel.',
      estimated_annual_savings_kg: Math.round(carSaving),
    });
  } else {
    recommendations.push({
      category: 'transport',
      action:
        '🚗 Car Travel: You drive zero kilometers (Good). Excellent zero-emission baseline for personal transit!',
      estimated_annual_savings_kg: 0,
    });
  }

  const motorcycleKm = Number(trans.motorcycle_km_per_week ?? 0);
  if (motorcycleKm > 0) {
    const motoSaving = motorcycleKm * 52 * MOTORCYCLE_CO2_PER_KM * 0.25;
    recommendations.push({
      category: 'transport',
      action:
        motorcycleKm > 150
          ? '🏍️ Motorcycle: Riding emissions are high (Bad). Reduce trips by 25% using active travel or public transit where possible.'
          : '🏍️ Motorcycle: Riding emissions are moderate (Moderate). Optimize routes to maintain low-emissions transit.',
      estimated_annual_savings_kg: Math.round(motoSaving),
    });
  }

  const flightsShort = Number(trans.flights_short ?? 0);
  const flightsLong = Number(trans.flights_long ?? 0);
  if (flightsShort > 3 || flightsLong > 1) {
    recommendations.push({
      category: 'transport',
      action:
        '✈️ Aviation: Flight emissions are high (Bad). Swap short flights with high-speed electric trains, or choose video calls to minimize long-haul trips.',
      estimated_annual_savings_kg: Math.round(
        flightsShort * FLIGHT_SHORT_HAUL_CO2 * 0.5 + flightsLong * FLIGHT_LONG_HAUL_CO2 * 0.5
      ),
    });
  } else if (flightsShort > 0 || flightsLong > 0) {
    recommendations.push({
      category: 'transport',
      action:
        '✈️ Aviation: Flight emissions are low to moderate (Moderate). Offset flight emissions through certified forestry or carbon capture schemes.',
      estimated_annual_savings_kg: 50,
    });
  } else {
    recommendations.push({
      category: 'transport',
      action:
        '✈️ Aviation: You took zero flights this year (Good). Brilliant job avoiding high-impact air travel!',
      estimated_annual_savings_kg: 0,
    });
  }

  const home = inputs.home ?? {};
  const electricityKwh = Number(home.electricity_kwh_per_month ?? 0);
  const gasKwh = Number(home.natural_gas_kwh_per_month ?? 0);
  const oilKwh = Number(home.heating_oil_kwh_per_month ?? 0);
  const lpgKwh = Number(home.lpg_kwh_per_month ?? 0);
  const renewablePct = Number(home.renewable_energy_pct ?? 0);
  const waterM3 = Number(home.water_m3_per_month ?? 0);
  const hSize = Math.max(1, Number(home.household_size ?? 1));

  if (electricityKwh > 0) {
    if (renewablePct >= 80) {
      recommendations.push({
        category: 'home',
        action: `⚡ Electricity: Green power adoption is high at ${renewablePct}% (Good). Keep using energy-efficient smart appliances to save electricity.`,
        estimated_annual_savings_kg: 0,
      });
    } else {
      const elecSaving = (electricityKwh * 12 * ELECTRICITY_CO2_PER_KWH * 0.3) / hSize;
      recommendations.push({
        category: 'home',
        action: `⚡ Electricity: Green power level of ${renewablePct}% is low (Bad). Switch to a 100% renewable utility tariff or install rooftop solar panels.`,
        estimated_annual_savings_kg: Math.round(elecSaving),
      });
    }
  }

  if (gasKwh > 300 || oilKwh > 200 || lpgKwh > 200) {
    recommendations.push({
      category: 'home',
      action:
        '🔥 Heating: Fuel combustion footprint is high (Bad). Upgrade insulation or lower thermostat by 1.5°C to reduce heating load.',
      estimated_annual_savings_kg: 180,
    });
  } else if (gasKwh > 0 || oilKwh > 0 || lpgKwh > 0) {
    recommendations.push({
      category: 'home',
      action:
        '🔥 Heating: Fuel combustion footprint is low to moderate (Moderate). Ensure regular boiler services for clean burning.',
      estimated_annual_savings_kg: 50,
    });
  }

  if (waterM3 > 0) {
    const waterPerPerson = waterM3 / hSize;
    if (waterPerPerson > 6) {
      recommendations.push({
        category: 'home',
        action:
          '💧 Water Usage: Water footprint is high (Bad). Switch to low-flow faucet aerators and limit showers to 5 minutes.',
        estimated_annual_savings_kg: Math.round(waterM3 * 12 * WATER_CO2_PER_M3 * 0.25),
      });
    } else {
      recommendations.push({
        category: 'home',
        action: '💧 Water Usage: Water footprint is low (Good). Excellent household conservation practices.',
        estimated_annual_savings_kg: 0,
      });
    }
  }

  const diet = inputs.diet ?? {};
  const dietType = (diet.type ?? 'vegetarian').toLowerCase();
  if (dietType === 'heavy_meat') {
    recommendations.push({
      category: 'diet',
      action:
        '🥦 Diet: High meat consumption is high impact (Bad). Shift to a low-meat diet or introduce Meatless Mondays to save emissions.',
      estimated_annual_savings_kg: 800,
    });
  } else if (dietType === 'medium_meat' || dietType === 'low_meat') {
    recommendations.push({
      category: 'diet',
      action:
        '🥦 Diet: Moderate meat consumption (Moderate). Swap red meats for poultry or fish to reduce emissions.',
      estimated_annual_savings_kg: 400,
    });
  } else if (dietType === 'pescatarian') {
    recommendations.push({
      category: 'diet',
      action:
        '🥦 Diet: Pescatarian diet is moderate impact (Moderate). Reduce seafood frequency and add more legumes and grains.',
      estimated_annual_savings_kg: 200,
    });
  } else if (dietType === 'vegan' || dietType === 'vegetarian') {
    recommendations.push({
      category: 'diet',
      action:
        '🥦 Diet: Plant-focused diet is excellent (Good). Continue prioritizing plant proteins over animal dairy.',
      estimated_annual_savings_kg: 0,
    });
  }

  const cons = inputs.consumption ?? {};
  const spend = Number(cons.shopping_spend_usd_per_month ?? 0);
  const waste = Number(cons.waste_landfill_kg_per_week ?? 0);
  const recycling = Number(cons.recycling_pct ?? 0);

  if (spend > 500) {
    recommendations.push({
      category: 'consumption',
      action:
        '🛍️ Shopping: Consumer goods spending is high (Bad). Minimize fast fashion and look for pre-owned or repaired alternatives.',
      estimated_annual_savings_kg: Math.round(spend * 12 * SHOPPING_CO2_PER_USD * 0.15),
    });
  } else if (spend > 0) {
    recommendations.push({
      category: 'consumption',
      action:
        '🛍️ Shopping: Consumer goods spending is moderate (Good). Keep buying durable, high-quality products.',
      estimated_annual_savings_kg: 0,
    });
  }

  if (waste > 0) {
    if (recycling >= 50) {
      recommendations.push({
        category: 'consumption',
        action: `♻️ Waste: Good recycling habits at ${recycling}% (Good). Keep composting organic scraps to eliminate methane generation.`,
        estimated_annual_savings_kg: 0,
      });
    } else {
      recommendations.push({
        category: 'consumption',
        action: `♻️ Waste: Low recycling rate of ${recycling}% (Bad). Increase household sorting of plastics, metals, and paper.`,
        estimated_annual_savings_kg: Math.round(waste * 52 * WASTE_CO2_PER_KG * 0.3),
      });
    }
  }

  return { summary, recommendations };
}

/** Returns the highest-emission category key from a breakdown. */
export function getHighestCategory(breakdown: Record<string, number>): string {
  return Object.entries(breakdown).reduce(
    (best, [cat, val]) => (val > best[1] ? [cat, val] : best),
    ['transport', breakdown.transport ?? 0]
  )[0];
}
