import mongoose, { Schema, type InferSchemaType } from 'mongoose';

export type Role = 'customer' | 'vendor' | 'rider' | 'admin';

const addressSchema = new Schema(
  {
    label: { type: String, required: true },
    details: { type: String, required: true },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true },
);

const cardSchema = new Schema(
  {
    brand: { type: String, enum: ['Visa', 'Mastercard', 'Verve'], required: true },
    last4: { type: String, required: true },
    expiry: { type: String, required: true },
  },
  { _id: true },
);

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['customer', 'vendor', 'rider', 'admin'], default: 'customer' },
    phone: { type: String, default: '' },
    status: { type: String, enum: ['active', 'suspended'], default: 'active' },

    // Customer profile bits (embedded to mirror the mobile app)
    addresses: { type: [addressSchema], default: [] },
    cards: { type: [cardSchema], default: [] },
    favourites: { type: [String], default: [] }, // vendor ids
    notifPrefs: {
      orderUpdates: { type: Boolean, default: true },
      deliveryUpdates: { type: Boolean, default: true },
      promos: { type: Boolean, default: false },
      newVendors: { type: Boolean, default: true },
    },

    // Vendor role: link to the Vendor document they manage
    vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', default: null },

    // Rider role: vehicle info + a mock KYC record so customers can see the
    // delivery person is a verified, identifiable human (demo data only).
    rider: {
      vehicle: { type: String, default: 'Honda' },
      plate: { type: String, default: '' },
      verified: { type: Boolean, default: false },
      idType: { type: String, default: '' }, // e.g. "Student ID", "NIN"
      idLast4: { type: String, default: '' }, // masked — only the last 4 digits
      rating: { type: Number, default: 5 },
      trips: { type: Number, default: 0 },
    },

    // Expo push token (set from the app) for order notifications
    expoPushToken: { type: String, default: '' },
  },
  { timestamps: true },
);

export type UserDoc = InferSchemaType<typeof userSchema>;

export const User = mongoose.model('User', userSchema);
