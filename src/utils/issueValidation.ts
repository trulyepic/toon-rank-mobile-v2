export function isValidOptionalEmail(email: string) {
  const normalized = email.trim();
  if (!normalized) return true;

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
}

export function getReportIssueValidationError(input: {
  title: string;
  description: string;
  email: string;
}) {
  if (!input.title.trim()) {
    return "Add a short summary so we know what to look at.";
  }

  if (input.title.trim().length > 120) {
    return "Keep the summary under 120 characters.";
  }

  if (!input.description.trim()) {
    return "Add a few details so the issue can be reproduced.";
  }

  if (!isValidOptionalEmail(input.email)) {
    return "Enter a valid email address or leave it blank.";
  }

  return null;
}
