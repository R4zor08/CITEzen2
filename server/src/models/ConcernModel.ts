import mongoose, { Schema } from 'mongoose';
import type { Priority } from '../types.js';

export type ConcernDoc = {
  id: string;
  title: string;
  description: string;
  category: string;
  subcategory: string;
  status: string;
  priority: Priority | string;
  studentId: string;
  studentName: string;
  assignedToId?: string | null;
  department: string;
  attachments?: string | null;
  formData?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

const ConcernSchema = new Schema<ConcernDoc>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    subcategory: { type: String, required: true },
    status: { type: String, required: false, default: 'pending', index: true },
    priority: { type: String, required: false, default: 'medium', index: true },
    studentId: { type: String, required: true, index: true },
    studentName: { type: String, required: true },
    assignedToId: { type: String, required: false, default: null, index: true },
    department: { type: String, required: true, index: true },
    attachments: { type: String, required: false, default: null },
    formData: { type: String, required: false, default: null }
  },
  { timestamps: true }
);

ConcernSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret: any) => {
    ret.id = ret._id?.toString?.() ?? ret.id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export const ConcernModel =
  mongoose.models.Concern || mongoose.model<ConcernDoc>('Concern', ConcernSchema);

