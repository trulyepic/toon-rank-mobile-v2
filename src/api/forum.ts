import { api } from "./client";
import type {
  CreateForumPostRequest,
  CreateForumThreadRequest,
  EditForumPostRequest,
  ForumThreadDetail,
  ForumPost,
  ForumPostPage,
  ForumThread,
  ForumThreadPage,
  ForumThreadPostsPage,
  ForumVote,
  ForumVoteResponse,
  LockForumThreadRequest,
  SeriesRef,
  UpdateForumThreadRequest,
  UpdateForumThreadSettingsRequest,
} from "../types/forum";

export async function getForumThreads(page = 1, pageSize = 20, q?: string) {
  const res = await api.get<ForumThreadPage>("/forum/threads-paged", {
    params: { page, page_size: pageSize, ...(q ? { q } : {}) },
  });
  return res.data;
}

export async function getForumThread(threadId: number) {
  const res = await api.get<ForumThreadDetail>(`/forum/threads/${threadId}`);
  return res.data;
}

export async function getForumThreadPosts(threadId: number, page = 1, pageSize = 20) {
  const res = await api.get<ForumThreadPostsPage>(
    `/forum/threads/${threadId}/posts-paged`,
    { params: { page, page_size: pageSize } },
  );
  return res.data;
}

export async function createForumThread(payload: CreateForumThreadRequest) {
  const res = await api.post<ForumThread>("/forum/threads", payload);
  return res.data;
}

export async function createForumPost(threadId: number, payload: CreateForumPostRequest) {
  const res = await api.post<ForumPost>(`/forum/threads/${threadId}/posts`, payload);
  return res.data;
}

export async function setForumPostVote(
  threadId: number,
  postId: number,
  vote: ForumVote | null,
) {
  const res = await api.post<ForumVoteResponse>(
    `/forum/threads/${threadId}/posts/${postId}/vote`,
    { vote },
  );
  return res.data;
}

export async function editForumPost(
  threadId: number,
  postId: number,
  payload: EditForumPostRequest,
) {
  const res = await api.patch<ForumPost>(
    `/forum/threads/${threadId}/posts/${postId}`,
    payload,
  );
  return res.data;
}

export async function deleteForumPost(threadId: number, postId: number) {
  await api.delete(`/forum/threads/${threadId}/posts/${postId}`);
}

export async function deleteForumPostMine(threadId: number, postId: number) {
  await api.delete(`/forum/threads/${threadId}/posts/${postId}/mine`);
}

export async function updateForumThread(
  threadId: number,
  payload: UpdateForumThreadRequest,
) {
  const res = await api.patch<ForumThread>(`/forum/threads/${threadId}`, payload);
  return res.data;
}

export async function deleteForumThread(threadId: number) {
  await api.delete(`/forum/threads/${threadId}`);
}

export async function lockForumThread(threadId: number, locked: boolean) {
  const res = await api.patch<ForumThread>(`/forum/threads/${threadId}/lock`, {
    locked,
  } satisfies LockForumThreadRequest);
  return res.data;
}

export async function updateForumThreadSettings(
  threadId: number,
  settings: UpdateForumThreadSettingsRequest,
) {
  const res = await api.patch<ForumThread>(
    `/forum/threads/${threadId}/settings`,
    settings,
  );
  return res.data;
}

export async function getMyForumThreads(page = 1, pageSize = 10) {
  const res = await api.get<ForumThreadPage>("/forum/me/threads", {
    params: { page, page_size: pageSize },
  });
  return res.data;
}

export async function getMyForumPosts(page = 1, pageSize = 10) {
  const res = await api.get<ForumPostPage>("/forum/me/posts", {
    params: { page, page_size: pageSize },
  });
  return res.data;
}

export async function getMyForumVotes(page = 1, pageSize = 10) {
  const res = await api.get<ForumPostPage>("/forum/me/votes", {
    params: { page, page_size: pageSize },
  });
  return res.data;
}

export async function searchForumSeries(query: string) {
  const res = await api.get<SeriesRef[]>("/forum/series-search", {
    params: { q: query },
  });
  return res.data;
}
