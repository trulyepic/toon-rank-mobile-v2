import { api } from "./client";
import type { SeriesDetailData } from "../types/series";

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
