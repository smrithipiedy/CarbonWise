export interface FootprintInputs {
  transport?: {
    car_km_per_week?: number;
    car_fuel_type?: string;
    motorcycle_km_per_week?: number;
    transit_km_per_week?: number;
    flights_short?: number;
    flights_long?: number;
  };
  home?: {
    electricity_kwh_per_month?: number;
    natural_gas_kwh_per_month?: number;
    heating_oil_kwh_per_month?: number;
    lpg_kwh_per_month?: number;
    renewable_energy_pct?: number;
    water_m3_per_month?: number;
    household_size?: number;
  };
  diet?: {
    type?: string;
  };
  consumption?: {
    shopping_spend_usd_per_month?: number;
    waste_landfill_kg_per_week?: number;
    recycling_pct?: number;
  };
}

export interface FootprintResult {
  breakdown: {
    transport: number;
    home: number;
    diet: number;
    consumption: number;
  };
  totalEmission: number;
  highestCategory: string;
  targets: {
    parisSustainableTarget: number;
    globalAverage: number;
  };
}

export interface ActionItem {
  category: string;
  action: string;
  estimated_annual_savings_kg: number;
}

export interface RuleEngineResult {
  summary: string;
  recommendations: ActionItem[];
}
