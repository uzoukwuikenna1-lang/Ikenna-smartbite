import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

import { connectDB } from './config/db.js';
import { MenuItem } from './models/MenuItem.js';
import { Order } from './models/Order.js';
import { Review } from './models/Review.js';
import { User } from './models/User.js';
import { Vendor } from './models/Vendor.js';

type VendorSeed = {
  key: string;
  name: string;
  tagline: string;
  emoji: string;
  color: string;
  rating: number;
  reviewCount: number;
  deliveryMins: number;
  deliveryFee: number;
  minOrder: number;
  categories: string[];
  isOpen: boolean;
  verification: 'verified' | 'pending' | 'suspended';
};

const VENDORS: VendorSeed[] = [
  { key: 'v1', name: 'Mama Nkechi Kitchen', tagline: 'Home-style rice, stews & swallow', emoji: '🍛', color: '#FDE68A', rating: 4.8, reviewCount: 214, deliveryMins: 20, deliveryFee: 300, minOrder: 800, categories: ['Rice', 'Soup', 'Local'], isOpen: true, verification: 'verified' },
  { key: 'v2', name: 'FUTO Bites', tagline: 'Burgers, shawarma & fries', emoji: '🍔', color: '#FCA5A5', rating: 4.6, reviewCount: 189, deliveryMins: 15, deliveryFee: 250, minOrder: 1000, categories: ['Fast food', 'Shawarma'], isOpen: true, verification: 'verified' },
  { key: 'v3', name: 'Suya Republic', tagline: 'Fresh grilled suya & peppered meat', emoji: '🍢', color: '#F9A8D4', rating: 4.9, reviewCount: 302, deliveryMins: 25, deliveryFee: 350, minOrder: 500, categories: ['Grill', 'Suya'], isOpen: true, verification: 'verified' },
  { key: 'v4', name: 'Chop Life Cafe', tagline: 'Snacks, small chops & drinks', emoji: '🧋', color: '#A7F3D0', rating: 4.4, reviewCount: 97, deliveryMins: 12, deliveryFee: 200, minOrder: 600, categories: ['Snacks', 'Drinks'], isOpen: true, verification: 'pending' },
  { key: 'v5', name: 'Green Bowl', tagline: 'Healthy bowls, salads & smoothies', emoji: '🥗', color: '#BBF7D0', rating: 4.5, reviewCount: 63, deliveryMins: 18, deliveryFee: 300, minOrder: 1200, categories: ['Healthy', 'Salad'], isOpen: false, verification: 'pending' },
  { key: 'v6', name: 'Amala Republic', tagline: 'Amala, ewedu & assorted meat', emoji: '🍲', color: '#FDBA74', rating: 4.7, reviewCount: 148, deliveryMins: 22, deliveryFee: 300, minOrder: 900, categories: ['Swallow', 'Soup', 'Local'], isOpen: true, verification: 'verified' },
];

type MenuSeed = { vendorKey: string; name: string; description: string; price: number; emoji: string; category: string; popular?: boolean };

