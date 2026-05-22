import mongoose, { Schema } from 'mongoose';

export type ChatSessionDoc = {
  id: string;
  userId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
};

const ChatSessionSchema = new Schema<ChatSessionDoc>(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true, default: 'GabAI' }
  },
  { timestamps: true }
);

ChatSessionSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret: Record<string, unknown>) => {
    ret.id = String(ret._id);
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export const ChatSessionModel =
  mongoose.models.ChatSession ||
  mongoose.model<ChatSessionDoc>('ChatSession', ChatSessionSchema);
