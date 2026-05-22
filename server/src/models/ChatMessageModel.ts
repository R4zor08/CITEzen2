import mongoose, { Schema } from 'mongoose';

export type ChatAttachmentDoc = {
  name: string;
  mimeType: string;
  size: number;
  dataUrl?: string;
};

export type ChatMessageDoc = {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachment?: ChatAttachmentDoc | null;
  createdAt: Date;
  updatedAt: Date;
};

const ChatAttachmentSchema = new Schema<ChatAttachmentDoc>(
  {
    name: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    dataUrl: { type: String, required: false }
  },
  { _id: false }
);

const ChatMessageSchema = new Schema<ChatMessageDoc>(
  {
    sessionId: { type: String, required: true, index: true },
    role: { type: String, required: true, enum: ['user', 'assistant', 'system'] },
    content: { type: String, required: true, default: '' },
    attachment: { type: ChatAttachmentSchema, required: false, default: null }
  },
  { timestamps: true }
);

ChatMessageSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret: Record<string, unknown>) => {
    ret.id = String(ret._id);
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export const ChatMessageModel =
  mongoose.models.ChatMessage ||
  mongoose.model<ChatMessageDoc>('ChatMessage', ChatMessageSchema);
