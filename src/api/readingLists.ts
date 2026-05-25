import { api } from "./client";
import type {
  AddReadingListItemRequest,
  CreateReadingListRequest,
  PaginatedReadingListItems,
  PublicReadingList,
  ReadingList,
  ShareReadingListResponse,
  UpdateReadingListItemRequest,
} from "../types/readingList";

export async function getMyReadingLists() {
  const res = await api.get<ReadingList[]>("/reading-lists/me");
  return res.data;
}

export async function getReadingListItemsPaged(listId: number, page = 1, pageSize = 25) {
  const res = await api.get<PaginatedReadingListItems>(
    `/reading-lists/${listId}/items/paged`,
    {
      params: { page, page_size: pageSize },
    },
  );
  return res.data;
}

export async function createReadingList(payload: CreateReadingListRequest) {
  const res = await api.post<ReadingList>("/reading-lists", payload);
  return res.data;
}

export async function addReadingListItem(
  listId: number,
  payload: AddReadingListItemRequest,
) {
  const res = await api.post<ReadingList>(`/reading-lists/${listId}/items`, payload);
  return res.data;
}

export async function updateReadingListItem(
  listId: number,
  seriesId: number,
  payload: UpdateReadingListItemRequest,
) {
  const res = await api.patch<ReadingList>(
    `/reading-lists/${listId}/items/${seriesId}`,
    payload,
  );
  return res.data;
}

export async function removeReadingListItem(listId: number, seriesId: number) {
  const res = await api.delete<ReadingList>(`/reading-lists/${listId}/items/${seriesId}`);
  return res.data;
}

export async function deleteReadingList(listId: number) {
  await api.delete(`/reading-lists/${listId}`);
}

export async function getPublicReadingList(token: string) {
  const res = await api.get<PublicReadingList>(`/reading-lists/public/${token}`);
  return res.data;
}

export async function shareReadingList(listId: number) {
  const res = await api.post<ShareReadingListResponse>(`/reading-lists/${listId}/share`);
  return res.data;
}

export async function unshareReadingList(listId: number) {
  await api.delete(`/reading-lists/${listId}/share`);
}
