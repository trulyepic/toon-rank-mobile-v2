export type ForumTextSelection = {
  start: number;
  end: number;
};

export type ForumFormatAction =
  | "bold"
  | "italic"
  | "strike"
  | "link"
  | "inlineCode"
  | "codeBlock"
  | "quote"
  | "unorderedList"
  | "orderedList"
  | "spoiler";

type FormatResult = {
  text: string;
  selection: ForumTextSelection;
};

const DEFAULT_SELECTION: ForumTextSelection = { start: 0, end: 0 };

export function applyForumFormat(
  value: string,
  selection: ForumTextSelection | null,
  action: ForumFormatAction,
): FormatResult {
  const safeSelection = clampSelection(value, selection ?? DEFAULT_SELECTION);

  switch (action) {
    case "bold":
      return wrapSelection(value, safeSelection, "**", "**", "bold text");
    case "italic":
      return wrapSelection(value, safeSelection, "*", "*", "italic text");
    case "strike":
      return wrapSelection(value, safeSelection, "~~", "~~", "struck text");
    case "inlineCode":
      return wrapSelection(value, safeSelection, "`", "`", "code");
    case "codeBlock":
      return wrapSelection(value, safeSelection, "```\n", "\n```", "code");
    case "link":
      return insertLink(value, safeSelection);
    case "quote":
      return prefixSelectionLines(value, safeSelection, "> ", "quote");
    case "unorderedList":
      return prefixSelectionLines(value, safeSelection, "- ", "item");
    case "orderedList":
      return prefixSelectionLines(value, safeSelection, "1. ", "item");
    case "spoiler":
      return insertSpoiler(value, safeSelection);
  }
}

function clampSelection(value: string, selection: ForumTextSelection) {
  const start = Math.max(0, Math.min(selection.start, value.length));
  const end = Math.max(start, Math.min(selection.end, value.length));
  return { start, end };
}

function wrapSelection(
  value: string,
  selection: ForumTextSelection,
  left: string,
  right: string,
  placeholder: string,
): FormatResult {
  const selected = value.slice(selection.start, selection.end) || placeholder;
  const inserted = `${left}${selected}${right}`;
  const text = value.slice(0, selection.start) + inserted + value.slice(selection.end);
  const contentStart = selection.start + left.length;

  return {
    text,
    selection: { start: contentStart, end: contentStart + selected.length },
  };
}

function insertLink(value: string, selection: ForumTextSelection): FormatResult {
  const selected = value.slice(selection.start, selection.end) || "link text";
  const inserted = `[${selected}](https://example.com)`;
  const text = value.slice(0, selection.start) + inserted + value.slice(selection.end);
  const urlStart = selection.start + selected.length + 3;

  return {
    text,
    selection: { start: urlStart, end: urlStart + "https://example.com".length },
  };
}

function insertSpoiler(value: string, selection: ForumTextSelection): FormatResult {
  const selected = value.slice(selection.start, selection.end).trim() || "hidden text";
  const inserted = `<details><summary>Spoiler</summary>\n\n${selected}\n\n</details>`;
  const contentStart = inserted.indexOf(selected);
  const text = value.slice(0, selection.start) + inserted + value.slice(selection.end);

  return {
    text,
    selection: {
      start: selection.start + contentStart,
      end: selection.start + contentStart + selected.length,
    },
  };
}

function prefixSelectionLines(
  value: string,
  selection: ForumTextSelection,
  prefix: string,
  placeholder: string,
): FormatResult {
  const selected = value.slice(selection.start, selection.end);
  const content = selected.trim().length > 0 ? selected : placeholder;
  const prefixed = content
    .split("\n")
    .map((line) => `${prefix}${line}`)
    .join("\n");
  const text = value.slice(0, selection.start) + prefixed + value.slice(selection.end);

  return {
    text,
    selection: { start: selection.start, end: selection.start + prefixed.length },
  };
}
