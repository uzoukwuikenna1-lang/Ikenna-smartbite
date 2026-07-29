import { Router, type Request } from 'express';

import { authenticate, requireRole } from '../middleware/auth.js';
import { MenuItem } from '../models/MenuItem.js';
import { Order, ORDER_STATUSES, type OrderStatus } from '../models/Order.js';
import { User } from '../models/User.js';
import { Vendor } from '../models/Vendor.js';
import { asyncHandler, badRequest, notFound } from '../utils/http.js';
import { presentMenuItem, presentOrder, presentVendor } from '../utils/present.js';
import { notifyUser } from '../utils/push.js';

const CUSTOMER_MSG: Record<string, { title: string; body: string }> = {
  accepted: { title: '✅ Order accepted', body: 'The vendor accepted your order and will start soon.' },
  rejected: { title: '❌ Order rejected', body: 'Sorry, the vendor could not take your order.' },
  preparing: { title: '👨‍🍳 Preparing your food', body: 'Your order is being prepared.' },
  rider_assigned: { title: '📦 Ready for pickup', body: 'Your order is ready and waiting for a rider.' },
};

const router = Router();
router.use(authenticate, requireRole('vendor'));

async function myVendorId(req: Request): Promise<string> {
  const user = await User.findById(req.user!.id).select('vendorId');
  if (!user?.vendorId) throw notFound('No vendor profile linked to this account');
  return String(user.vendorId);
}

// GET /api/vendor/me
router.get(
  '/me',
  asyncHandler(async (req, res) => {
    const vendor = await Vendor.findById(await myVendorId(req)).lean();
    if (!vendor) throw notFound('Vendor not found');
    res.json({ vendor: presentVendor(vendor) });
  }),
);

// PATCH /api/vendor/me  (e.g. toggle isOpen, edit tagline)
router.patch(
  '/me',
  asyncHandler(async (req, res) => {
    const allowed = ['name', 'tagline', 'emoji', 'color', 'deliveryFee', 'deliveryMins', 'minOrder', 'categories', 'isOpen'];
    const patch: Record<string, unknown> = {};
    for (const key of allowed) if (key in (req.body ?? {})) patch[key] = req.body[key];
    const vendor = await Vendor.findByIdAndUpdate(await myVendorId(req), patch, { new: true }).lean();
    res.json({ vendor: presentVendor(vendor!) });
  }),
);

// ---------- Menu ----------
router.get(
  '/menu',
  asyncHandler(async (req, res) => {
    const items = await MenuItem.find({ vendorId: await myVendorId(req) }).lean();
    res.json({ menu: items.map(presentMenuItem) });
  }),
);

router.post(
  '/menu',
  asyncHandler(async (req, res) => {
    const { name, description, price, emoji, image, category, popular } = req.body ?? {};
    if (!name || price == null || !category) throw badRequest('name, price and category are required');
    const item = await MenuItem.create({
      vendorId: await myVendorId(req),
      name,
      description: description ?? '',
      price: Number(price),
      emoji: emoji ?? '🍽️',
      image: image ?? '',
      category,
      popular: !!popular,
    });
    res.status(201).json({ item: presentMenuItem(item) });
  }),
);

router.patch(
  '/menu/:id',
  asyncHandler(async (req, res) => {
    const vendorId = await myVendorId(req);
    const allowed = ['name', 'description', 'price', 'emoji', 'image', 'category', 'popular', 'available'];
    const patch: Record<string, unknown> = {};
    for (const key of allowed) if (key in (req.body ?? {})) patch[key] = req.body[key];
    const item = await MenuItem.findOneAndUpdate({ _id: req.params.id, vendorId }, patch, { new: true }).lean();
    if (!item) throw notFound('Menu item not found');
    res.json({ item: presentMenuItem(item) });
  }),
);

router.delete(
  '/menu/:id',
  asyncHandler(async (req, res) => {
    const vendorId = await myVendorId(req);
    const del = await MenuItem.findOneAndDelete({ _id: req.params.id, vendorId });
    if (!del) throw notFound('Menu item not found');
    res.json({ ok: true });
  }),
);

// ---------- Orders ----------
router.get(
  '/orders',
  asyncHandler(async (req, res) => {
    const orders = await Order.find({ vendorId: await myVendorId(req) }).sort({ createdAt: -1 }).lean();
    res.json({ orders: orders.map((o) => presentOrder(o)) });
  }),
);

async function updateVendorOrder(req: Request, status: OrderStatus) {
  const vendorId = await myVendorId(req);
  const order = await Order.findOneAndUpdate({ _id: req.params.id, vendorId }, { status }, { new: true }).lean();
  if (!order) throw notFound('Order not found');
  const msg = CUSTOMER_MSG[status];
  if (msg) void notifyUser(order.customerId, msg.title, msg.body, { type: 'status', orderId: String(order._id) });
  return order;
}

router.patch(
  '/orders/:id/accept',
  asyncHandler(async (req, res) => {
    res.json({ order: presentOrder(await updateVendorOrder(req, 'accepted')) });
  }),
);

router.patch(
  '/orders/:id/reject',
  asyncHandler(async (req, res) => {
    res.json({ order: presentOrder(await updateVendorOrder(req, 'rejected')) });
  }),
);

router.patch(
  '/orders/:id/status',
  asyncHandler(async (req, res) => {
    const { status } = req.body ?? {};
    // Vendors may move an order through preparation up to "ready for pickup".
    const allowed: OrderStatus[] = ['accepted', 'preparing', 'rider_assigned'];
    if (!ORDER_STATUSES.includes(status) || !allowed.includes(status)) {
      throw badRequest('Invalid status for a vendor');
    }
    res.json({ order: presentOrder(await updateVendorOrder(req, status)) });
  }),
);

export default router;
