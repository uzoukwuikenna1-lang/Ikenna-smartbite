import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const menuItemSchema = new Schema(
  {
    vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    emoji: { type: String, default: '🍽️' },
    image: { type: String, default: '' }, // uploaded photo URL (falls back to emoji)
    category: { type: String, default: 'Other' },
    popular: { type: Boolean, default: false },
    available: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export type MenuItemDoc = InferSchemaType<typeof menuItemSchema>;

export const MenuItem = mongoose.model('MenuItem', menuItemSchema);