const MENU: MenuSeed[] = [
  { vendorKey: 'v1', name: 'Jollof Rice & Chicken', description: 'Smoky party jollof with grilled chicken', price: 1800, emoji: '🍗', category: 'Rice', popular: true },
  { vendorKey: 'v1', name: 'Fried Rice & Beef', description: 'Vegetable fried rice with peppered beef', price: 1700, emoji: '🍚', category: 'Rice' },
  { vendorKey: 'v1', name: 'Egusi & Pounded Yam', description: 'Rich egusi soup with assorted meat', price: 2200, emoji: '🍲', category: 'Soup', popular: true },
  { vendorKey: 'v1', name: 'White Rice & Stew', description: 'Plain rice with tomato stew and fish', price: 1500, emoji: '🍛', category: 'Rice' },
  { vendorKey: 'v1', name: 'Moi Moi', description: 'Steamed bean pudding (add-on)', price: 500, emoji: '🫓', category: 'Sides' },
  { vendorKey: 'v2', name: 'Beef Shawarma', description: 'Double sausage, beef & garlic sauce', price: 2000, emoji: '🌯', category: 'Shawarma', popular: true },
  { vendorKey: 'v2', name: 'Classic Beef Burger', description: 'Beef patty, cheese, lettuce & fries', price: 2500, emoji: '🍔', category: 'Burgers', popular: true },
  { vendorKey: 'v2', name: 'Crispy Fries', description: 'Golden fries with ketchup', price: 800, emoji: '🍟', category: 'Sides' },
  { vendorKey: 'v2', name: 'Chicken & Chips', description: 'Fried chicken with chips', price: 2200, emoji: '🍗', category: 'Chicken' },
  { vendorKey: 'v3', name: 'Beef Suya (Medium)', description: 'Spicy grilled beef with yaji & onions', price: 1500, emoji: '🍢', category: 'Suya', popular: true },
  { vendorKey: 'v3', name: 'Chicken Suya', description: 'Grilled chicken suya sticks', price: 1800, emoji: '🍗', category: 'Suya' },
  { vendorKey: 'v3', name: 'Peppered Gizzard', description: 'Spicy stir-fried gizzard', price: 1600, emoji: '🌶️', category: 'Grill' },
  { vendorKey: 'v3', name: 'Ram Suya (Large)', description: 'Premium ram suya platter', price: 3000, emoji: '🍖', category: 'Suya', popular: true },
  { vendorKey: 'v4', name: 'Small Chops Pack', description: 'Puff-puff, spring rolls & samosa', price: 1500, emoji: '🍡', category: 'Snacks', popular: true },
  { vendorKey: 'v4', name: 'Meat Pie', description: 'Flaky pastry with minced beef', price: 700, emoji: '🥟', category: 'Snacks' },
  { vendorKey: 'v4', name: 'Bubble Tea', description: 'Milk tea with tapioca pearls', price: 1800, emoji: '🧋', category: 'Drinks', popular: true },
  { vendorKey: 'v4', name: 'Zobo Drink', description: 'Chilled hibiscus drink', price: 600, emoji: '🥤', category: 'Drinks' },
  { vendorKey: 'v5', name: 'Grilled Chicken Salad', description: 'Greens, chicken, avocado & vinaigrette', price: 2500, emoji: '🥗', category: 'Salad', popular: true },
  { vendorKey: 'v5', name: 'Mango Smoothie', description: 'Fresh mango & yoghurt blend', price: 1500, emoji: '🥭', category: 'Smoothies' },
  { vendorKey: 'v5', name: 'Veggie Power Bowl', description: 'Quinoa, beans, veg & sauce', price: 2300, emoji: '🥙', category: 'Bowls' },
  { vendorKey: 'v6', name: 'Amala & Ewedu', description: 'Soft amala with ewedu and gbegiri', price: 1600, emoji: '🍲', category: 'Swallow', popular: true },
  { vendorKey: 'v6', name: 'Assorted Meat (5pcs)', description: 'Shaki, ponmo & beef add-on', price: 1200, emoji: '🍖', category: 'Sides' },
  { vendorKey: 'v6', name: 'Ofada Rice & Ayamase', description: 'Local rice with green pepper sauce', price: 2000, emoji: '🍛', category: 'Rice' },
];

type UserSeed = { name: string; email: string; role: 'customer' | 'rider' | 'vendor' | 'admin'; status?: 'active' | 'suspended'; vendorKey?: string };

const USERS: UserSeed[] = [
  { name: 'Chidera Okeke', email: 'chidera@futo.edu.ng', role: 'customer' },
  { name: 'Blessing Obi', email: 'blessing@futo.edu.ng', role: 'customer' },
  { name: 'Tunde Adeyemi', email: 'tunde@futo.edu.ng', role: 'customer' },
  { name: 'Ada Nwosu', email: 'ada@futo.edu.ng', role: 'customer', status: 'suspended' },
  { name: 'Grace Effiong', email: 'grace@futo.edu.ng', role: 'customer' },
  { name: 'Emeka Eze', email: 'emeka@futo.edu.ng', role: 'rider' },
  { name: 'Ibrahim Kabir', email: 'ibrahim@futo.edu.ng', role: 'rider' },
  { name: 'Mama Nkechi', email: 'mama@futo.edu.ng', role: 'vendor', vendorKey: 'v1' },
  { name: 'Platform Admin', email: 'admin@futo.edu.ng', role: 'admin' },
];

type OrderSeed = {
  vendorKey: string;
  customerEmail: string;
  items: { name: string; qty: number }[];
  status: string;
  address: string;
  minutesAgo: number;
  rated?: boolean;
};

