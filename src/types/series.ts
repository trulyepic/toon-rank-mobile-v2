export type SeriesType = "MANGA" | "MANHWA" | "MANHUA";

export interface CategoryVote {
  category: string;
  score: number;
}

export interface MySeriesVote {
  series_id: number;
  title?: string | null;
  cover_url?: string | null;
  type?: string | null;
  status?: string | null;
  votes: CategoryVote[];
}

export interface MySeriesVotesPage {
  items: MySeriesVote[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  has_prev: boolean;
  has_next: boolean;
}

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
  approval_status?: string | null;
  submitted_by_id?: number | null;
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

export type SubmissionStatus = "PENDING" | "PENDING_REVIEW" | "APPROVED" | "REJECTED";

export interface SeriesSubmission {
  id: number;
  title: string;
  type: SeriesType;
  genre?: string | null;
  author?: string | null;
  artist?: string | null;
  cover_url?: string | null;
  approval_status: SubmissionStatus;
  detail_ready: boolean;
  created_at?: string | null;
}
