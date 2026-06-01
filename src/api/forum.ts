import { api } from "./client";
import type {
  CreateForumCategoryRequest,
  CreateForumPostRequest,
  CreateForumThreadRequest,
  ForumReportPage,
  EditForumPostRequest,
  ForumCategory,
  ForumThreadDetail,
  ForumPost,
  ForumPostPage,
  ForumThread,
  ForumThreadPage,
  ForumThreadPostsPage,
  ForumMediaUploadResponse,
  ForumVote,
  ForumVoteResponse,
  LockForumThreadRequest,
  PinForumThreadRequest,
  SeriesRef,
  UpdateForumCategoryRequest,
  UpdateForumThreadRequest,
  UpdateForumThreadSettingsRequest,
} from "../types/forum";

export type ForumMediaFile = {
  uri: string;
  name: string;
  type: string;
};

export type ForumThreadSort = "activity" | "newest" | "replies";

export async function getForumThreads(
  page = 1,
  pageSize = 20,
  q?: string,
  sort?: ForumThreadSort,
  category_slug?: string,
) {
  const res = await api.get<ForumThreadPage>("/forum/threads-paged", {
    params: {
      page,
      page_size: pageSize,
      ...(q ? { q } : {}),
      ...(sort ? { sort } : {}),
      ...(category_slug ? { category_slug } : {}),
    },
  });
  return res.data;
}

export async function getForumCategories() {
  const res = await api.get<ForumCategory[]>("/forum/categories");
  return res.data;
}

export async function pinForumThread(threadId: number, pinned: boolean) {
  const res = await api.patch<Pick<ForumThread, "id" | "is_pinned">>(
    `/forum/threads/${threadId}/pin`,
    { pinned } satisfies PinForumThreadRequest,
  );
  return res.data;
}

export async function createForumCategory(payload: CreateForumCategoryRequest) {
  const res = await api.post<ForumCategory>("/forum/categories", payload);
  return res.data;
}

export async function updateForumCategory(
  id: number,
  payload: UpdateForumCategoryRequest,
) {
  const res = await api.patch<ForumCategory>(`/forum/categories/${id}`, payload);
  return res.data;
}

export async function deleteForumCategory(id: number) {
  const res = await api.delete<{ message: string }>(`/forum/categories/${id}`);
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

export async function uploadForumMedia(
  threadId: number,
  file: ForumMediaFile,
  postId?: number,
) {
  const form = new FormData();
  form.append("thread_id", String(threadId));

  if (typeof postId === "number") {
    form.append("post_id", String(postId));
  }

  form.append("file", file as unknown as Blob);

  const res = await api.post<ForumMediaUploadResponse>("/forum/media/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
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

export async function toggleThreadFollow(threadId: number) {
  const res = await api.post<{ following: boolean; follower_count: number }>(
    `/forum/threads/${threadId}/follow`,
  );
  return res.data;
}

export async function getMyFollowedThreads(page = 1, pageSize = 10) {
  const res = await api.get<ForumThreadPage>("/forum/me/following", {
    params: { page, page_size: pageSize },
  });
  return res.data;
}

export async function togglePostBookmark(threadId: number, postId: number) {
  const res = await api.post<{ bookmarked: boolean }>(
    `/forum/threads/${threadId}/posts/${postId}/bookmark`,
  );
  return res.data;
}

export async function getMyBookmarkedPosts(page = 1, pageSize = 10) {
  const res = await api.get<ForumPostPage>("/forum/me/bookmarks", {
    params: { page, page_size: pageSize },
  });
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

export async function reportPost(threadId: number, postId: number, reason?: string) {
  await api.post(`/forum/threads/${threadId}/posts/${postId}/report`, {
    reason: reason ?? null,
  });
}

export async function getForumReports(
  page = 1,
  status?: "OPEN" | "REVIEWED" | "DISMISSED",
) {
  const res = await api.get<ForumReportPage>("/forum/reports", {
    params: { page, page_size: 20, ...(status ? { status } : {}) },
  });
  return res.data;
}

export async function reviewForumReport(id: number, status: "REVIEWED" | "DISMISSED") {
  await api.patch(`/forum/reports/${id}`, { status });
}

export async function deleteForumReport(id: number) {
  await api.delete(`/forum/reports/${id}`);
}
