export type IssueType = "BUG" | "FEATURE" | "CONTENT" | "OTHER";
export type IssueStatus = "OPEN" | "IN_PROGRESS" | "FIXED" | "WONT_FIX";

export interface Issue {
  id: number;
  type: IssueType;
  title: string;
  description: string;
  page_url?: string | null;
  email?: string | null;
  screenshot_url?: string | null;
  user_id?: number | null;
  user_agent?: string | null;
  status: IssueStatus;
  admin_notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReportIssueRequest {
  type: IssueType;
  title: string;
  description: string;
  page_url?: string;
  email?: string;
  screenshot?: {
    uri: string;
    name: string;
    type: string;
  };
}
