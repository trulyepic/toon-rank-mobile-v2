import { api } from "./client";
import type { Issue, ReportIssueRequest } from "../types/issue";

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
