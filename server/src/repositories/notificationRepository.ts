import { NotificationModel } from '../models/NotificationModel.js';

export async function createNotification(data: {
  userId: string;
  title: string;
  message: string;
  type: string;
  concernId?: string;
}) {
  return NotificationModel.create({ ...data, concernId: data.concernId ?? null });
}

export async function listNotificationsByUserId(userId: string) {
  return NotificationModel.find({ userId }).sort({ createdAt: -1 }).exec();
}

export async function markNotificationRead(id: string) {
  return NotificationModel.findByIdAndUpdate(id, { $set: { read: true } }, { new: true }).exec();
}

export async function markAllNotificationsRead(userId: string) {
  return NotificationModel.updateMany({ userId, read: false }, { $set: { read: true } }).exec();
}

export async function clearNotifications(userId: string) {
  return NotificationModel.deleteMany({ userId }).exec();
}

