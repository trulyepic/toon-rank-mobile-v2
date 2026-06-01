export function appendForumMediaMarkdown(markdown: string, url: string) {
  const trimmed = markdown.trimEnd();
  return `${trimmed}\n\n![image](${url})`.trim();
}
