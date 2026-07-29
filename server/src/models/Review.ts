import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const reviewSchema = new Schema(
  {
    vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    customerName: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    text: { type: String, default: '' },
  },
  { timestamps: true },
);

export type ReviewDoc = InferSchemaType<typeof reviewSchema>;

export const Review = mongoose.model('Review', reviewSchema);
