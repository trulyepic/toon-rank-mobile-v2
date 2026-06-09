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
  status?: string,
) {
  const res = await api.get<RankedSeries[]>("/series/rankings", {
    params: { page, page_size: pageSize, type, genre, status },
  });
  return res.data;
}

export async function searchSeries(query: string, type?: SeriesType) {
  // When `type` is provided the backend scopes both the results and the rank to
  // that category, so each result keeps its true rank within the type. Without
  // `type`, ranks reflect the full "All" ranking.
  const res = await api.get<RankedSeries[]>("/series/search", {
    params: { query, ...(type ? { type } : {}) },
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

/** Update a series' metadata (admin, or owner of a pending submission). */
export async function updateSeries(
  id: number,
  payload: {
    title?: string;
    genre?: string;
    type?: SeriesType;
    author?: string;
    artist?: string;
    status?: string;
    coverUri?: string;
    coverMimeType?: string;
  },
): Promise<void> {
  const formData = new FormData();
  if (payload.title !== undefined) formData.append("title", payload.title);
  if (payload.genre !== undefined) formData.append("genre", payload.genre);
  if (payload.type !== undefined) formData.append("type", payload.type);
  if (payload.author !== undefined) formData.append("author", payload.author);
  if (payload.artist !== undefined) formData.append("artist", payload.artist);
  if (payload.status) formData.append("status", payload.status);
  if (payload.coverUri && payload.coverMimeType) {
    formData.append("cover", {
      uri: payload.coverUri,
      type: payload.coverMimeType,
      name: "cover." + (payload.coverMimeType.split("/")[1] ?? "jpg"),
    } as unknown as Blob);
  }
  await api.put(`/series/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}