const ORDERS: OrderSeed[] = [
  { vendorKey: 'v3', customerEmail: 'chidera@futo.edu.ng', items: [{ name: 'Beef Suya (Medium)', qty: 2 }, { name: 'Peppered Gizzard', qty: 1 }], status: 'delivered', address: 'Hostel B, Room 214, FUTO', minutesAgo: 5760, rated: true },
  { vendorKey: 'v1', customerEmail: 'chidera@futo.edu.ng', items: [{ name: 'Jollof Rice & Chicken', qty: 1 }], status: 'delivered', address: 'SEET Building, FUTO', minutesAgo: 10000 },
  { vendorKey: 'v1', customerEmail: 'blessing@futo.edu.ng', items: [{ name: 'Egusi & Pounded Yam', qty: 1 }, { name: 'Moi Moi', qty: 2 }], status: 'placed', address: 'Hostel A, Room 5, FUTO', minutesAgo: 4 },
  { vendorKey: 'v1', customerEmail: 'tunde@futo.edu.ng', items: [{ name: 'Fried Rice & Beef', qty: 2 }], status: 'placed', address: 'MEE Building, FUTO', minutesAgo: 9 },
  { vendorKey: 'v1', customerEmail: 'ada@futo.edu.ng', items: [{ name: 'White Rice & Stew', qty: 1 }], status: 'preparing', address: 'Hostel D, Room 32, FUTO', minutesAgo: 20 },
  { vendorKey: 'v1', customerEmail: 'grace@futo.edu.ng', items: [{ name: 'Jollof Rice & Chicken', qty: 2 }], status: 'rider_assigned', address: 'SICT Building, FUTO', minutesAgo: 25 },
  { vendorKey: 'v2', customerEmail: 'grace@futo.edu.ng', items: [{ name: 'Classic Beef Burger', qty: 1 }], status: 'rider_assigned', address: 'Hostel C, Room 18, FUTO', minutesAgo: 12 },
];

export async function seedDatabase() {
  await Promise.all([
    User.deleteMany({}),
    Vendor.deleteMany({}),
    MenuItem.deleteMany({}),
    Order.deleteMany({}),
    Review.deleteMany({}),
  ]);

  // Vendors
  const vendorId = new Map<string, mongoose.Types.ObjectId>();
  for (const v of VENDORS) {
    const doc = await Vendor.create({ ...v });
    vendorId.set(v.key, doc._id);
  }

  // Menu (map name -> item for order building, scoped by vendor)
  const menuByKeyName = new Map<string, { id: string; name: string; emoji: string; price: number }>();
  for (const m of MENU) {
    const doc = await MenuItem.create({ ...m, vendorId: vendorId.get(m.vendorKey) });
    menuByKeyName.set(`${m.vendorKey}::${m.name}`, { id: String(doc._id), name: doc.name, emoji: doc.emoji, price: doc.price });
  }

  // Users (password is "demo123" for every seeded account)
  const passwordHash = await bcrypt.hash('demo123', 10);
  const userByEmail = new Map<string, mongoose.Types.ObjectId>();
  for (const u of USERS) {
    const doc = await User.create({
      name: u.name,
      email: u.email,
      passwordHash,
      role: u.role,
      status: u.status ?? 'active',
      vendorId: u.vendorKey ? vendorId.get(u.vendorKey) : null,
      addresses:
        u.email === 'chidera@futo.edu.ng'
          ? [
              { label: 'Hostel', details: 'Hostel B, Room 214, FUTO', isDefault: true },
              { label: 'Faculty', details: 'SEET Building, FUTO', isDefault: false },
            ]
          : [],
      favourites: u.email === 'chidera@futo.edu.ng' ? [String(vendorId.get('v3'))] : [],
    });
    userByEmail.set(u.email, doc._id);
  }

  // Orders
  for (const o of ORDERS) {
    const vKey = o.vendorKey;
    const vendor = VENDORS.find((v) => v.key === vKey)!;
    const items = o.items.map((line) => {
      const m = menuByKeyName.get(`${vKey}::${line.name}`)!;
      return { itemId: m.id, name: m.name, emoji: m.emoji, price: m.price, qty: line.qty };
    });
    const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0);
    const createdAt = new Date(Date.now() - o.minutesAgo * 60 * 1000);
    const cust = USERS.find((u) => u.email === o.customerEmail)!;
    await Order.create({
      customerId: userByEmail.get(o.customerEmail),
      customerName: cust.name,
      vendorId: vendorId.get(vKey),
      vendorName: vendor.name,
      items,
      subtotal,
      deliveryFee: vendor.deliveryFee,
      total: subtotal + vendor.deliveryFee,
      status: o.status,
      address: o.address,
      rated: o.rated ?? false,
      createdAt,
    });
  }

  const counts = {
    vendors: await Vendor.countDocuments(),
    menu: await MenuItem.countDocuments(),
    users: await User.countDocuments(),
    orders: await Order.countDocuments(),
  };
  return counts;
}

// Allow running directly: `npm run seed`
const isDirectRun = process.argv[1] && process.argv[1].endsWith('seed.ts');
if (isDirectRun) {
  (async () => {
    const label = await connectDB();
    const counts = await seedDatabase();
    console.log(`✅ Seeded ${label}:`, counts);
    await mongoose.disconnect();
    process.exit(0);
  })().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
}
