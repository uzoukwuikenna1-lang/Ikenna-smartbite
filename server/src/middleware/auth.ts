import type { NextFunction, Request, Response } from 'express';

import { User, type Role } from '../models/User.js';
import { asyncHandler, forbidden, unauthorized } from '../utils/http.js';
import { verifyToken } from '../utils/jwt.js';

/** Requires a valid JWT. Loads the user and rejects suspended accounts. */
export const authenticate = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) throw unauthorized('Missing token');

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    throw unauthorized('Invalid or expired token');
  }

  const user = await User.findById(payload.id).select('_id role status');
  if (!user) throw unauthorized('Account no longer exists');
  if (user.status === 'suspended') throw forbidden('Account suspended');

  req.user = { id: String(user._id), role: user.role as Role };
  next();
});

/** Restricts a route to one or more roles. Use after authenticate. */
export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(unauthorized());
    if (!roles.includes(req.user.role)) return next(forbidden('Insufficient role'));
    next();
  };
}
