import type { SeriesType } from "./series";

export interface SeriesRef {
  series_id: number;
  title?: string | null;
  cover_url?: string | null;
  type?: SeriesType | string | null;
  status?: string | null;
}

export interface ForumThread {
  id: number;
  title: string;
  author_username?: string | null;
  author_role?: string | null;
  author_avatar_url?: string | null;
  author_avatar_preset?: string | null;
  created_at: string;
  updated_at: string;
  post_count: number;
  last_post_at: string;
  series_refs: SeriesRef[];
  locked: boolean;
  latest_first: boolean;
  is_pinned?: boolean;
  category_id?: number | null;
  category_name?: string | null;
  view_count?: number;
}

export interface ForumCategory {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  position: number;
  thread_count: number;
}

export interface PinForumThreadRequest {
  pinned: boolean;
}

export interface CreateForumCategoryRequest {
  name: string;
  slug?: string;
  description?: string | null;
  position?: number;
}

export interface UpdateForumCategoryRequest {
  name?: string;
  slug?: string;
  description?: string | null;
  position?: number;
  visible?: boolean;
}

export interface ForumPost {
  id: number;
  thread_id?: number;
  author_username?: string | null;
  author_role?: string | null;
  author_avatar_url?: string | null;
  author_avatar_preset?: string | null;
  content_markdown: string;
  created_at: string;
  updated_at: string;
  series_refs: SeriesRef[];
  parent_id?: number | null;
  upvote_count?: number;
  downvote_count?: number;
  viewer_vote?: ForumVote | null;
  heart_count?: number;
  viewer_has_hearted?: boolean;
}

export interface ForumPostPage {
  items: ForumPost[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  has_prev: boolean;
  has_next: boolean;
}

export interface ForumThreadPage {
  items: ForumThread[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  has_prev: boolean;
  has_next: boolean;
}

export interface ForumThreadPostsPage {
  thread: ForumThread;
  posts: ForumPost[];
  page: number;
  page_size: number;
  total_top_level: number;
  total_pages: number;
  has_prev: boolean;
  has_next: boolean;
}

export interface ForumThreadDetail {
  thread: ForumThread;
  posts: ForumPost[];
}

export interface CreateForumThreadRequest {
  title: string;
  first_post_markdown: string;
  series_ids?: number[];
  category_id?: number | null;
}

export interface CreateForumPostRequest {
  content_markdown: string;
  series_ids?: number[];
  parent_id?: number | null;
}

export type ForumVote = "UPVOTE" | "DOWNVOTE";

export interface ForumVoteResponse {
  vote: ForumVote | null;
  upvote_count: number;
  downvote_count: number;
}

export interface ForumMediaUploadResponse {
  id: number;
  url: string;
  mime: string;
  width?: number | null;
  height?: number | null;
  size: number;
  thread_id: number;
  post_id?: number | null;
}

export interface EditForumPostRequest {
  content_markdown: string;
  series_ids?: number[];
}

export interface UpdateForumThreadRequest {
  title: string;
  first_post_markdown: string;
  series_ids?: number[];
  category_id?: number | null;
}

export interface LockForumThreadRequest {
  locked: boolean;
}

export interface UpdateForumThreadSettingsRequest {
  latest_first: boolean;
}
