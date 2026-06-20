import { render } from '@testing-library/react';
import { describe, it } from 'vitest';
import ComparisonCard from './ComparisonCard';

describe('ComparisonCard', () => {
  it('renders sustainable', () => {
    render(<ComparisonCard totalTonnes={1.0} />);
  });
  it('renders global', () => {
    render(<ComparisonCard totalTonnes={3.0} />);
  });
  it('renders above global', () => {
    render(<ComparisonCard totalTonnes={10.0} />);
  });
});
