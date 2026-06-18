/**
 * Emission conversion factors normalized to annual kg CO₂e.
 * Sources: UK DEFRA 2023, US EPA, IPCC / Our World in Data.
 */

export const CAR_FUEL_FACTORS: Record<string, number> = {
  petrol: 0.170,
  diesel: 0.171,
  hybrid: 0.120,
  electric: 0.047,
};

export const MOTORCYCLE_CO2_PER_KM = 0.098;
export const PUBLIC_TRANSIT_CO2_PER_KM = 0.060;
export const FLIGHT_SHORT_HAUL_CO2 = 1100 * 0.158;
export const FLIGHT_LONG_HAUL_CO2 = 6500 * 0.150;

export const ELECTRICITY_CO2_PER_KWH = 0.450;
export const NATURAL_GAS_CO2_PER_KWH = 0.183;
export const HEATING_OIL_CO2_PER_KWH = 0.246;
export const LPG_CO2_PER_KWH = 0.214;
export const WATER_CO2_PER_M3 = 0.344;

export const DIET_FACTORS: Record<string, number> = {
  heavy_meat: 3300.0,
  medium_meat: 2500.0,
  low_meat: 1900.0,
  pescatarian: 1700.0,
  vegetarian: 1500.0,
  vegan: 1050.0,
};

export const SHOPPING_CO2_PER_USD = 0.40;
export const WASTE_CO2_PER_KG = 0.580;

export const PARIS_SUSTAINABLE_ANNUAL_TARGET = 2000.0;
export const GLOBAL_AVERAGE_ANNUAL = 4800.0;
