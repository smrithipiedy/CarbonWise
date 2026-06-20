import { describe, it, expect, vi, beforeEach } from 'vitest';
import api, { checkHealth, getDeviceId, calculateFootprint, getInsights, saveSnapshot, getHistory, clearHistory, deleteEntry } from './api';

vi.mock('axios', () => {
  return {
    default: {
      create: vi.fn().mockReturnValue({
        get: vi.fn(),
        post: vi.fn(),
        delete: vi.fn(),
      }),
    },
  };
});

describe('api.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('getDeviceId generates and stores a UUID', () => {
    const id = getDeviceId();
    expect(id).toBeTruthy();
    expect(localStorage.getItem('deviceId')).toBe(id);
    const id2 = getDeviceId();
    expect(id).toBe(id2);
  });

  it('checkHealth calls /health', async () => {
    (api.get as any).mockResolvedValue({ data: { status: 'ok' } });
    const res = await checkHealth();
    expect(api.get).toHaveBeenCalledWith('/health');
    expect(res).toEqual({ data: { status: 'ok' } });
  });

  it('calculateFootprint calls /calculate', async () => {
    (api.post as any).mockResolvedValue({ data: { totalEmission: 1000 } });
    const res = await calculateFootprint({} as any);
    expect(api.post).toHaveBeenCalledWith('/calculate', {});
    expect(res).toEqual({ data: { totalEmission: 1000 } });
  });

  it('getInsights calls /insights', async () => {
    (api.post as any).mockResolvedValue({ data: { summary: 'Good' } });
    const res = await getInsights({ transport: 100 }, {} as any);
    expect(api.post).toHaveBeenCalledWith('/insights', { breakdown: { transport: 100 }, inputs: {} });
    expect(res).toEqual({ data: { summary: 'Good' } });
  });

  it('saveSnapshot calls /entries', async () => {
    (api.post as any).mockResolvedValue({ data: { status: 'ok' } });
    const res = await saveSnapshot('dev1', { transport: 100 }, 100, {} as any);
    expect(api.post).toHaveBeenCalledWith('/entries', { deviceId: 'dev1', breakdown: { transport: 100 }, totalEmission: 100, inputs: {} });
    expect(res).toEqual({ data: { status: 'ok' } });
  });

  it('getHistory calls /entries/id', async () => {
    (api.get as any).mockResolvedValue({ data: [] });
    const res = await getHistory('dev1');
    expect(api.get).toHaveBeenCalledWith('/entries/dev1');
    expect(res).toEqual({ data: [] });
  });

  it('clearHistory calls DELETE /entries/id', async () => {
    (api.delete as any).mockResolvedValue({ data: { status: 'ok' } });
    const res = await clearHistory('dev1');
    expect(api.delete).toHaveBeenCalledWith('/entries/dev1');
    expect(res).toEqual({ data: { status: 'ok' } });
  });

  it('deleteEntry calls DELETE /entries/id/entryId', async () => {
    (api.delete as any).mockResolvedValue({ data: { status: 'ok' } });
    const res = await deleteEntry('dev1', 'ent1');
    expect(api.delete).toHaveBeenCalledWith('/entries/dev1/ent1');
    expect(res).toEqual({ data: { status: 'ok' } });
  });
});
