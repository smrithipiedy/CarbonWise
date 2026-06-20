import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCarbonStore } from './useCarbonStore';

vi.mock('../services/api', () => {
  return {
    calculateFootprint: vi.fn().mockResolvedValue({ data: { totalEmission: 1000, breakdown: {} } }),
    getInsights: vi.fn().mockResolvedValue({ data: { summary: 'Insights', recommendations: [], source: 'rules' } }),
    getHistory: vi.fn().mockResolvedValue({ data: [] }),
    saveSnapshot: vi.fn().mockResolvedValue({ data: { id: 'test-id' } }),
    deleteEntry: vi.fn().mockResolvedValue({ data: {} }),
    clearHistory: vi.fn().mockResolvedValue({ data: {} }),
    checkHealth: vi.fn().mockResolvedValue({ data: { status: 'ok', gemini: { enabled: true } } }),
    getDeviceId: vi.fn().mockReturnValue('test-device-id'),
  };
});

describe('useCarbonStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useCarbonStore.setState({
      history: [],
      summary: null,
      insights: null,
      error: null,
      insightsError: null,
      inputs: null,
      hasCalculatedThisSession: false,
      saved: false,
      selectedEntryId: null,
      insightsLoading: false,
      backendOnline: true,
      geminiEnabled: true,
    });
  });

  it('calculate updates state and calls APIs', async () => {
    const store = useCarbonStore.getState();
    await store.calculate({} as any);
    await vi.waitFor(() => {
      const updatedStore = useCarbonStore.getState();
      expect(updatedStore.summary).toBeTruthy();
      expect(updatedStore.insights).toBeTruthy();
      expect(updatedStore.hasCalculatedThisSession).toBe(true);
    });
  });

  it('loadHistory loads history', async () => {
    const store = useCarbonStore.getState();
    await store.loadHistory();
    const updatedStore = useCarbonStore.getState();
    expect(updatedStore.history).toEqual([]);
  });

  it('checkBackend updates state', async () => {
    const store = useCarbonStore.getState();
    const online = await store.checkBackend();
    expect(online).toBe(true);
    expect(useCarbonStore.getState().backendOnline).toBe(true);
  });

  it('saveToHistory works', async () => {
    useCarbonStore.setState({ summary: { totalEmission: 100, breakdown: {} } as any });
    const store = useCarbonStore.getState();
    await store.saveToHistory();
    expect(useCarbonStore.getState().saved).toBe(true);
  });

  it('retryInsights works', async () => {
    useCarbonStore.setState({ summary: { totalEmission: 100, breakdown: {} } as any });
    const store = useCarbonStore.getState();
    await store.retryInsights();
    expect(useCarbonStore.getState().insights).toBeTruthy();
  });

  it('selectHistoryEntry works', async () => {
    const store = useCarbonStore.getState();
    await store.selectHistoryEntry({ id: 'ent1', totalEmission: 100, breakdown: { transport: 100 }, inputs: {} } as any);
    expect(useCarbonStore.getState().selectedEntryId).toBe('ent1');
  });

  it('selectHistoryEntry works offline', async () => {
    const store = useCarbonStore.getState();
    useCarbonStore.setState({ backendOnline: false });
    await store.selectHistoryEntry({ id: 'ent1', totalEmission: 100, breakdown: { transport: 100 }, inputs: null } as any);
  });
});
