import { prisma } from '../lib/prisma.js';

export async function createNotification(data: {
  userId: string;
  title: string;
  message: string;
  type: string;
  concernId?: string;
}) {
  return prisma.notification.create({ data: { ...data, concernId: data.concernId ?? null } });
}

export async function listNotificationsByUserId(userId: string) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  });
}

export async function markNotificationRead(id: string) {
  return prisma.notification.update({ where: { id }, data: { read: true } });
}

export async function markAllNotificationsRead(userId: string) {
  return prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
}

export async function clearNotifications(userId: string) {
  return prisma.notification.deleteMany({ where: { userId } });
}

