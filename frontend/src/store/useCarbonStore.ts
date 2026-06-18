import { create } from 'zustand';
import { calculateFootprint } from '@carbonwise/shared';
import {
  getInsights,
  saveSnapshot,
  getHistory,
  getDeviceId,
  checkHealth,
  FootprintInputs,
  FootprintResponse,
  AIInsightResponse,
  HistoryEntry,
} from '../services/api';

interface CarbonStoreState {
  summary: FootprintResponse | null;
  insights: AIInsightResponse | null;
  history: HistoryEntry[];
  insightsLoading: boolean;
  insightsError: string | null;
  backendOnline: boolean | null;
  geminiEnabled: boolean | null;
  saved: boolean;
  error: string | null;
  hasCalculatedThisSession: boolean;
  selectedEntryId: string | null;
  calculate: (inputs: FootprintInputs) => Promise<boolean>;
  saveToHistory: () => Promise<void>;
  loadHistory: () => Promise<void>;
  selectHistoryEntry: (entry: HistoryEntry) => Promise<void>;
  retryInsights: () => Promise<void>;
  checkBackend: () => Promise<boolean>;
}

const getInitialSummary = (): FootprintResponse | null => {
  try {
    const data = localStorage.getItem('carbon_summary');
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

const getInitialInsights = (): AIInsightResponse | null => {
  try {
    const data = localStorage.getItem('carbon_insights');
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

const getInitialHistory = (): HistoryEntry[] => {
  try {
    const data = localStorage.getItem('carbon_history');
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const getInitialSelectedEntryId = (): string | null => {
  try {
    return localStorage.getItem('carbon_selected_entry_id');
  } catch {
    return null;
  }
};

function isNetworkError(error: unknown): boolean {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code?: string }).code;
    return code === 'ECONNREFUSED' || code === 'ERR_NETWORK' || code === 'ENOTFOUND';
  }
  return false;
}

async function fetchInsightsFromBackend(
  breakdown: Record<string, number>,
  inputs: FootprintInputs
): Promise<AIInsightResponse> {
  const insRes = await getInsights(breakdown, inputs);
  return insRes.data;
}

export const useCarbonStore = create<CarbonStoreState>((set, get) => ({
  summary: getInitialSummary(),
  insights: getInitialInsights(),
  history: getInitialHistory(),
  insightsLoading: false,
  insightsError: null,
  backendOnline: null,
  geminiEnabled: null,
  saved: false,
  error: null,
  hasCalculatedThisSession: !!getInitialSummary(),
  selectedEntryId: getInitialSelectedEntryId(),

  checkBackend: async () => {
    try {
      const res = await checkHealth();
      set({
        backendOnline: true,
        geminiEnabled: res.data.gemini.enabled,
        insightsError: null,
      });
      return true;
    } catch {
      set({
        backendOnline: false,
        geminiEnabled: null,
      });
      return false;
    }
  },

  calculate: async (inputs: FootprintInputs) => {
    set({ error: null, saved: false, hasCalculatedThisSession: true, selectedEntryId: null, insightsError: null });
    localStorage.removeItem('carbon_selected_entry_id');

    const summaryData = calculateFootprint(inputs);
    localStorage.setItem('carbon_summary', JSON.stringify(summaryData));
    localStorage.setItem('carbon_inputs', JSON.stringify(inputs));

    set({
      summary: summaryData,
      insights: null,
      insightsLoading: true,
      saved: false,
    });

    void (async () => {
      try {
        const online = get().backendOnline ?? (await get().checkBackend());
        if (!online) {
          set({
            insightsLoading: false,
            insightsError: 'AI server is offline. Run the backend: npm run dev (from project root starts both servers).',
          });
          return;
        }

        const insightsData = await fetchInsightsFromBackend(summaryData.breakdown, inputs);
        localStorage.setItem('carbon_insights', JSON.stringify(insightsData));
        set({ insights: insightsData, insightsLoading: false, insightsError: null });
      } catch (e) {
        const message = isNetworkError(e)
          ? 'Cannot reach the AI server. Make sure the backend is running on port 5000.'
          : 'Failed to load AI insights. Please try again.';
        set({ insightsLoading: false, insightsError: message });
      }
    })();

    return true;
  },

  retryInsights: async () => {
    const summary = get().summary;
    if (!summary) return;

    const inputsRaw = localStorage.getItem('carbon_inputs');
    const inputs = inputsRaw ? JSON.parse(inputsRaw) : ({} as FootprintInputs);

    set({ insightsLoading: true, insightsError: null, insights: null });

    try {
      const online = await get().checkBackend();
      if (!online) {
        set({
          insightsLoading: false,
          insightsError: 'AI server is offline. Run: npm run dev from the project root.',
        });
        return;
      }

      const insightsData = await fetchInsightsFromBackend(summary.breakdown, inputs);
      localStorage.setItem('carbon_insights', JSON.stringify(insightsData));
      set({ insights: insightsData, insightsLoading: false, insightsError: null });
    } catch (e) {
      const message = isNetworkError(e)
        ? 'Cannot reach the AI server. Make sure the backend is running on port 5000.'
        : 'Failed to load AI insights. Please try again.';
      set({ insightsLoading: false, insightsError: message });
    }
  },

  saveToHistory: async () => {
    const summary = get().summary;
    if (!summary || get().saved) return;

    const deviceId = getDeviceId();
    const inputsRaw = localStorage.getItem('carbon_inputs');
    const inputs = inputsRaw ? JSON.parse(inputsRaw) : {};

    const localEntry: HistoryEntry = {
      id: crypto.randomUUID(),
      deviceId,
      breakdown: summary.breakdown,
      totalEmission: summary.totalEmission,
      date: new Date().toISOString(),
      inputs,
    };

    const updatedHistory = [localEntry, ...get().history];
    localStorage.setItem('carbon_history', JSON.stringify(updatedHistory));
    set({ history: updatedHistory, saved: true, selectedEntryId: localEntry.id });
    localStorage.setItem('carbon_selected_entry_id', localEntry.id);

    if (get().backendOnline === false) return;

    try {
      await saveSnapshot(deviceId, summary.breakdown, summary.totalEmission, inputs);
    } catch (e) {
      if (isNetworkError(e)) {
        set({ backendOnline: false });
      }
      console.warn('⚠️ Cloud sync failed (entry still saved locally):', e);
    }
  },

  loadHistory: async () => {
    const deviceId = getDeviceId();
    const localHistory = getInitialHistory();
    set({ history: localHistory });

    const online = get().backendOnline ?? (await get().checkBackend());
    if (!online) return;

    try {
      const histRes = await getHistory(deviceId);
      const backendHistory = histRes.data;
      const combined = [...localHistory];

      for (const item of backendHistory) {
        if (!combined.some((c) => c.id === item.id)) {
          combined.push(item);
        }
      }

      combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      localStorage.setItem('carbon_history', JSON.stringify(combined));
      set({ history: combined });
    } catch (e) {
      if (isNetworkError(e)) {
        set({ backendOnline: false });
      }
      console.warn('⚠️ Could not sync history with cloud, continuing with local storage:', e);
    }
  },

  selectHistoryEntry: async (entry: HistoryEntry) => {
    set({
      insightsLoading: true,
      error: null,
      insightsError: null,
      saved: true,
      hasCalculatedThisSession: true,
      insights: null,
      selectedEntryId: entry.id,
    });
    localStorage.setItem('carbon_selected_entry_id', entry.id);

    const summaryData: FootprintResponse = {
      breakdown: entry.breakdown,
      totalEmission: entry.totalEmission,
      highestCategory: Object.entries(entry.breakdown).reduce((a, b) => (b[1] > a[1] ? b : a))[0],
      targets: {
        parisSustainableTarget: 2000,
        globalAverage: 4800,
      },
    };

    localStorage.setItem('carbon_summary', JSON.stringify(summaryData));
    if (entry.inputs) {
      localStorage.setItem('carbon_inputs', JSON.stringify(entry.inputs));
    } else {
      localStorage.removeItem('carbon_inputs');
    }

    set({ summary: summaryData });

    const inputs = entry.inputs ?? ({} as FootprintInputs);

    try {
      const online = get().backendOnline ?? (await get().checkBackend());
      if (!online) {
        set({
          insightsLoading: false,
          insightsError: 'AI server is offline. Run the backend to load personalized insights.',
        });
        return;
      }

      const insightsData = await fetchInsightsFromBackend(entry.breakdown, inputs);
      localStorage.setItem('carbon_insights', JSON.stringify(insightsData));
      set({ insights: insightsData, insightsLoading: false, insightsError: null });
    } catch (e) {
      const message = isNetworkError(e)
        ? 'Cannot reach the AI server. Make sure the backend is running on port 5000.'
        : 'Failed to load AI insights. Please try again.';
      set({ insightsLoading: false, insightsError: message });
    }
  },
}));
