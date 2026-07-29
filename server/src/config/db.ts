import mongoose from 'mongoose';

import { env } from './env.js';

/**
 * Connects to MongoDB. If MONGODB_URI is set (e.g. a free Atlas cluster) we use
 * it; otherwise we spin up an in-memory MongoDB so the API runs with zero setup.
 * The in-memory data is not persisted — perfect for a proof-of-concept demo.
 */
export async function connectDB(): Promise<string> {
  let uri = env.mongoUri;
  let inMemory = false;

  if (!uri) {
    // Lazy-import so the (dev-only) package isn't required in production.
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    const mem = await MongoMemoryServer.create();
    uri = mem.getUri();
    inMemory = true;
    // Stop the in-memory server cleanly on shutdown.
    const stop = async () => {
      await mongoose.disconnect().catch(() => {});
      await mem.stop().catch(() => {});
      process.exit(0);
    };
    process.on('SIGINT', stop);
    process.on('SIGTERM', stop);
  }

  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, { dbName: 'smartbite', serverSelectionTimeoutMS: 20000 });

  return inMemory ? 'in-memory MongoDB' : 'MongoDB Atlas';
}
