import { api } from "./client";
import type { Issue, IssueStatus, IssueType, ReportIssueRequest } from "../types/issue";

export async function updateIssueStatus(id: number, status: IssueStatus) {
  const res = await api.patch<Issue>(`/issues/${id}/status`, { status });
  return res.data;
}

export async function deleteIssue(id: number) {
  await api.delete(`/issues/${id}`);
}

export type ListIssuesParams = {
  q?: string;
  type?: IssueType;
  status?: IssueStatus;
  page?: number;
  page_size?: number;
};

export async function reportIssue(payload: ReportIssueRequest) {
  const formData = new FormData();

  formData.append("type", payload.type);
  formData.append("title", payload.title);
  formData.append("description", payload.description);

  if (payload.page_url) formData.append("page_url", payload.page_url);
  if (payload.email) formData.append("email", payload.email);
  if (payload.screenshot) {
    formData.append("screenshot", payload.screenshot as unknown as Blob);
  }

  const res = await api.post<Issue>("/issues/report", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function listIssues(params?: ListIssuesParams) {
  const res = await api.get<Issue[]>("/issues", { params });
  return res.data;
}
