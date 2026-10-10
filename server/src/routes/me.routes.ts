import { Router } from 'express';

import { authenticate } from '../middleware/auth.js';
import { User } from '../models/User.js';
import { asyncHandler, badRequest, notFound } from '../utils/http.js';
import { presentUser } from '../utils/present.js';

const router = Router();
router.use(authenticate);

async function loadUser(id: string) {
  const user = await User.findById(id);
  if (!user) throw notFound('User not found');
  return user;
}

function cardBrand(num: string): 'Visa' | 'Mastercard' | 'Verve' {
  const f = num.trim()[0];
  return f === '4' ? 'Visa' : f === '5' ? 'Mastercard' : 'Verve';
}

// PATCH /api/me — update basic profile
router.patch(
  '/',
  asyncHandler(async (req, res) => {
    const user = await loadUser(req.user!.id);
    const { name, email, phone } = req.body ?? {};
    if (name != null) user.name = name;
    if (email != null) user.email = email;
    if (phone != null) user.phone = phone;
    await user.save();
    res.json({ user: presentUser(user) });
  }),
);

// PATCH /api/me/kyc — rider completes the (mock) identity verification flow.
// Persists the verification to the database so it survives across sessions and
// is visible to customers on their order tracker.
router.patch(
  '/kyc',
  asyncHandler(async (req, res) => {
    const user = await loadUser(req.user!.id);
    if (user.role !== 'rider') throw badRequest('Only riders complete identity verification');

    const { idType, idNumber, vehicle, plate } = req.body ?? {};
    const digits = String(idNumber ?? '').replace(/\D/g, '');
    if (!idType || digits.length < 4) {
      throw badRequest('An ID type and a valid ID number are required');
    }

    user.rider = {
      ...(user.rider ?? {}),
      vehicle: vehicle || user.rider?.vehicle || 'Motorcycle',
      plate: plate || user.rider?.plate || '',
      verified: true,
      idType: String(idType),
      idLast4: digits.slice(-4),
      rating: user.rider?.rating ?? 5,
      trips: user.rider?.trips ?? 0,
    };
    await user.save();
    res.json({ user: presentUser(user) });
  }),
);

// PATCH /api/me/push-token — register the device's Expo push token
router.patch(
  '/push-token',
  asyncHandler(async (req, res) => {
    const token = String(req.body?.token ?? '');
    await User.findByIdAndUpdate(req.user!.id, { expoPushToken: token });
    res.json({ ok: true });
  }),
);

// ---------- Addresses ----------
router.post(
  '/addresses',
  asyncHandler(async (req, res) => {
    const { label, details } = req.body ?? {};
    if (!details) throw badRequest('details are required');
    const user = await loadUser(req.user!.id);
    user.addresses.push({ label: label || 'Address', details, isDefault: user.addresses.length === 0 });
    await user.save();
    res.status(201).json({ user: presentUser(user) });
  }),
);

router.delete(
  '/addresses/:id',
  asyncHandler(async (req, res) => {
    const user = await loadUser(req.user!.id);
    const wasDefault = user.addresses.id(req.params.id)?.isDefault;
    user.addresses.pull({ _id: req.params.id });
    if (wasDefault && user.addresses.length > 0) user.addresses[0].isDefault = true;
    await user.save();
    res.json({ user: presentUser(user) });
  }),
);

router.patch(
  '/addresses/:id/default',
  asyncHandler(async (req, res) => {
    const user = await loadUser(req.user!.id);
    let found = false;
    user.addresses.forEach((a) => {
      a.isDefault = String(a._id) === req.params.id;
      if (a.isDefault) found = true;
    });
    if (!found) throw notFound('Address not found');
    await user.save();
    res.json({ user: presentUser(user) });
  }),
);

// ---------- Payment cards ----------
router.post(
  '/cards',
  asyncHandler(async (req, res) => {
    const { number, expiry } = req.body ?? {};
    const digits = String(number ?? '').replace(/\D/g, '');
    if (digits.length < 12 || !/^\d{2}\/\d{2}$/.test(String(expiry ?? ''))) {
      throw badRequest('A valid card number and expiry (MM/YY) are required');
    }
    const user = await loadUser(req.user!.id);
    user.cards.push({ brand: cardBrand(digits), last4: digits.slice(-4), expiry });
    await user.save();
    res.status(201).json({ user: presentUser(user) });
  }),
);

router.delete(
  '/cards/:id',
  asyncHandler(async (req, res) => {
    const user = await loadUser(req.user!.id);
    user.cards.pull({ _id: req.params.id });
    await user.save();
    res.json({ user: presentUser(user) });
  }),
);

// ---------- Notifications ----------
router.patch(
  '/notifications',
  asyncHandler(async (req, res) => {
    const user = await loadUser(req.user!.id);
    const keys = ['orderUpdates', 'deliveryUpdates', 'promos', 'newVendors'] as const;
    const prefs = user.notifPrefs;
    if (prefs) for (const k of keys) if (typeof req.body?.[k] === 'boolean') prefs[k] = req.body[k];
    await user.save();
    res.json({ user: presentUser(user) });
  }),
);

// ---------- Favourites ----------
router.patch(
  '/favourites/:vendorId',
  asyncHandler(async (req, res) => {
    const user = await loadUser(req.user!.id);
    const id = req.params.vendorId;
    const idx = user.favourites.indexOf(id);
    if (idx >= 0) user.favourites.splice(idx, 1);
    else user.favourites.push(id);
    await user.save();
    res.json({ user: presentUser(user) });
  }),
);

export default router;
