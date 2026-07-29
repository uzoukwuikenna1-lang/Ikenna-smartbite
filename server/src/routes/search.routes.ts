import { Router } from 'express';

import { MenuItem } from '../models/MenuItem.js';
import { Vendor } from '../models/Vendor.js';
import { asyncHandler } from '../utils/http.js';
import { presentMenuItem, presentVendor } from '../utils/present.js';

const router = Router();

// GET /api/search?q=jollof — matches vendors and dishes
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const q = String(req.query.q ?? '').trim();
    if (!q) return res.json({ vendors: [], dishes: [] });
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    const [vendors, items] = await Promise.all([
      Vendor.find({ verification: { $ne: 'suspended' }, $or: [{ name: rx }, { tagline: rx }, { categories: rx }] }).lean(),
      MenuItem.find({ name: rx }).limit(10).lean(),
    ]);

    const dishes = items.map((m) => presentMenuItem(m));
    res.json({ vendors: vendors.map(presentVendor), dishes });
  }),
);

export default router;
