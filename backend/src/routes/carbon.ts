import { Router, Request, Response } from 'express';
import { calculateFootprint } from '../carbon/engine';
import { generateInsights } from '../insights/gemini';
import { dbRepository } from '../database';
import { randomUUID } from 'crypto';
import { USE_GEMINI } from '../config';
import { safeErrorMessage } from '../utils/errors';
import { insightsRateLimiter, apiRateLimiter } from '../middleware/rateLimiter';
import {
  footprintInputSchema,
  insightsRequestSchema,
  saveEntrySchema,
  deviceIdParamSchema,
  entryIdParamSchema,
} from '../validation/schemas';

const router = Router();

router.use(apiRateLimiter);

router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    gemini: {
      enabled: USE_GEMINI,
      model: USE_GEMINI ? 'gemini-2.5-flash' : null,
    },
  });
});

router.post('/calculate', (req: Request, res: Response) => {
  const parsed = footprintInputSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      error: 'Invalid input data',
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  try {
    const result = calculateFootprint(parsed.data);
    res.json(result);
  } catch (error: unknown) {
    res.status(500).json({ error: safeErrorMessage(error, 'Calculation error') });
  }
});

router.post('/insights', insightsRateLimiter, async (req: Request, res: Response) => {
  const parsed = insightsRequestSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      error: 'Invalid insights request',
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  try {
    const { breakdown, inputs } = parsed.data;
    const result = await generateInsights(breakdown, inputs);
    res.json(result);
  } catch (error: unknown) {
    res.status(500).json({ error: safeErrorMessage(error, 'Insights extraction error') });
  }
});

router.post('/entries', async (req: Request, res: Response) => {
  const parsed = saveEntrySchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      error: 'Invalid entry data',
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const { deviceId, breakdown, totalEmission, inputs } = parsed.data;
  const entryId = randomUUID();
  const entryData = {
    id: entryId,
    deviceId,
    breakdown,
    totalEmission,
    inputs: inputs ?? {},
    date: new Date().toISOString(),
  };

  try {
    await dbRepository.saveEntry(entryData);
    res.json({ status: 'success', id: entryId });
  } catch (error: unknown) {
    res.status(500).json({ error: safeErrorMessage(error, 'Database write failure') });
  }
});

router.get('/entries/:device_id', async (req: Request, res: Response) => {
  const parsed = deviceIdParamSchema.safeParse(req.params.device_id);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid device ID format' });
    return;
  }

  try {
    const entries = await dbRepository.getEntriesByDevice(parsed.data);
    res.json(entries);
  } catch (error: unknown) {
    res.status(500).json({ error: safeErrorMessage(error, 'Database read failure') });
  }
});

router.delete('/entries/:device_id', async (req: Request, res: Response) => {
  const parsed = deviceIdParamSchema.safeParse(req.params.device_id);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid device ID format' });
    return;
  }

  try {
    const count = await dbRepository.deleteEntriesByDevice(parsed.data);
    res.json({ status: 'success', message: `Deleted ${count} snapshots` });
  } catch (error: unknown) {
    res.status(500).json({ error: safeErrorMessage(error, 'Database clear failure') });
  }
});

router.delete('/entries/:device_id/:entry_id', async (req: Request, res: Response) => {
  const deviceParsed = deviceIdParamSchema.safeParse(req.params.device_id);
  const entryParsed = entryIdParamSchema.safeParse(req.params.entry_id);

  if (!deviceParsed.success || !entryParsed.success) {
    res.status(400).json({ error: 'Invalid device or entry ID format' });
    return;
  }

  try {
    const success = await dbRepository.deleteSingleEntry(deviceParsed.data, entryParsed.data);
    if (success) {
      res.json({ status: 'success', message: 'Entry deleted successfully' });
    } else {
      res.status(404).json({ error: 'Entry not found or unauthorized' });
    }
  } catch (error: unknown) {
    res.status(500).json({ error: safeErrorMessage(error, 'Database entry delete failure') });
  }
});

export default router;
