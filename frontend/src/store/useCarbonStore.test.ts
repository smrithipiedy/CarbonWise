import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCarbonStore } from './useCarbonStore';
import * as api from '../services/api';

vi.mock('../services/api', () => {
  return {
    calculateFootprint: vi.fn().mockReturnValue({ totalEmission: 1000, breakdown: { transport: 500 } }),
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
    localStorage.clear();
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

  it('handles local storage errors on initialization', async () => {
    vi.resetModules();
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    
    // Dynamically import the store after mocking to trigger initializers catch block
    const { useCarbonStore: dynamicStore } = await import('./useCarbonStore');
    expect(dynamicStore.getState().summary).toBeNull();
    expect(dynamicStore.getState().history).toEqual([]);
    expect(dynamicStore.getState().selectedEntryId).toBeNull();
    
    spy.mockRestore();
  });

  it('handles invalid json or schema validation failures in local storage initialization', async () => {
    vi.resetModules();
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => {
      if (key === 'carbon_summary') return '{ "invalid": true }';
      if (key === 'carbon_insights') return '{ "invalid": true }';
      if (key === 'carbon_history') return '[{ "invalid": true }]';
      return null;
    });

    const { useCarbonStore: dynamicStore } = await import('./useCarbonStore');
    expect(dynamicStore.getState().summary).toBeNull();
    expect(dynamicStore.getState().insights).toBeNull();
    expect(dynamicStore.getState().history).toEqual([]);

    spy.mockRestore();
  });

  it('calculate updates state and calls APIs when online', async () => {
    const store = useCarbonStore.getState();
    const success = await store.calculate({} as any);
    expect(success).toBe(true);
    await vi.waitFor(() => {
      const updatedStore = useCarbonStore.getState();
      expect(updatedStore.summary).toBeTruthy();
      expect(updatedStore.insights).toBeTruthy();
      expect(updatedStore.hasCalculatedThisSession).toBe(true);
    });
  });

  it('calculate handles offline backend', async () => {
    vi.mocked(api.checkHealth).mockRejectedValueOnce(new Error('Offline'));
    const store = useCarbonStore.getState();
    useCarbonStore.setState({ backendOnline: null });
    
    await store.calculate({} as any);
    await vi.waitFor(() => {
      const updatedStore = useCarbonStore.getState();
      expect(updatedStore.backendOnline).toBe(false);
      expect(updatedStore.insightsError).toContain('AI server is offline');
    });
  });

  it('calculate handles backend already offline without calling checkBackend', async () => {
    const store = useCarbonStore.getState();
    useCarbonStore.setState({ backendOnline: false });
    
    await store.calculate({} as any);
    await vi.waitFor(() => {
      const updatedStore = useCarbonStore.getState();
      expect(updatedStore.insightsError).toContain('AI server is offline');
    });
  });

  it('calculate handles backend error', async () => {
    vi.mocked(api.getInsights).mockRejectedValueOnce(new Error('Some API Error'));
    const store = useCarbonStore.getState();
    
    await store.calculate({} as any);
    await vi.waitFor(() => {
      const updatedStore = useCarbonStore.getState();
      expect(updatedStore.insightsError).toBe('Some API Error');
    });
  });

  it('calculate handles string error rejection', async () => {
    vi.mocked(api.getInsights).mockRejectedValueOnce('A string error');
    const store = useCarbonStore.getState();
    await store.calculate({} as any);
    await vi.waitFor(() => {
      expect(useCarbonStore.getState().insightsError).toBe('Failed to load AI insights. Please try again.');
    });
  });

  it('calculate handles backend network error', async () => {
    const networkError = new Error('Network failed');
    (networkError as any).code = 'ECONNREFUSED';
    vi.mocked(api.getInsights).mockRejectedValueOnce(networkError);
    const store = useCarbonStore.getState();
    
    await store.calculate({} as any);
    await vi.waitFor(() => {
      const updatedStore = useCarbonStore.getState();
      expect(updatedStore.insightsError).toContain('Cannot reach the AI server');
    });
  });

  it('loadHistory loads history successfully', async () => {
    const store = useCarbonStore.getState();
    await store.loadHistory();
    const updatedStore = useCarbonStore.getState();
    expect(updatedStore.history).toEqual([]);
  });

  it('loadHistory does nothing if backend is offline', async () => {
    const store = useCarbonStore.getState();
    useCarbonStore.setState({ backendOnline: false });
    await store.loadHistory();
  });

  it('loadHistory checks backend and returns if check fails', async () => {
    vi.mocked(api.checkHealth).mockRejectedValueOnce(new Error('Offline'));
    const store = useCarbonStore.getState();
    useCarbonStore.setState({ backendOnline: null });
    await store.loadHistory();
    expect(useCarbonStore.getState().backendOnline).toBe(false);
  });

  it('loadHistory combines history and avoids duplicates', async () => {
    const entry1 = { id: 'ent-1', deviceId: 'test-device-id', totalEmission: 100, breakdown: {}, date: new Date().toISOString() };
    const entry2 = { id: 'ent-2', deviceId: 'test-device-id', totalEmission: 200, breakdown: {}, date: new Date().toISOString() };
    
    localStorage.setItem('carbon_history', JSON.stringify([entry1]));
    
    vi.mocked(api.getHistory).mockResolvedValueOnce({
      data: [entry1, entry2]
    } as any);

    useCarbonStore.setState({ backendOnline: true });
    const store = useCarbonStore.getState();
    await store.loadHistory();
    
    expect(useCarbonStore.getState().history.length).toBe(2);
  });

  it('loadHistory handles network error', async () => {
    const networkError = new Error('Network failed');
    (networkError as any).code = 'ERR_NETWORK';
    vi.mocked(api.getHistory).mockRejectedValueOnce(networkError);

    const store = useCarbonStore.getState();
    useCarbonStore.setState({ backendOnline: true });
    await store.loadHistory();
    expect(useCarbonStore.getState().backendOnline).toBe(false);
  });

  it('checkBackend updates state', async () => {
    const store = useCarbonStore.getState();
    const online = await store.checkBackend();
    expect(online).toBe(true);
    expect(useCarbonStore.getState().backendOnline).toBe(true);
  });

  it('checkBackend handles rejection', async () => {
    vi.mocked(api.checkHealth).mockRejectedValueOnce(new Error('Offline'));
    const store = useCarbonStore.getState();
    const online = await store.checkBackend();
    expect(online).toBe(false);
    expect(useCarbonStore.getState().backendOnline).toBe(false);
  });

  it('saveToHistory works', async () => {
    useCarbonStore.setState({ summary: { totalEmission: 100, breakdown: {} } as any });
    const store = useCarbonStore.getState();
    await store.saveToHistory();
    expect(useCarbonStore.getState().saved).toBe(true);
  });

  it('saveToHistory does nothing if no summary', async () => {
    const store = useCarbonStore.getState();
    await store.saveToHistory();
    expect(useCarbonStore.getState().saved).toBe(false);
  });

  it('saveToHistory does nothing if already saved', async () => {
    useCarbonStore.setState({ summary: { totalEmission: 100, breakdown: {} } as any, saved: true });
    const store = useCarbonStore.getState();
    await store.saveToHistory();
  });

  it('saveToHistory returns if backend is offline', async () => {
    useCarbonStore.setState({ summary: { totalEmission: 100, breakdown: {} } as any, backendOnline: false });
    const store = useCarbonStore.getState();
    await store.saveToHistory();
  });

  it('saveToHistory handles network error', async () => {
    const networkError = new Error('Network failed');
    (networkError as any).code = 'ENOTFOUND';
    vi.mocked(api.saveSnapshot).mockRejectedValueOnce(networkError);

    useCarbonStore.setState({ summary: { totalEmission: 100, breakdown: {} } as any });
    const store = useCarbonStore.getState();
    await store.saveToHistory();
    expect(useCarbonStore.getState().backendOnline).toBe(false);
  });

  it('retryInsights works', async () => {
    useCarbonStore.setState({ summary: { totalEmission: 100, breakdown: {} } as any });
    const store = useCarbonStore.getState();
    await store.retryInsights();
    expect(useCarbonStore.getState().insights).toBeTruthy();
  });

  it('retryInsights does nothing if no summary', async () => {
    const store = useCarbonStore.getState();
    await store.retryInsights();
    expect(useCarbonStore.getState().insightsLoading).toBe(false);
  });

  it('retryInsights handles offline backend', async () => {
    vi.mocked(api.checkHealth).mockRejectedValueOnce(new Error('Offline'));
    useCarbonStore.setState({ summary: { totalEmission: 100, breakdown: {} } as any });
    
    const store = useCarbonStore.getState();
    await store.retryInsights();
    expect(useCarbonStore.getState().insightsError).toContain('AI server is offline');
  });

  it('retryInsights handles general error', async () => {
    vi.mocked(api.getInsights).mockRejectedValueOnce(new Error('Fetch failed'));
    useCarbonStore.setState({ summary: { totalEmission: 100, breakdown: {} } as any });
    
    const store = useCarbonStore.getState();
    await store.retryInsights();
    expect(useCarbonStore.getState().insightsError).toBe('Fetch failed');
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
    expect(useCarbonStore.getState().insightsError).toContain('AI server is offline');
  });

  it('selectHistoryEntry handles api failure', async () => {
    vi.mocked(api.getInsights).mockRejectedValueOnce(new Error('Failed fetching insights'));
    const store = useCarbonStore.getState();
    await store.selectHistoryEntry({ id: 'ent1', totalEmission: 100, breakdown: { transport: 100 }, inputs: null } as any);
    expect(useCarbonStore.getState().insightsError).toBe('Failed fetching insights');
  });
});
