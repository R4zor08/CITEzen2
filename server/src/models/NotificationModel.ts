import mongoose, { Schema } from 'mongoose';

export type NotificationDoc = {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  type: string;
  concernId?: string | null;
  createdAt: Date;
  updatedAt?: Date;
};

const NotificationSchema = new Schema<NotificationDoc>(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, required: false, default: false, index: true },
    type: { type: String, required: true, index: true },
    concernId: { type: String, required: false, default: null, index: true }
  },
  { timestamps: true }
);

NotificationSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret: any) => {
    ret.id = ret._id?.toString?.() ?? ret.id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export const NotificationModel =
  mongoose.models.Notification ||
  mongoose.model<NotificationDoc>('Notification', NotificationSchema);

