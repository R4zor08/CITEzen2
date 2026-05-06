import mongoose, { Schema } from 'mongoose';
import type { Role } from '../types.js';

export type CommentDoc = {
  id: string;
  concernId: string;
  authorId: string;
  authorName: string;
  authorRole: Role | string;
  visibleTo: string;
  content: string;
  createdAt: Date;
};

const CommentSchema = new Schema<CommentDoc>(
  {
    concernId: { type: String, required: true, index: true },
    authorId: { type: String, required: true, index: true },
    authorName: { type: String, required: true },
    authorRole: { type: String, required: true, index: true },
    visibleTo: { type: String, required: true },
    content: { type: String, required: true }
  },
  { timestamps: true }
);

CommentSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret: any) => {
    ret.id = ret._id?.toString?.() ?? ret.id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export const CommentModel =
  mongoose.models.Comment || mongoose.model<CommentDoc>('Comment', CommentSchema);

