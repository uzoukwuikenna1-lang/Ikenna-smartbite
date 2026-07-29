import jwt from 'jsonwebtoken';

import { env } from '../config/env.js';
import type { Role } from '../models/User.js';

export type JwtPayload = { id: string; role: Role };

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn as jwt.SignOptions['expiresIn'] });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.jwtSecret) as JwtPayload;
}
