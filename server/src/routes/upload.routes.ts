import { Router } from 'express';

import { authenticate, requireRole } from '../middleware/auth.js';
import { Image } from '../models/Image.js';
import { asyncHandler, badRequest, notFound } from '../utils/http.js';

const router = Router();

/**
 * POST /api/uploads  (vendor/admin)
 * Body: { dataUrl: "data:image/jpeg;base64,...." }
 * Returns an absolute URL the app can use directly in <Image source>.
 */
router.post(
  '/uploads',
  authenticate,
  requireRole('vendor', 'admin'),
  asyncHandler(async (req, res) => {
    const dataUrl = String(req.body?.dataUrl ?? '');
    const match = dataUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
    if (!match) throw badRequest('Provide an image as a base64 data URL');

    const contentType = match[1];
    const buffer = Buffer.from(match[2], 'base64');
    if (buffer.length > 6 * 1024 * 1024) throw badRequest('Image too large (max ~6MB)');

    const image = await Image.create({ data: buffer, contentType, ownerId: req.user!.id });
    const url = `${req.protocol}://${req.get('host')}/api/images/${image._id}`;
    res.status(201).json({ url, id: String(image._id) });
  }),
);

// GET /api/images/:id  (public — so food photos render everywhere)
router.get(
  '/images/:id',
  asyncHandler(async (req, res) => {
    const image = await Image.findById(req.params.id);
    if (!image) throw notFound('Image not found');
    // Ensure we write raw bytes (Mongo may hand back a BSON Binary, not a Buffer).
    const raw = image.data as unknown as { buffer?: Buffer };
    const buf = Buffer.isBuffer(image.data) ? image.data : Buffer.from(raw.buffer ?? (image.data as unknown as Uint8Array));
    res.setHeader('Content-Type', image.contentType || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.end(buf);
  }),
);

export default router;
