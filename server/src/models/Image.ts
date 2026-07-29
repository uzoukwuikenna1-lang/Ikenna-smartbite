import mongoose, { Schema, type InferSchemaType } from 'mongoose';

/**
 * Uploaded images stored directly in MongoDB (base64 → Buffer). Keeps the PoC
 * free and self-contained — no Cloudinary/S3 account needed. Served via
 * GET /api/images/:id. For production you'd swap this for a CDN/object store.
 */
const imageSchema = new Schema(
  {
    data: { type: Buffer, required: true },
    contentType: { type: String, default: 'image/jpeg' },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true },
);

export type ImageDoc = InferSchemaType<typeof imageSchema>;

export const Image = mongoose.model('Image', imageSchema);
