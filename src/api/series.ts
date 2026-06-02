import { api } from "./client";
import type {
  RankedSeries,
  SeriesDetailData,
  SeriesSubmission,
  SeriesType,
} from "../types/series";

export async function fetchRankings(
  page = 1,
  pageSize = 20,
  type?: SeriesType,
  genre?: string,
) {
  const res = await api.get<RankedSeries[]>("/series/rankings", {
    params: { page, page_size: pageSize, type, genre },
  });
  return res.data;
}

export async function searchSeries(query: string) {
  const res = await api.get<RankedSeries[]>("/series/search", {
    params: { query },
  });
  return res.data;
}

export async function getSeriesSummary(seriesId: number) {
  const res = await api.get<RankedSeries>(`/series/summary/${seriesId}`);
  return res.data;
}

export async function getSeriesDetail(seriesId: number) {
  const res = await api.get<SeriesDetailData>(`/series-details/${seriesId}`);
  return res.data;
}

export async function submitSeries(payload: {
  title: string;
  type: SeriesType;
  genre: string;
  author?: string;
  artist?: string;
  coverUri: string;
  coverMimeType: string;
}): Promise<SeriesSubmission> {
  const formData = new FormData();
  formData.append("title", payload.title);
  formData.append("type", payload.type);
  formData.append("genre", payload.genre);
  if (payload.author) formData.append("author", payload.author);
  if (payload.artist) formData.append("artist", payload.artist);
  formData.append("cover_image", {
    uri: payload.coverUri,
    type: payload.coverMimeType,
    name: "cover." + (payload.coverMimeType.split("/")[1] ?? "jpg"),
  } as unknown as Blob);
  const res = await api.post<SeriesSubmission>("/series/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function getMySubmissions(): Promise<SeriesSubmission[]> {
  const res = await api.get<SeriesSubmission[]>("/series/submissions/mine");
  return res.data;
}
