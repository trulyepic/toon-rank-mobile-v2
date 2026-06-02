/**
 * Local draft persistence helpers for the forum composer. Drafts are stored in
 * AsyncStorage so an unsent thread or reply survives accidental navigation, app
 * backgrounding, or a full app restart — the behavior users expect from a
 * native forum app. Keys are namespaced so each composer context has its own
 * draft slot.
 */

export const FORUM_DRAFT_PREFIX = "forum-draft";

export type ThreadDraft = {
  title: string;
  body: string;
  categoryId: number | null;
};

export type ReplyDraft = {
  body: string;
};

export const EMPTY_THREAD_DRAFT: ThreadDraft = {
  title: "",
  body: "",
  categoryId: null,
};

export const EMPTY_REPLY_DRAFT: ReplyDraft = { body: "" };

/** Storage key for the single new-thread composer draft. */
export function newThreadDraftKey(): string {
  return `${FORUM_DRAFT_PREFIX}:thread:new`;
}

/**
 * Storage key for a reply draft, scoped to the thread and the post being
 * replied to. A top-level reply uses the "root" parent slot so it does not
 * collide with replies aimed at a specific post.
 */
export function replyDraftKey(threadId: number, parentId: number | null): string {
  return `${FORUM_DRAFT_PREFIX}:reply:${threadId}:${parentId ?? "root"}`;
}

/** A thread draft is empty (and should not be persisted) when title and body are blank. */
export function isThreadDraftEmpty(draft: ThreadDraft): boolean {
  return draft.title.trim().length === 0 && draft.body.trim().length === 0;
}

/** A reply draft is empty when the body is blank. */
export function isReplyDraftEmpty(draft: ReplyDraft): boolean {
  return draft.body.trim().length === 0;
}
