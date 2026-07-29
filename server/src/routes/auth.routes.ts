import bcrypt from 'bcryptjs';
import { Router } from 'express';

import { authenticate } from '../middleware/auth.js';
import { User, type Role } from '../models/User.js';
import { Vendor } from '../models/Vendor.js';
import { asyncHandler, badRequest, notFound, unauthorized } from '../utils/http.js';
import { presentUser } from '../utils/present.js';
import { signToken } from '../utils/jwt.js';

const router = Router();
const ROLES: Role[] = ['customer', 'vendor', 'rider', 'admin'];

router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { name, email, password, role, phone } = req.body ?? {};
    if (!name || !email || !password) throw badRequest('name, email and password are required');
    if (String(password).length < 4) throw badRequest('Password must be at least 4 characters');
    const finalRole: Role = ROLES.includes(role) ? role : 'customer';

    const existing = await User.findOne({ email: String(email).toLowerCase() });
    if (existing) throw badRequest('An account with that email already exists');

    const passwordHash = await bcrypt.hash(String(password), 10);
    const user = await User.create({ name, email, passwordHash, role: finalRole, phone: phone ?? '' });

    // A brand-new vendor gets a pending vendor profile to manage.
    if (finalRole === 'vendor') {
      const vendor = await Vendor.create({ name: `${name}'s Kitchen`, ownerId: user._id, verification: 'pending' });
      user.vendorId = vendor._id;
      await user.save();
    }

    const token = signToken({ id: String(user._id), role: finalRole });
    res.status(201).json({ token, user: presentUser(user) });
  }),
);

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body ?? {};
    if (!email || !password) throw badRequest('email and password are required');

    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user) throw unauthorized('Invalid email or password');

    const ok = await bcrypt.compare(String(password), user.passwordHash);
    if (!ok) throw unauthorized('Invalid email or password');

    const token = signToken({ id: String(user._id), role: user.role as Role });
    res.json({ token, user: presentUser(user) });
  }),
);

router.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user!.id);
    if (!user) throw notFound('User not found');
    res.json({ user: presentUser(user) });
  }),
);

// Mock password reset — always succeeds (no email is actually sent in the PoC).
router.post(
  '/forgot-password',
  asyncHandler(async (req, res) => {
    const { email } = req.body ?? {};
    if (!email) throw badRequest('email is required');
    res.json({ ok: true, message: 'If that email exists, a reset link has been sent.' });
  }),
);

export default router;
