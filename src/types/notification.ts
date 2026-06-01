export type NotificationKind = "THREAD_REPLY" | "THREAD_FOLLOW_REPLY" | "POST_MENTION";

export interface NotificationOut {
  id: number;
  kind: NotificationKind;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
  thread_id: number | null;
  post_id: number | null;
  actor_username: string | null;
  summary: string | null;
}

export interface NotificationsPage {
  items: NotificationOut[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_prev: boolean;
  has_next: boolean;
  unread_count: number;
}
