import { api } from "./client";
import type { RankedSeries, SeriesDetailData, SeriesType } from "../types/series";

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
