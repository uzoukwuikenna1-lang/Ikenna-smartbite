import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const vendorSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    tagline: { type: String, default: '' },
    emoji: { type: String, default: '🍽️' },
    image: { type: String, default: '' }, // uploaded storefront photo (falls back to emoji)
    color: { type: String, default: '#E4EAE1' },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    deliveryMins: { type: Number, default: 20 },
    deliveryFee: { type: Number, default: 300 },
    minOrder: { type: Number, default: 0 },
    categories: { type: [String], default: [] },
    isOpen: { type: Boolean, default: true },
    // Admin verification workflow
    verification: { type: String, enum: ['verified', 'pending', 'suspended'], default: 'pending' },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true },
);

export type VendorDoc = InferSchemaType<typeof vendorSchema>;

export const Vendor = mongoose.model('Vendor', vendorSchema);
