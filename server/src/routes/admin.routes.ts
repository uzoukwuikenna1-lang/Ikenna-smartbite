import { Router } from 'express';

import { authenticate, requireRole } from '../middleware/auth.js';
import { Order } from '../models/Order.js';
import { User } from '../models/User.js';
import { Vendor } from '../models/Vendor.js';
import { asyncHandler, badRequest, notFound } from '../utils/http.js';
import { presentAdminUser, presentOrder, presentVendor } from '../utils/present.js';

const router = Router();
router.use(authenticate, requireRole('admin'));

// GET /api/admin/stats
router.get(
  '/stats',
  asyncHandler(async (_req, res) => {
    const [orders, vendors, users] = await Promise.all([Order.find().lean(), Vendor.find().lean(), User.find().lean()]);
    const revenue = orders.filter((o) => o.status === 'delivered').reduce((s, o) => s + o.total, 0);
    const byStatus: Record<string, number> = {};
    for (const o of orders) byStatus[o.status] = (byStatus[o.status] ?? 0) + 1;
    res.json({
      stats: {
        totalOrders: orders.length,
        revenue,
        vendors: vendors.length,
        pendingVendors: vendors.filter((v) => v.verification === 'pending').length,
        users: users.length,
        activeUsers: users.filter((u) => u.status === 'active').length,
        ordersByStatus: byStatus,
      },
    });
  }),
);

// GET /api/admin/vendors
router.get(
  '/vendors',
  asyncHandler(async (_req, res) => {
    const vendors = await Vendor.find().sort({ createdAt: 1 }).lean();
    res.json({ vendors: vendors.map(presentVendor) });
  }),
);

// PATCH /api/admin/vendors/:id/verification { status }
router.patch(
  '/vendors/:id/verification',
  asyncHandler(async (req, res) => {
    const { status } = req.body ?? {};
    if (!['verified', 'pending', 'suspended'].includes(status)) throw badRequest('Invalid verification status');
    const vendor = await Vendor.findByIdAndUpdate(req.params.id, { verification: status }, { new: true }).lean();
    if (!vendor) throw notFound('Vendor not found');
    res.json({ vendor: presentVendor(vendor) });
  }),
);

// GET /api/admin/orders?filter=all|active|done
router.get(
  '/orders',
  asyncHandler(async (req, res) => {
    const filter = String(req.query.filter ?? 'all');
    const q: Record<string, unknown> =
      filter === 'active'
        ? { status: { $nin: ['delivered', 'rejected'] } }
        : filter === 'done'
          ? { status: { $in: ['delivered', 'rejected'] } }
          : {};
    const orders = await Order.find(q).sort({ createdAt: -1 }).lean();
    res.json({ orders: orders.map((o) => presentOrder(o)) });
  }),
);

// GET /api/admin/users?role=customer|rider|vendor
router.get(
  '/users',
  asyncHandler(async (req, res) => {
    const role = req.query.role ? { role: String(req.query.role) } : { role: { $ne: 'admin' } };
    const users = await User.find(role).sort({ createdAt: 1 }).lean();
    res.json({ users: users.map(presentAdminUser) });
  }),
);

// PATCH /api/admin/users/:id/status — toggle suspend/active
router.patch(
  '/users/:id/status',
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) throw notFound('User not found');
    user.status = user.status === 'active' ? 'suspended' : 'active';
    await user.save();
    res.json({ user: presentAdminUser(user) });
  }),
);

export default router;
