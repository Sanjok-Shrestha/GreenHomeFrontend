import api from "../../api"; // your axios instance

export type NotificationItem = {
  _id: string;
  type: string;
  title: string;
  body?: string;
  data?: any;
  read?: boolean;
  createdAt?: string;
};

export async function listNotifications(page = 1, pageSize = 25, unreadOnly = false) {
  const res = await api.get(`/api/notifications?page=${page}&pageSize=${pageSize}${unreadOnly ? "&unreadOnly=1" : ""}`);
  return res.data; // { total, page, pageSize, data }
}

export async function markRead(id: string) {
  const res = await api.post(`/api/notifications/${id}/read`);
  return res.data;
}

export async function markAllRead() {
  const res = await api.post(`/api/notifications/read-all`);
  return res.data;
}