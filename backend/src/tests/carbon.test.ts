import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateFootprint } from '../../../shared/engine';
import { runRuleEngine, getHighestCategory } from '../../../shared/ruleEngine';
import {
  footprintInputSchema,
  insightsRequestSchema,
  saveEntrySchema,
  deviceIdParamSchema,
} from '../validation/schemas';

describe('Carbon engine', () => {
  it('calculates transport, home, diet, and consumption correctly', () => {
    const inputs = {
      transport: {
        car_km_per_week: 500,
        car_fuel_type: 'petrol',
        transit_km_per_week: 0,
        flights_short: 0,
        flights_long: 0,
      },
      home: {
        electricity_kwh_per_month: 4000,
        natural_gas_kwh_per_month: 0,
        household_size: 1,
      },
      diet: { type: 'heavy_meat' },
      consumption: {
        shopping_spend_usd_per_month: 0,
        waste_landfill_kg_per_week: 0,
      },
    };

    const res = calculateFootprint(inputs);

    assert.equal(res.breakdown.transport, 4420);
    assert.equal(res.breakdown.home, 21600);
    assert.equal(res.breakdown.diet, 3300);
    assert.equal(res.breakdown.consumption, 0);
    assert.equal(res.totalEmission, 29320);
    assert.equal(res.highestCategory, 'home');
  });

  it('applies renewable energy offset to electricity', () => {
    const res = calculateFootprint({
      home: {
        electricity_kwh_per_month: 1000,
        renewable_energy_pct: 100,
        household_size: 1,
      },
    });

    assert.equal(res.breakdown.home, 0);
  });

  it('clamps household size to minimum of 1', () => {
    const res = calculateFootprint({
      home: {
        electricity_kwh_per_month: 1200,
        household_size: 0,
      },
    });

    assert.equal(res.breakdown.home, 6480);
  });
});

describe('Rule engine', () => {
  it('returns contextual recommendations with quantified savings', () => {
    const breakdown = {
      transport: 4420,
      home: 21600,
      diet: 3300,
      consumption: 0,
    };
    const inputs = {
      transport: { car_km_per_week: 500, car_fuel_type: 'petrol' },
      home: { electricity_kwh_per_month: 4000, household_size: 1 },
    };

    const result = runRuleEngine(breakdown, inputs);

    assert.ok(result.recommendations.length >= 2);
    assert.equal(getHighestCategory(breakdown), 'home');
    assert.ok(result.recommendations.some((r) => r.category === 'home'));
    assert.ok(result.recommendations.some((r) => r.estimated_annual_savings_kg > 0));
    assert.ok(result.summary.length > 0);
  });

  it('encourages zero-flight users', () => {
    const result = runRuleEngine(
      { transport: 0, home: 0, diet: 1500, consumption: 0 },
      { transport: { flights_short: 0, flights_long: 0 } }
    );

    assert.ok(
      result.recommendations.some(
        (r) => r.category === 'transport' && r.action.includes('zero flights')
      )
    );
  });
});

describe('Validation schemas', () => {
  it('rejects invalid fuel types', () => {
    const parsed = footprintInputSchema.safeParse({
      transport: { car_fuel_type: 'nuclear' },
    });
    assert.equal(parsed.success, false);
  });

  it('accepts valid insights payload', () => {
    const parsed = insightsRequestSchema.safeParse({
      breakdown: { transport: 100, home: 200, diet: 300, consumption: 50 },
      inputs: { diet: { type: 'vegan' } },
    });
    assert.equal(parsed.success, true);
  });

  it('requires UUID device IDs', () => {
    assert.equal(deviceIdParamSchema.safeParse('not-a-uuid').success, false);
    assert.equal(
      deviceIdParamSchema.safeParse('550e8400-e29b-41d4-a716-446655440000').success,
      true
    );
  });

  it('validates save entry payload', () => {
    const parsed = saveEntrySchema.safeParse({
      deviceId: '550e8400-e29b-41d4-a716-446655440000',
      breakdown: { transport: 1, home: 2, diet: 3, consumption: 4 },
      totalEmission: 10,
    });
    assert.equal(parsed.success, true);
  });
});
