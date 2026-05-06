import * as notifications from '../repositories/notificationRepository.js';

export async function listNotifications(userId: string) {
  return notifications.listNotificationsByUserId(userId);
}

export async function markRead(id: string) {
  return notifications.markNotificationRead(id);
}

export async function markAllRead(userId: string) {
  await notifications.markAllNotificationsRead(userId);
  return { ok: true as const };
}

export async function clear(userId: string) {
  const r = await notifications.clearNotifications(userId);
  return { ok: true as const, count: r.count };
}

