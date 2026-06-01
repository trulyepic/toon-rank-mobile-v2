import { api } from "./client";
import type { NotificationsPage } from "../types/notification";

export async function getNotifications(page = 1, pageSize = 20) {
  const res = await api.get<NotificationsPage>("/notifications", {
    params: { page, page_size: pageSize },
  });
  return res.data;
}

export async function getUnreadCount() {
  const res = await api.get<{ count: number }>("/notifications/unread-count");
  return res.data;
}

export async function markNotificationRead(id: number) {
  await api.patch(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead() {
  await api.post("/notifications/read-all");
}
