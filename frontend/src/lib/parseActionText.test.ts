import { describe, it, expect } from 'vitest';
import { calculateFootprint } from '@carbonwise/shared';
import { parseActionText } from './parseActionText';

describe('parseActionText', () => {
  it('extracts emoji, heading, status, and details', () => {
    const result = parseActionText(
      '🚗 Car Travel: Reduce journeys by 30% (Bad)'
    );
    expect(result.heading).toContain('Car Travel');
    expect(result.status).toBe('Bad');
    expect(result.details).toContain('Reduce journeys');
  });

  it('defaults status to Moderate when missing', () => {
    const result = parseActionText('Water: Use low-flow fixtures');
    expect(result.status).toBe('Moderate');
  });
});

describe('calculateFootprint (shared engine)', () => {
  it('returns vegan diet baseline', () => {
    const result = calculateFootprint({ diet: { type: 'vegan' } });
    expect(result.breakdown.diet).toBe(1050);
    expect(result.totalEmission).toBeGreaterThan(0);
  });
});
