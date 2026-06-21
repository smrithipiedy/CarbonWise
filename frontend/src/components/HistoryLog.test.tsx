import { render } from '@testing-library/react';
import { describe, it, vi } from 'vitest';
import HistoryLog from './HistoryLog';

describe('HistoryLog', () => {
  it('renders empty', () => {
    render(<HistoryLog history={[]} summary={null} selectedEntryId={null} selectHistoryEntry={vi.fn()} saveToHistory={vi.fn()} />);
  });
  it('renders with data', () => {
    render(<HistoryLog history={[
      { id: '1', date: new Date().toISOString(), totalEmission: 5000, breakdown: {} } as any,
      { id: '2', date: new Date().toISOString(), totalEmission: 4000, breakdown: {} } as any
    ]} summary={{ totalEmission: 5000, breakdown: {} } as any} selectedEntryId={'1'} selectHistoryEntry={vi.fn()} saveToHistory={vi.fn()} />);
  });
});
