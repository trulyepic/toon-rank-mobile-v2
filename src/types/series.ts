export type SeriesType = "MANGA" | "MANHWA" | "MANHUA";

export interface RankedSeries {
  id: number;
  title: string;
  genre: string;
  type: SeriesType;
  cover_url: string;
  vote_count: number;
  final_score: number;
  rank: number | null;
  author?: string;
  artist?: string;
  status?: string | null;
}

export interface SeriesDetailData {
  id: number;
  title: string;
  genre: string;
  type: SeriesType;
  author?: string;
  artist?: string;
  status?: string | null;
  cover_url?: string;
  series_cover_url?: string;
  synopsis?: string;
  vote_scores?: Record<string, number>;
  vote_counts?: Record<string, number>;
  story_total?: number;
  story_count?: number;
  characters_total?: number;
  characters_count?: number;
  worldbuilding_total?: number;
  worldbuilding_count?: number;
  art_total?: number;
  art_count?: number;
  drama_or_fight_total?: number;
  drama_or_fight_count?: number;
}
