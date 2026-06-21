import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface TransportInputs {
  car_km_per_week: number;
  car_fuel_type: 'petrol' | 'diesel' | 'hybrid' | 'electric';
  motorcycle_km_per_week: number;
  transit_km_per_week: number;
  flights_short: number;
  flights_long: number;
}

export interface HomeInputs {
  electricity_kwh_per_month: number;
  natural_gas_kwh_per_month: number;
  heating_oil_kwh_per_month: number;
  lpg_kwh_per_month: number;
  renewable_energy_pct: number;
  water_m3_per_month: number;
  household_size: number;
}

export interface DietInputs {
  type: 'heavy_meat' | 'medium_meat' | 'low_meat' | 'pescatarian' | 'vegetarian' | 'vegan';
}

export interface ConsumptionInputs {
  shopping_spend_usd_per_month: number;
  waste_landfill_kg_per_week: number;
  recycling_pct: number;
}

export interface FootprintInputs {
  transport: TransportInputs;
  home: HomeInputs;
  diet: DietInputs;
  consumption: ConsumptionInputs;
}

export interface FootprintResponse {
  breakdown: Record<string, number>;
  totalEmission: number;
  highestCategory: string;
  targets: {
    parisSustainableTarget: number;
    globalAverage: number;
  };
}

export interface AIActionItem {
  category: string;
  action: string;
  estimated_annual_savings_kg: number;
}

export interface AIInsightResponse {
  summary: string;
  recommendations: AIActionItem[];
  source: 'gemini' | 'rules';
}

export interface HistoryEntry {
  id: string;
  deviceId: string;
  breakdown: Record<string, number>;
  totalEmission: number;
  date: string;
  inputs?: FootprintInputs;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
  gemini: {
    enabled: boolean;
    model: string | null;
  };
}

/**
 * Checks the health status of the backend API and AI integration.
 */
export const checkHealth = () => api.get<HealthResponse>('/health');

/**
 * Retrieves the existing device ID from local storage or generates a new UUID.
 */
export const getDeviceId = (): string => {
  let deviceId = localStorage.getItem('deviceId');
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem('deviceId', deviceId);
  }
  return deviceId;
};

/**
 * Sends footprint inputs to the backend to calculate emission breakdowns and totals.
 */
export const calculateFootprint = (data: FootprintInputs) =>
  api.post<FootprintResponse>('/calculate', data);

/**
 * Fetches personalized AI-generated insights based on emission breakdown and user inputs.
 */
export const getInsights = (breakdown: Record<string, number>, inputs: FootprintInputs) =>
  api.post<AIInsightResponse>('/insights', { breakdown, inputs });

/**
 * Saves a new carbon footprint snapshot entry to the cloud for historical tracking.
 */
export const saveSnapshot = (deviceId: string, breakdown: Record<string, number>, totalEmission: number, inputs: FootprintInputs) =>
  api.post<{ status: string; id: string }>('/entries', { deviceId, breakdown, totalEmission, inputs });

/**
 * Retrieves all historical footprint snapshots for a specific device.
 */
export const getHistory = (deviceId: string) =>
  api.get<HistoryEntry[]>(`/entries/${deviceId}`);

/**
 * Deletes all historical footprint snapshots for a specific device.
 */
export const clearHistory = (deviceId: string) =>
  api.delete<{ status: string; message: string }>(`/entries/${deviceId}`);

/**
 * Deletes a single historical footprint snapshot entry.
 */
export const deleteEntry = (deviceId: string, entryId: string) =>
  api.delete<{ status: string; message: string }>(`/entries/${deviceId}/${entryId}`);

export default api;
