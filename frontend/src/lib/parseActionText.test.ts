import { describe, it, expect } from 'vitest';
import { parseActionText } from '../lib/parseActionText';

describe('parseActionText', () => {
  it('extracts heading, status, and details from a standard action string', () => {
    const result = parseActionText('🚗 Car Travel: Your fuel emissions are high. Reduce journeys by 30% (Bad)');
    expect(result.heading).toBe('🚗 Car Travel');
    expect(result.status).toBe('Bad');
    expect(result.details).toContain('Reduce journeys by 30%');
  });

  it('returns Moderate as the default status when none is specified', () => {
    const result = parseActionText('⚡ Electricity: Switch to renewable energy.');
    expect(result.status).toBe('Moderate');
    expect(result.details).toBe('Switch to renewable energy.');
  });

  it('handles Good status correctly', () => {
    const result = parseActionText('🥦 Diet: Plant-focused diet is excellent (Good). Keep it up!');
    expect(result.status).toBe('Good');
    expect(result.details).toContain('Plant-focused diet is excellent');
  });

  it('handles action strings without emoji', () => {
    const result = parseActionText('Car Travel: Drive less (Bad)');
    expect(result.heading).toContain('Car Travel');
    expect(result.status).toBe('Bad');
  });

  it('handles action strings without a colon separator', () => {
    const result = parseActionText('Reduce your emissions significantly (Bad)');
    expect(result.heading).toContain('Reduce your emissions significantly');
  });

  it('handles empty string gracefully', () => {
    const result = parseActionText('');
    expect(result.heading).toBeDefined();
    expect(result.status).toBe('Moderate');
    expect(result.details).toBe('');
  });
});
