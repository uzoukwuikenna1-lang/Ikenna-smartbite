import mongoose, { Schema, type InferSchemaType } from 'mongoose';

export const ORDER_STATUSES = [
  'placed',
  'accepted',
  'preparing',
  'rider_assigned',
  'picked_up',
  'delivering',
  'delivered',
  'rejected',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

const orderItemSchema = new Schema(
  {
    itemId: { type: String, required: true },
    name: { type: String, required: true },
    emoji: { type: String, default: '🍽️' },
    image: { type: String, default: '' },
    price: { type: Number, required: true },
    qty: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const orderSchema = new Schema(
  {
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    customerName: { type: String, required: true },
    vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    vendorName: { type: String, required: true },
    items: { type: [orderItemSchema], required: true },
    subtotal: { type: Number, required: true },
    deliveryFee: { type: Number, required: true },
    total: { type: Number, required: true },
    status: { type: String, enum: ORDER_STATUSES, default: 'placed', index: true },
    address: { type: String, required: true },
    note: { type: String, default: '' },
    paymentMethod: { type: String, enum: ['card', 'transfer', 'cash'], default: 'card' },
    paymentRef: { type: String, default: '' },
    riderId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    riderAccepted: { type: Boolean, default: false },
    rated: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export type OrderDoc = InferSchemaType<typeof orderSchema>;

export const Order = mongoose.model('Order', orderSchema);
