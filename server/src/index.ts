import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import { seedDatabase } from './seed.js';

async function main() {
  const dbLabel = await connectDB();

  // The in-memory DB is empty and per-process, so populate it on boot.
  // With a real Atlas URI we only seed when explicitly asked (avoid wiping data).
  if (!env.mongoUri || process.env.SEED_ON_START === 'true') {
    const counts = await seedDatabase();
    console.log('🌱 Seeded demo data:', counts);
  }

  const app = createApp();
  app.listen(env.port, () => {
    console.log(`🍔 SmartBite API listening on http://localhost:${env.port}  (${dbLabel})`);
    console.log('   Demo accounts (password: demo123):');
    console.log('   customer chidera@futo.edu.ng · vendor mama@futo.edu.ng · rider emeka@futo.edu.ng · admin admin@futo.edu.ng');
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
