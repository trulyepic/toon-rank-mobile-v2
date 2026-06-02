import type { UserRole } from "../types/account";

/**
 * Whether the current user may triage issues (change status / delete) from the
 * mobile issue tracker. Admin-only — matches the web admin controls. The public
 * tracker stays read-only for everyone else.
 */
export function canTriageIssues(role: UserRole | null | undefined): boolean {
  return role === "ADMIN";
}
