import { Router } from 'express';

import { MenuItem } from '../models/MenuItem.js';
import { Review } from '../models/Review.js';
import { Vendor } from '../models/Vendor.js';
import { asyncHandler, notFound } from '../utils/http.js';
import { presentMenuItem, presentReview, presentVendor } from '../utils/present.js';

const router = Router();

// GET /api/vendors — browse all vendors (open ones first for the customer home)
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const vendors = await Vendor.find({ verification: { $ne: 'suspended' } }).lean();
    vendors.sort((a, b) => Number(b.isOpen) - Number(a.isOpen));
    res.json({ vendors: vendors.map(presentVendor) });
  }),
);

// GET /api/vendors/:id
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const vendor = await Vendor.findById(req.params.id).lean();
    if (!vendor) throw notFound('Vendor not found');
    res.json({ vendor: presentVendor(vendor) });
  }),
);

// GET /api/vendors/:id/menu
router.get(
  '/:id/menu',
  asyncHandler(async (req, res) => {
    const items = await MenuItem.find({ vendorId: req.params.id }).lean();
    res.json({ menu: items.map(presentMenuItem) });
  }),
);

// GET /api/vendors/:id/reviews
router.get(
  '/:id/reviews',
  asyncHandler(async (req, res) => {
    const reviews = await Review.find({ vendorId: req.params.id }).sort({ createdAt: -1 }).limit(20).lean();
    res.json({ reviews: reviews.map(presentReview) });
  }),
);

export default router;
