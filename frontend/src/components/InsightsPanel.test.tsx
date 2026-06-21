import { render } from '@testing-library/react';
import { describe, it } from 'vitest';
import InsightsPanel from './InsightsPanel';

describe('InsightsPanel', () => {
  it('renders loading', () => {
    render(<InsightsPanel insights={null} summary={{ totalEmission: 5000 } as any} insightsLoading={true} />);
  });
  it('renders error', () => {
    render(<InsightsPanel insights={null} summary={{ totalEmission: 5000 } as any} insightsError="Error" />);
  });
  it('renders with data', () => {
    render(<InsightsPanel insights={{ summary: 'test', recommendations: [
      { category: 'transport', action: 'Drive less', estimated_annual_savings_kg: 100 }
    ], source: 'rules' }} summary={{ totalEmission: 5000 } as any} />);
  });
});
