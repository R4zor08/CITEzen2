import mongoose from 'mongoose';
import {
  ChatMessageModel,
  type ChatAttachmentDoc,
  type ChatMessageDoc
} from '../models/ChatMessageModel.js';
import { ChatSessionModel } from '../models/ChatSessionModel.js';

export type StoredAttachment = ChatAttachmentDoc | null | undefined;

export async function listSessions(userId: string) {
  const sessions = await ChatSessionModel.find({ userId })
    .sort({ updatedAt: -1 })
    .lean();
  return sessions.map((s) => ({
    id: String(s._id),
    userId: s.userId,
    title: s.title,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt
  }));
}

export async function createSession(userId: string, title: string) {
  const doc = await ChatSessionModel.create({ userId, title });
  return doc.toJSON() as { id: string; userId: string; title: string };
}

export async function getSession(id: string, userId: string) {
  if (!mongoose.isValidObjectId(id)) return null;
  const doc = await ChatSessionModel.findOne({ _id: id, userId }).lean();
  if (!doc) return null;
  return {
    id: String(doc._id),
    userId: doc.userId,
    title: doc.title,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  };
}

export async function updateSessionTitle(id: string, userId: string, title: string) {
  if (!mongoose.isValidObjectId(id)) return null;
  const doc = await ChatSessionModel.findOneAndUpdate(
    { _id: id, userId },
    { title },
    { new: true }
  ).lean();
  if (!doc) return null;
  return {
    id: String(doc._id),
    userId: doc.userId,
    title: doc.title,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  };
}

export async function deleteSession(id: string, userId: string) {
  if (!mongoose.isValidObjectId(id)) return false;
  const session = await ChatSessionModel.findOneAndDelete({ _id: id, userId });
  if (!session) return false;
  await ChatMessageModel.deleteMany({ sessionId: id });
  return true;
}

export async function listMessages(sessionId: string) {
  const messages = await ChatMessageModel.find({ sessionId })
    .sort({ createdAt: 1 })
    .lean();
  return messages.map((m) => ({
    id: String(m._id),
    sessionId: m.sessionId,
    role: m.role,
    content: m.content,
    attachment: m.attachment ?? undefined,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt
  }));
}

export async function replaceMessages(
  sessionId: string,
  messages: {
    role: 'user' | 'assistant' | 'system';
    content: string;
    attachment?: StoredAttachment;
  }[]
) {
  await ChatMessageModel.deleteMany({ sessionId });
  if (messages.length === 0) return;
  await ChatMessageModel.insertMany(
    messages.map((m) => ({
      sessionId,
      role: m.role,
      content: m.content,
      attachment: m.attachment ?? null
    }))
  );
  await ChatSessionModel.updateOne({ _id: sessionId }, { updatedAt: new Date() });
}

export async function appendMessage(args: {
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachment?: StoredAttachment;
}) {
  await ChatMessageModel.create({
    sessionId: args.sessionId,
    role: args.role,
    content: args.content,
    attachment: args.attachment ?? null
  });
  await ChatSessionModel.updateOne(
    { _id: args.sessionId },
    { updatedAt: new Date() }
  );
}

export function attachmentFromJson(attachment?: {
  name: string;
  mimeType: string;
  size: number;
  dataUrl?: string;
}): StoredAttachment {
  if (!attachment?.name) return null;
  return {
    name: attachment.name,
    mimeType: attachment.mimeType,
    size: attachment.size,
    dataUrl: attachment.dataUrl
  };
}

export type { ChatMessageDoc };
