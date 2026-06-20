import { render } from '@testing-library/react';
import { describe, it, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import ResultsPage from './ResultsPage';
import { useCarbonStore } from '../store/useCarbonStore';

vi.mock('../store/useCarbonStore', () => ({
  useCarbonStore: vi.fn()
}));

describe('ResultsPage', () => {
  it('renders default', () => {
    (useCarbonStore as any).mockImplementation((selector: any) => selector({
      summary: { totalEmission: 5000, breakdown: { transport: 1000, home: 4000 } },
      insights: { summary: 'test', recommendations: [], source: 'rules' },
      history: [],
      saved: false,
      error: null,
      hasCalculatedThisSession: true,
      insightsLoading: false,
      insightsError: null,
      selectedEntryId: null,
      saveToHistory: vi.fn(),
      selectHistoryEntry: vi.fn(),
      retryInsights: vi.fn()
    }));
    render(<BrowserRouter><ResultsPage /></BrowserRouter>);
  });

  it('renders no session', () => {
    (useCarbonStore as any).mockImplementation((selector: any) => selector({
      summary: null,
      insights: null,
      history: [],
      saved: false,
      error: null,
      hasCalculatedThisSession: false,
      insightsLoading: false,
      insightsError: null,
      selectedEntryId: null,
      saveToHistory: vi.fn(),
      selectHistoryEntry: vi.fn(),
      retryInsights: vi.fn()
    }));
    render(<BrowserRouter><ResultsPage /></BrowserRouter>);
  });

  it('renders error', () => {
    (useCarbonStore as any).mockImplementation((selector: any) => selector({
      summary: null,
      insights: null,
      history: [],
      saved: false,
      error: 'test error',
      hasCalculatedThisSession: true,
      insightsLoading: false,
      insightsError: null,
      selectedEntryId: null,
      saveToHistory: vi.fn(),
      selectHistoryEntry: vi.fn(),
      retryInsights: vi.fn()
    }));
    render(<BrowserRouter><ResultsPage /></BrowserRouter>);
  });
});
