import { render } from '@testing-library/react';
import { describe, it, vi } from 'vitest';
import App from './App';
import { useCarbonStore } from './store/useCarbonStore';

vi.mock('./store/useCarbonStore', () => ({
  useCarbonStore: Object.assign(vi.fn(), {
    getState: vi.fn().mockReturnValue({
      summary: null,
      insights: null,
      geminiEnabled: true,
      retryInsights: vi.fn()
    })
  })
}));

describe('App', () => {
  it('renders online', () => {
    (useCarbonStore as any).mockImplementation((selector: any) => selector({
      backendOnline: true,
      geminiEnabled: true,
      checkBackend: vi.fn().mockResolvedValue(true),
      loadHistory: vi.fn(),
      summary: null,
      insights: null,
      retryInsights: vi.fn()
    }));
    render(<App />);
  });

  it('renders offline', () => {
    (useCarbonStore as any).mockImplementation((selector: any) => selector({
      backendOnline: false,
      geminiEnabled: false,
      checkBackend: vi.fn().mockResolvedValue(false),
      loadHistory: vi.fn(),
      summary: null,
      insights: null,
      retryInsights: vi.fn()
    }));
    render(<App />);
  });
});
