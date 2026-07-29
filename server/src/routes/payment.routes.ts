import { Router } from 'express';

import { authenticate, requireRole } from '../middleware/auth.js';
import { asyncHandler, badRequest } from '../utils/http.js';

const router = Router();

/**
 * POST /api/payments/mock-charge
 * Fake payment endpoint for the proof-of-concept — always "succeeds" and returns
 * a reference. No real money moves and no card data is stored. Swap for Paystack
 * later by verifying a real transaction here.
 */
router.post(
  '/mock-charge',
  authenticate,
  requireRole('customer'),
  asyncHandler(async (req, res) => {
    const amount = Number(req.body?.amount);
    if (!amount || amount <= 0) throw badRequest('A positive amount is required');
    const reference = `MOCK-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
    res.json({ ok: true, status: 'success', reference, amount });
  }),
);

export default router;
