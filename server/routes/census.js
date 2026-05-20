import { Router } from 'express';
import { profilesForDguids } from '../statcan/profile.js';

const router = Router();

/**
 * POST /api/census/profiles
 * body: { dguids: string[] }
 * → { ok, data: Profile[], mock }
 *
 * Batched on purpose: CensusMapper accepts many regions in one call.
 */
router.post('/profiles', async (req, res) => {
  const dguids = Array.isArray(req.body?.dguids) ? req.body.dguids : null;
  if (!dguids) return res.status(400).json({ ok: false, error: 'Body must be { dguids: string[] }' });
  if (dguids.length === 0) return res.json({ ok: true, data: [], mock: false });
  if (dguids.length > 300) return res.status(400).json({ ok: false, error: 'Too many DGUIDs (max 300)' });

  try {
    const result = await profilesForDguids(dguids);
    res.json(result);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
