import { Router } from 'express';

import { authenticate, requireRole } from '../middleware/auth.js';
import { MenuItem } from '../models/MenuItem.js';
import { Order } from '../models/Order.js';
import { Review } from '../models/Review.js';
import { User } from '../models/User.js';
import { Vendor } from '../models/Vendor.js';
import { asyncHandler, badRequest, forbidden, notFound } from '../utils/http.js';
import { presentOrder } from '../utils/present.js';
import { notifyUser } from '../utils/push.js';

const router = Router();
router.use(authenticate);

// POST /api/orders — customer places an order (server recomputes prices)
router.post(
  '/',
  requireRole('customer'),
  asyncHandler(async (req, res) => {
    const { vendorId, items, address, note, paymentMethod, paymentRef } = req.body ?? {};
    if (!vendorId || !Array.isArray(items) || items.length === 0 || !address) {
      throw badRequest('vendorId, items and address are required');
    }

    const vendor = await Vendor.findById(vendorId);
    if (!vendor) throw notFound('Vendor not found');
    if (!vendor.isOpen) throw badRequest('This vendor is currently closed');

    // Look up authoritative menu items — never trust client-side prices.
    const ids = items.map((i: { itemId: string }) => i.itemId);
    const menuItems = await MenuItem.find({ _id: { $in: ids }, vendorId });
    const byId = new Map(menuItems.map((m) => [String(m._id), m]));

    const orderItems = items.map((i: { itemId: string; qty: number }) => {
      const m = byId.get(String(i.itemId));
      if (!m) throw badRequest(`Item ${i.itemId} is not on this vendor's menu`);
      if (m.available === false) throw badRequest(`${m.name} is sold out`);
      const qty = Math.max(1, Number(i.qty) || 1);
      return { itemId: String(m._id), name: m.name, emoji: m.emoji, image: m.image ?? '', price: m.price, qty };
    });

    const subtotal = orderItems.reduce((s, it) => s + it.price * it.qty, 0);
    const user = await User.findById(req.user!.id).select('name');

    const order = await Order.create({
      customerId: req.user!.id,
      customerName: user?.name ?? 'Customer',
      vendorId: vendor._id,
      vendorName: vendor.name,
      items: orderItems,
      subtotal,
      deliveryFee: vendor.deliveryFee,
      total: subtotal + vendor.deliveryFee,
      status: 'placed',
      address,
      note: note ?? '',
      paymentMethod: paymentMethod ?? 'card',
      paymentRef: paymentRef ?? '',
    });

    // Ping the vendor's owner that a new order arrived.
    void notifyUser(vendor.ownerId, '🛎️ New order', `${order.customerName} placed an order · ₦${order.total.toLocaleString()}`, {
      type: 'new_order',
      orderId: String(order._id),
    });

    res.status(201).json({ order: presentOrder(order, req.user!.id) });
  }),
);

// GET /api/orders — the customer's own orders
router.get(
  '/',
  requireRole('customer'),
  asyncHandler(async (req, res) => {
    const orders = await Order.find({ customerId: req.user!.id })
      .populate('riderId', 'name phone rider')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ orders: orders.map((o) => presentOrder(o, req.user!.id)) });
  }),
);

// GET /api/orders/:id — must be the customer who placed it (or an involved rider)
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id).populate('riderId', 'name phone rider').lean();
    if (!order) throw notFound('Order not found');
    const uid = req.user!.id;
    // riderId is populated to a doc here, so read its _id for the ownership check.
    const riderId = order.riderId ? String((order.riderId as any)._id ?? order.riderId) : null;
    const involved =
      String(order.customerId) === uid ||
      riderId === uid ||
      req.user!.role === 'admin';
    if (!involved) throw forbidden('Not your order');
    res.json({ order: presentOrder(order, uid) });
  }),
);

// PATCH /api/orders/:id/rate — customer rates a delivered order
router.patch(
  '/:id/rate',
  requireRole('customer'),
  asyncHandler(async (req, res) => {
    const rating = Number(req.body?.rating);
    if (!rating || rating < 1 || rating > 5) throw badRequest('rating must be 1-5');

    const order = await Order.findOne({ _id: req.params.id, customerId: req.user!.id });
    if (!order) throw notFound('Order not found');
    if (order.status !== 'delivered') throw badRequest('You can only rate delivered orders');
    if (order.rated) throw badRequest('Order already rated');

    const user = await User.findById(req.user!.id).select('name');
    await Review.create({
      vendorId: order.vendorId,
      orderId: order._id,
      customerId: req.user!.id,
      customerName: user?.name ?? 'Customer',
      rating,
      text: req.body?.text ?? '',
    });
    order.rated = true;
    await order.save();

    // Blend the new rating into the vendor's running average (keeps seeded
    // review counts realistic instead of collapsing to just real reviews).
    const vendor = await Vendor.findById(order.vendorId);
    if (vendor) {
      const newCount = vendor.reviewCount + 1;
      const newAvg = (vendor.rating * vendor.reviewCount + rating) / newCount;
      vendor.rating = Math.round(newAvg * 10) / 10;
      vendor.reviewCount = newCount;
      await vendor.save();
    }

    res.json({ order: presentOrder(order, req.user!.id) });
  }),
);

export default router;
