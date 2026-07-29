import type { NextFunction, Request, Response } from 'express';

import { ApiError } from '../utils/http.js';

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: 'Route not found' });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: err.message });
  }
  // Mongoose duplicate key (e.g. email already registered)
  if (typeof err === 'object' && err !== null && (err as { code?: number }).code === 11000) {
    return res.status(409).json({ error: 'That value is already taken' });
  }
  // Mongoose validation error
  if (typeof err === 'object' && err !== null && (err as { name?: string }).name === 'ValidationError') {
    return res.status(400).json({ error: (err as Error).message });
  }
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
}
