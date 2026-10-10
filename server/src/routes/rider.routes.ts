import { Router } from 'express';

import { authenticate, requireRole } from '../middleware/auth.js';
import { Order, type OrderStatus } from '../models/Order.js';
import { asyncHandler, badRequest, notFound } from '../utils/http.js';
import { presentOrder } from '../utils/present.js';
import { notifyUser } from '../utils/push.js';

const RIDER_MSG: Record<string, { title: string; body: string }> = {
  picked_up: { title: '🛵 Order picked up', body: 'Your rider has picked up your food.' },
  delivering: { title: '🛵 On the way', body: 'Your rider is heading to you now.' },
  delivered: { title: '🎉 Delivered', body: 'Your order has arrived. Enjoy your meal!' },
};

const router = Router();
router.use(authenticate, requireRole('rider'));

// GET /api/rider/available — orders vendors marked ready, not yet claimed
router.get(
  '/available',
  asyncHandler(async (_req, res) => {
    const orders = await Order.find({ status: 'rider_assigned', riderAccepted: { $ne: true } })
      .sort({ createdAt: 1 })
      .lean();
    res.json({ orders: orders.map((o) => presentOrder(o)) });
  }),
);

// GET /api/rider/deliveries — everything this rider has claimed
router.get(
  '/deliveries',
  asyncHandler(async (req, res) => {
    const orders = await Order.find({ riderId: req.user!.id }).sort({ createdAt: -1 }).lean();
    res.json({ orders: orders.map((o) => presentOrder(o)) });
  }),
);

// PATCH /api/rider/orders/:id/accept — claim a delivery
router.patch(
  '/orders/:id/accept',
  asyncHandler(async (req, res) => {
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, status: 'rider_assigned', riderAccepted: { $ne: true } },
      { riderAccepted: true, riderId: req.user!.id },
      { new: true },
    ).lean();
    if (!order) throw badRequest('This delivery is no longer available');
    res.json({ order: presentOrder(order) });
  }),
);

// PATCH /api/rider/orders/:id/status — pickup / on the way / delivered
router.patch(
  '/orders/:id/status',
  asyncHandler(async (req, res) => {
    const { status, pin } = req.body ?? {};
    const allowed: OrderStatus[] = ['picked_up', 'delivering', 'delivered'];
    if (!allowed.includes(status)) throw badRequest('Invalid status for a rider');

    // Delivery must be confirmed with the customer's handover PIN.
    if (status === 'delivered') {
      const current = await Order.findOne({ _id: req.params.id, riderId: req.user!.id }).lean();
      if (!current) throw notFound('Delivery not found');
      const given = String(pin ?? '').trim();
      if (!given) throw badRequest('Ask the customer for their delivery PIN');
      if (given !== String(current.deliveryPin ?? '')) throw badRequest('Incorrect delivery PIN');
    }

    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, riderId: req.user!.id },
      { status },
      { new: true },
    ).lean();
    if (!order) throw notFound('Delivery not found');
    const msg = RIDER_MSG[status];
    if (msg) void notifyUser(order.customerId, msg.title, msg.body, { type: 'status', orderId: String(order._id) });
    res.json({ order: presentOrder(order) });
  }),
);

export default router;
