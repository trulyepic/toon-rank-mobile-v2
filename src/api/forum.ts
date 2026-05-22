import { api } from "./client";
import type {
  CreateForumPostRequest,
  CreateForumThreadRequest,
  ForumThreadDetail,
  ForumPost,
  ForumThread,
  ForumThreadPage,
  ForumThreadPostsPage,
  ForumVote,
  ForumVoteResponse,
  SeriesRef,
} from "../types/forum";

export async function getForumThreads(page = 1, pageSize = 20) {
  const res = await api.get<ForumThreadPage>("/forum/threads-paged", {
    params: { page, page_size: pageSize },
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

export async function searchForumSeries(query: string) {
  const res = await api.get<SeriesRef[]>("/forum/series-search", {
    params: { q: query },
  });
  return res.data;
}
