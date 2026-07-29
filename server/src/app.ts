import cors from 'cors';
import express from 'express';

import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import adminRoutes from './routes/admin.routes.js';
import authRoutes from './routes/auth.routes.js';
import meRoutes from './routes/me.routes.js';
import orderRoutes from './routes/order.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import riderRoutes from './routes/rider.routes.js';
import searchRoutes from './routes/search.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import vendorManageRoutes from './routes/vendor.manage.js';
import vendorPublicRoutes from './routes/vendors.public.js';

export function createApp() {
  const app = express();

  app.use(cors({ origin: env.corsOrigin === '*' ? true : env.corsOrigin.split(',') }));
  app.use(express.json({ limit: '10mb' })); // large enough for base64 food photos

  app.get('/', (_req, res) => res.json({ name: 'SmartBite FUTO API', status: 'ok' }));
  app.get('/api/health', (_req, res) => res.json({ ok: true, time: new Date().toISOString() }));

  app.use('/api/auth', authRoutes);
  app.use('/api/me', meRoutes);
  app.use('/api/vendors', vendorPublicRoutes);
  app.use('/api/vendor', vendorManageRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/rider', riderRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/search', searchRoutes);
  app.use('/api', uploadRoutes); // /api/uploads (POST) and /api/images/:id (GET)

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
