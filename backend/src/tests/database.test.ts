import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import { dbRepository } from '../database';

describe('Database Repository', () => {
  it('throws when saving local db fails', async () => {
    // Mock writeFile to simulate disk failure
    mock.method(fs.promises, 'writeFile', async () => {
      throw new Error('Disk full');
    });

    try {
      await dbRepository.saveEntry({
        id: 'test-id',
        deviceId: 'device-id',
        breakdown: {},
        totalEmission: 100,
        inputs: {},
        date: '2023-01-01T00:00:00Z',
      });
      assert.fail('Expected saveEntry to throw');
    } catch (e: unknown) {
      assert.ok(e instanceof Error);
      assert.strictEqual(e.message, 'Disk full');
    } finally {
      mock.restoreAll();
    }
  });
});
