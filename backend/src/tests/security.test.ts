import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import express from 'express';
import { requireJsonContentType } from '../middleware/security';

function startTestServer(): Promise<{ server: http.Server; baseUrl: string }> {
  return new Promise((resolve) => {
    const app = express();
    app.use(requireJsonContentType);
    app.post('/test', (_req, res) => {
      res.json({ success: true });
    });

    const server = app.listen(0, '127.0.0.1', () => {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : 0;
      resolve({ server, baseUrl: `http://127.0.0.1:${port}` });
    });
  });
}

describe('Security Middleware', () => {
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

  it('rejects POST requests without application/json content type', async () => {
    const res = await fetch(`${baseUrl}/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: 'invalid data',
    });
    assert.equal(res.status, 415);
    const json = await res.json() as { error: string };
    assert.equal(json.error, 'Content-Type must be application/json');
  });

  it('accepts POST requests with application/json content type', async () => {
    const res = await fetch(`${baseUrl}/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ valid: true }),
    });
    assert.equal(res.status, 200);
    const json = await res.json() as { success: boolean };
    assert.equal(json.success, true);
  });
});
