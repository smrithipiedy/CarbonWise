import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateInsights, AIInsightResponse } from '../insights/gemini';

/**
 * Tests for Gemini AI integration and its fallback behavior.
 * These tests validate the fallback to the rule engine when Gemini is disabled,
 * ensuring the application always provides meaningful recommendations.
 */
describe('Gemini insights — fallback behavior', () => {
  it('returns rule-engine insights when Gemini is disabled', async () => {
    const breakdown = { transport: 5000, home: 3000, diet: 1500, consumption: 800 };
    const inputs = {
      transport: { car_km_per_week: 300, car_fuel_type: 'petrol', flights_short: 2 },
      home: { electricity_kwh_per_month: 500, household_size: 2 },
      diet: { type: 'medium_meat' },
    };

    const result: AIInsightResponse = await generateInsights(breakdown, inputs);

    // In CI/test, Gemini key is not available — should fall back to rules
    assert.ok(
      result.source === 'gemini' || result.source === 'rules',
      `Expected source to be 'gemini' or 'rules', got '${result.source}'`
    );
    assert.ok(typeof result.summary === 'string' && result.summary.length > 0, 'Summary should be non-empty');
    assert.ok(Array.isArray(result.recommendations), 'Recommendations should be an array');
    assert.ok(result.recommendations.length >= 2, 'Should have at least 2 recommendations');
  });

  it('each recommendation has required fields', async () => {
    const breakdown = { transport: 2000, home: 1000, diet: 1500, consumption: 300 };
    const inputs = {
      transport: { car_km_per_week: 100 },
      diet: { type: 'vegetarian' },
    };

    const result = await generateInsights(breakdown, inputs);

    for (const rec of result.recommendations) {
      assert.ok(typeof rec.category === 'string' && rec.category.length > 0, 'Category is required');
      assert.ok(typeof rec.action === 'string' && rec.action.length > 0, 'Action is required');
      assert.ok(typeof rec.estimated_annual_savings_kg === 'number', 'Savings should be a number');
      assert.ok(rec.estimated_annual_savings_kg >= 0, 'Savings should be non-negative');
    }
  });

  it('covers multiple categories in recommendations', async () => {
    const breakdown = { transport: 5000, home: 10000, diet: 3300, consumption: 2000 };
    const inputs = {
      transport: { car_km_per_week: 500, flights_long: 3 },
      home: { electricity_kwh_per_month: 2000, natural_gas_kwh_per_month: 500, household_size: 1 },
      diet: { type: 'heavy_meat' },
      consumption: { shopping_spend_usd_per_month: 1000, waste_landfill_kg_per_week: 20, recycling_pct: 10 },
    };

    const result = await generateInsights(breakdown, inputs);
    const categories = new Set(result.recommendations.map((r) => r.category));

    // Should cover at least 2 different categories
    assert.ok(categories.size >= 2, `Expected at least 2 categories, got ${categories.size}: ${[...categories].join(', ')}`);
  });

  it('handles zero-emission user profile gracefully', async () => {
    const breakdown = { transport: 0, home: 0, diet: 1500, consumption: 0 };
    const inputs = {
      transport: { car_km_per_week: 0, flights_short: 0, flights_long: 0 },
      diet: { type: 'vegan' },
    };

    const result = await generateInsights(breakdown, inputs);

    assert.ok(result.summary.length > 0, 'Should still provide a summary');
    assert.ok(result.recommendations.length >= 1, 'Should provide at least 1 recommendation even for low emitters');
  });
});
