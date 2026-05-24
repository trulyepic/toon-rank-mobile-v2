import { api } from "./client";
import type { MySeriesVotesPage, SeriesDetailData } from "../types/series";

export type VoteCategory =
  | "Story"
  | "Characters"
  | "World Building"
  | "Art"
  | "Drama / Fighting";

export interface VoteSeriesRequest {
  category: VoteCategory;
  score: number;
}

export async function voteSeriesDetail(seriesId: number, payload: VoteSeriesRequest) {
  const formData = new FormData();
  formData.append("category", payload.category);
  formData.append("score", String(payload.score));

  const res = await api.post<SeriesDetailData>(
    `/series-details/${seriesId}/vote`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return res.data;
}

export async function getMySeriesVotes(page = 1, pageSize = 10) {
  const res = await api.get<MySeriesVotesPage>("/series-details/me/votes", {
    params: { page, page_size: pageSize },
  });
  return res.data;
}
