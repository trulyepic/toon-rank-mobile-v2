export type ForumThreadDraft = {
  title: string;
  body: string;
};

export type ForumThreadValidationResult = {
  title: string;
  body: string;
  error?: string;
};

export function validateForumThreadDraft({
  title,
  body,
}: ForumThreadDraft): ForumThreadValidationResult {
  const trimmedTitle = title.trim();
  const trimmedBody = body.trim();

  if (trimmedTitle.length < 3) {
    return {
      title: trimmedTitle,
      body: trimmedBody,
      error: "Thread title needs at least 3 characters.",
    };
  }

  if (trimmedTitle.length > 200) {
    return {
      title: trimmedTitle,
      body: trimmedBody,
      error: "Thread title must stay under 200 characters.",
    };
  }

  if (!trimmedBody) {
    return {
      title: trimmedTitle,
      body: trimmedBody,
      error: "Write the first post before creating the thread.",
    };
  }

  return { title: trimmedTitle, body: trimmedBody };
}
