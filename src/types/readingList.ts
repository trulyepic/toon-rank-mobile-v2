export interface ReadingListItem {
  series_id: number;
  left_off_chapter?: string | null;
}

export interface ReadingList {
  id: number;
  name: string;
  is_public: boolean;
  share_token: string;
  items: ReadingListItem[];
}

export interface PublicReadingList {
  name: string;
  owner_username?: string | null;
  items: ReadingListItem[];
}

export interface ShareReadingListResponse {
  share_token: string;
  share_url?: string | null;
}

export type PaginatedReadingListItems = {
  items: ReadingListItem[];
  page: number;
  page_size: number;
  total: number;
  has_more?: boolean;
  has_next?: boolean;
};

export interface CreateReadingListRequest {
  name: string;
}

export interface AddReadingListItemRequest {
  series_id: number;
  left_off_chapter?: string | null;
}

export interface UpdateReadingListItemRequest {
  left_off_chapter?: string | null;
}
