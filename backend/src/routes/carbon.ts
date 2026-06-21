import { Router, Request, Response } from 'express';
import { calculateFootprint } from '../carbon/engine';
import { generateInsights } from '../insights/gemini';
import { dbRepository } from '../database';
import { randomUUID } from 'crypto';
import { USE_GEMINI, GEMINI_API_KEY } from '../config';
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

/**
 * GET /health
 * @description Health check endpoint for the API. Returns system status and Gemini integration state.
 */
router.get('/health', (_req: Request, res: Response) => {
  const geminiActive = USE_GEMINI && Boolean(GEMINI_API_KEY);
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    gemini: {
      enabled: geminiActive,
      model: geminiActive ? 'gemini-2.5-flash' : null,
    },
  });
});

/**
 * POST /calculate
 * @description Calculates the user's carbon footprint based on provided inputs.
 */
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

/**
 * POST /insights
 * @description Generates AI or rule-based insights for the given carbon footprint breakdown.
 */
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

/**
 * POST /entries
 * @description Saves a new carbon footprint entry snapshot for a specific device.
 */
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

/**
 * GET /entries/:device_id
 * @description Retrieves all historical carbon footprint entries for a given device ID.
 */
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

/**
 * DELETE /entries/:device_id
 * @description Deletes all historical carbon footprint entries for a given device ID.
 */
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

/**
 * DELETE /entries/:device_id/:entry_id
 * @description Deletes a single specific carbon footprint entry for a given device ID.
 */
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
