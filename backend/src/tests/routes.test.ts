import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import express from 'express';
import carbonRouter from '../routes/carbon';

function startTestServer(): Promise<{ server: http.Server; baseUrl: string }> {
  return new Promise((resolve) => {
    const app = express();
    app.use(express.json());
    app.use('/api', carbonRouter);

    const server = app.listen(0, '127.0.0.1', () => {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : 0;
      resolve({ server, baseUrl: `http://127.0.0.1:${port}/api` });
    });
  });
}

async function request(
  baseUrl: string,
  method: string,
  path: string,
  body?: unknown
): Promise<{ status: number; json: unknown }> {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, json: await res.json() };
}

describe('API routes', () => {
  let server: http.Server;
  let baseUrl: string;

  before(async () => {
    const started = await startTestServer();
    server = started.server;
    baseUrl = started.baseUrl;
  });

  after(() => {
    server.close();
  });

  it('GET /health returns healthy status', async () => {
    const { status, json } = await request(baseUrl, 'GET', '/health');
    assert.equal(status, 200);
    assert.equal((json as { status: string }).status, 'healthy');
  });

  it('POST /calculate returns footprint breakdown', async () => {
    const { status, json } = await request(baseUrl, 'POST', '/calculate', {
      diet: { type: 'vegan' },
    });
    assert.equal(status, 200);
    const result = json as { totalEmission: number; breakdown: Record<string, number> };
    assert.ok(result.totalEmission > 0);
    assert.equal(result.breakdown.diet, 1050);
  });

  it('POST /calculate rejects invalid diet type', async () => {
    const { status } = await request(baseUrl, 'POST', '/calculate', {
      diet: { type: 'carnivore' },
    });
    assert.equal(status, 400);
  });

  it('POST /insights returns personalized recommendations', async () => {
    const { status, json } = await request(baseUrl, 'POST', '/insights', {
      breakdown: { transport: 5000, home: 1000, diet: 1500, consumption: 200 },
      inputs: { transport: { car_km_per_week: 200 } },
    });
    assert.equal(status, 200);
    const result = json as { source: string; summary: string; recommendations: unknown[] };
    assert.ok(['gemini', 'rules'].includes(result.source));
    assert.ok(typeof result.summary === 'string' && result.summary.length > 0);
    assert.ok(Array.isArray(result.recommendations) && result.recommendations.length >= 2);
  });

  it('GET /entries rejects invalid device UUID', async () => {
    const { status } = await request(baseUrl, 'GET', '/entries/not-valid');
    assert.equal(status, 400);
  });

  it('POST /entries saves a snapshot', async () => {
    const deviceId = '550e8400-e29b-41d4-a716-446655440000';
    const { status, json } = await request(baseUrl, 'POST', '/entries', {
      deviceId,
      breakdown: { transport: 1, home: 2, diet: 3, consumption: 4 },
      totalEmission: 10,
      inputs: { diet: { type: 'vegan' } },
    });
    assert.equal(status, 200);
    assert.equal((json as { status: string }).status, 'success');
  });
});
