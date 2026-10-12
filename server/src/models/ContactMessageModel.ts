import mongoose, { Schema } from 'mongoose';

export type ContactMessageDoc = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'unread' | 'read' | 'replied';
  createdAt: Date;
  updatedAt?: Date;
};

const ContactMessageSchema = new Schema<ContactMessageDoc>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['unread', 'read', 'replied'],
      default: 'unread',
      index: true
    }
  },
  { timestamps: true }
);

ContactMessageSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret: any) => {
    ret.id = ret._id?.toString?.() ?? ret.id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export const ContactMessageModel =
  mongoose.models.ContactMessage ||
  mongoose.model<ContactMessageDoc>('ContactMessage', ContactMessageSchema);
