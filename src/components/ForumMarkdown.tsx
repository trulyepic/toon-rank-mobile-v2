import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useState } from "react";
import {
  Image,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import type { RootStackParamList } from "../navigation/RootNavigator";
import { colors, radii, spacing } from "../theme/tokens";
import { AppText } from "./AppText";

type Props = {
  markdown: string;
};

// ─── Outer token types (images, links, series refs, spoilers) ───────────────

type Segment =
  | { kind: "text"; value: string }
  | { kind: "image"; alt: string; url: string }
  | { kind: "series"; label: string; seriesId: number }
  | { kind: "link"; label: string; url: string }
  | { kind: "spoiler"; summary: string; body: string };

const tokenPattern =
  /<details\b[^>]*>\s*<summary\b[^>]*>([\s\S]*?)<\/summary>([\s\S]*?)<\/details>|<img\b[^>]*\bsrc=["'](https?:\/\/[^"']+)["'][^>]*>|!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)|\[([^\]]+)\]\((series:\s*\d+|\/series\/\d+(?:[?#][^)]+)?|https?:\/\/[^)\s]+)\)|(https?:\/\/[^\s<>()]+\.(?:png|jpe?g|webp|gif)(?:\?[^\s<>()]+)?)/gi;

function parseMarkdown(markdown: string): Segment[] {
  const segments: Segment[] = [];
  let lastIndex = 0;

  for (const match of markdown.matchAll(tokenPattern)) {
    const index = match.index ?? 0;
    const fullMatch = match[0];

    if (index > lastIndex) {
      segments.push({ kind: "text", value: markdown.slice(lastIndex, index) });
    }

    if (match[1] !== undefined && match[2] !== undefined) {
      segments.push({
        kind: "spoiler",
        summary: cleanPlainText(match[1]) || "Spoiler",
        body: match[2].trim(),
      });
    } else if (match[3]) {
      segments.push({ kind: "image", alt: "Forum image", url: match[3] });
    } else if (match[4] !== undefined && match[5]) {
      segments.push({ kind: "image", alt: match[4] || "Forum image", url: match[5] });
    } else if (match[6] && match[7]) {
      const label = match[6];
      const url = match[7].trim();
      const seriesMatch = url.match(/(?:series:\s*|\/series\/)(\d+)/i);

      if (seriesMatch) {
        const seriesId = Number(seriesMatch[1]);

        segments.push(
          Number.isFinite(seriesId) && seriesId > 0
            ? { kind: "series", label, seriesId }
            : { kind: "text", value: label },
        );
      } else {
        segments.push({ kind: "link", label, url });
      }
    } else if (match[8]) {
      segments.push({ kind: "image", alt: "Forum image", url: match[8] });
    }

    lastIndex = index + fullMatch.length;
  }

  if (lastIndex < markdown.length) {
    segments.push({ kind: "text", value: markdown.slice(lastIndex) });
  }

  return segments;
}

// Strips all markdown for plain text contexts (spoiler summary)
function cleanPlainText(value: string) {
  return value
    .replace(/```([\s\S]*?)```/g, "$1")
    .replace(/<\/?(?:b|strong|i|em|u|span)\b[^>]*>/gi, "")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/[*_`>]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Reduce a markdown/HTML string to plain text suitable for a one-line or
 * truncated preview (e.g. an activity feed card). HTML is converted first via
 * preprocessHtml, then all markdown syntax is stripped.
 */
export function stripMarkdownToText(value: string): string {
  let s = preprocessHtml(value);
  s = s
    .replace(/```[\s\S]*?```/g, "") // drop code blocks entirely
    .replace(/^\s{0,3}#{1,6}\s+/gm, "") // headings
    .replace(/\*\*([\s\S]*?)\*\*/g, "$1") // **bold**
    .replace(/__([\s\S]*?)__/g, "$1") // __bold__
    .replace(/~~([\s\S]*?)~~/g, "$1") // ~~strike~~
    .replace(/\*([\s\S]*?)\*/g, "$1") // *italic*
    .replace(/`([^`]+)`/g, "$1") // `code`
    .replace(/^>\s*/gm, "") // blockquote prefix
    .replace(/^[-*+]\s+/gm, "") // unordered list bullets
    .replace(/^\d+\.\s+/gm, "") // ordered list numbers
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // [label](url) → label
    .replace(/\n+/g, " ") // collapse all newlines to spaces
    .replace(/\s{2,}/g, " ") // normalise multiple spaces
    .trim();
  return s;
}

// ─── HTML → Markdown preprocessor ──────────────────────────────────────────

/** Strip all remaining HTML tags, keeping inner text. */
function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, "");
}

/**
 * Convert common HTML tags found in forum posts into equivalent markdown
 * so the block/inline parsers can render them correctly.
 *
 * Called on text segments AFTER the outer tokenizer has already extracted
 * <details>/<summary>, <img>, and markdown image/link/series patterns.
 */
function preprocessHtml(src: string): string {
  let s = src;

  // 1. Fenced code blocks: <pre><code>…</code></pre> → ``` … ```
  s = s.replace(/<pre[^>]*>\s*<code[^>]*>([\s\S]*?)<\/code>\s*<\/pre>/gi, (_, code) => {
    const inner = code.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
    return "```\n" + inner.trim() + "\n```";
  });

  // 2. Inline code: <code>…</code> → `…`
  s = s.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, (_, code) => {
    const inner = code
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
      .replace(/\n/g, " ")
      .trim();
    return "`" + inner + "`";
  });

  // 3. Headings: <h1>…</h1> through <h6>…</h6>
  s = s.replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi, (_, level, text) => {
    return "#".repeat(Number(level)) + " " + stripTags(text).trim() + "\n";
  });

  // 4. Inline formatting — convert before block elements so nesting works correctly.
  s = s.replace(/<(?:strong|b)[^>]*>([\s\S]*?)<\/(?:strong|b)>/gi, "**$1**");
  s = s.replace(/<(?:em|i)[^>]*>([\s\S]*?)<\/(?:em|i)>/gi, "*$1*");
  s = s.replace(/<(?:strike|del|s)[^>]*>([\s\S]*?)<\/(?:strike|del|s)>/gi, "~~$1~~");
  s = s.replace(/<u[^>]*>([\s\S]*?)<\/u>/gi, "$1");

  // 5. Anchors: <a href="url">label</a> → [label](url)
  s = s.replace(
    /<a\s[^>]*?href=["'](https?:\/\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi,
    (_, url, label) => "[" + stripTags(label).trim() + "](" + url + ")",
  );

  // 6. Blockquote: <blockquote>…</blockquote> → > prefixed lines
  s = s.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_, inner) => {
    return (
      inner
        .trim()
        .split("\n")
        .map((l: string) => "> " + l.trim())
        .join("\n") + "\n"
    );
  });

  // 7. Ordered list: <ol><li>…</li></ol>
  s = s.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (_, inner) => {
    const items = [...inner.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)];
    return (
      items.map((m, idx) => `${idx + 1}. ` + stripTags(m[1]).trim()).join("\n") + "\n"
    );
  });

  // 8. Unordered list: <ul><li>…</li></ul>
  s = s.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (_, inner) => {
    const items = [...inner.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)];
    return items.map((m) => "- " + stripTags(m[1]).trim()).join("\n") + "\n";
  });

  // 9. Paragraph: <p>…</p> → text + double newline
  s = s.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (_, inner) => inner.trim() + "\n\n");

  // 10. Line breaks
  s = s.replace(/<br\s*\/?>/gi, "\n");

  // 11. Divs add a newline boundary
  s = s.replace(/<div[^>]*>/gi, "\n");
  s = s.replace(/<\/div>/gi, "\n");

  // 12. Span tags: strip wrapper, keep content
  s = s.replace(/<\/?span[^>]*>/gi, "");

  // 13. HTML entities
  s = s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));

  // 14. Strip any remaining unknown HTML tags (preserve their inner text).
  s = s.replace(/<[^>]+>/g, "");

  // 15. Normalise excessive blank lines.
  s = s.replace(/\n{3,}/g, "\n\n").trim();

  return s;
}

// ─── @mention chip ──────────────────────────────────────────────────────────

function MentionChip({ username }: { username: string }) {
  const styles = getStyles();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return (
    <Text
      style={styles.mentionChip}
      onPress={() => navigation.navigate("PublicProfile", { username })}
    >
      @{username}
    </Text>
  );
}

// ─── Inline token renderer ───────────────────────────────────────────────────

type InlineToken =
  | { k: "t"; v: string }
  | { k: "b"; v: string }
  | { k: "i"; v: string }
  | { k: "c"; v: string }
  | { k: "s"; v: string }
  | { k: "a"; v: string; url: string }
  | { k: "mention"; v: string };

// Groups: 1=**bold** 2=__bold__ 3=~~strike~~ 4=`code` 5+6=[label](url) 7=*italic* 8=@mention
const inlinePattern =
  /\*\*([\s\S]*?)\*\*|__([\s\S]*?)__|~~([\s\S]*?)~~|`([^`\n]+)`|\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)|\*([\s\S]*?)\*|(?<![[\w])@([A-Za-z0-9_-]{3,20})(?![[\w])/g;

function parseInline(src: string): InlineToken[] {
  const out: InlineToken[] = [];
  let pos = 0;

  for (const m of src.matchAll(inlinePattern)) {
    const at = m.index!;
    if (at > pos) out.push({ k: "t", v: src.slice(pos, at) });
    if (m[1] !== undefined) out.push({ k: "b", v: m[1] });
    else if (m[2] !== undefined) out.push({ k: "b", v: m[2] });
    else if (m[3] !== undefined) out.push({ k: "s", v: m[3] });
    else if (m[4] !== undefined) out.push({ k: "c", v: m[4] });
    else if (m[5] !== undefined && m[6] !== undefined)
      out.push({ k: "a", v: m[5], url: m[6] });
    else if (m[7] !== undefined) out.push({ k: "i", v: m[7] });
    else if (m[8] !== undefined) out.push({ k: "mention", v: m[8] });
    pos = at + m[0].length;
  }

  if (pos < src.length) out.push({ k: "t", v: src.slice(pos) });
  return out;
}

function InlineText({ text, extra }: { text: string; extra?: object }) {
  const styles = getStyles();
  const tokens = parseInline(text);

  return (
    <Text style={[styles.mdBody, extra]}>
      {tokens.map((token, i) => {
        if (token.k === "b")
          return (
            <Text key={i} style={styles.mdBold}>
              {token.v}
            </Text>
          );
        if (token.k === "i")
          return (
            <Text key={i} style={styles.mdItalic}>
              {token.v}
            </Text>
          );
        if (token.k === "c")
          return (
            <Text key={i} style={styles.mdInlineCode}>
              {token.v}
            </Text>
          );
        if (token.k === "s")
          return (
            <Text key={i} style={styles.mdStrike}>
              {token.v}
            </Text>
          );
        if (token.k === "a")
          return (
            <Text
              key={i}
              style={styles.mdLink}
              onPress={() => Linking.openURL(token.url)}
            >
              {token.v}
            </Text>
          );
        if (token.k === "mention") return <MentionChip key={i} username={token.v} />;
        return token.v;
      })}
    </Text>
  );
}

// ─── Block-level renderer ────────────────────────────────────────────────────

type MdBlock =
  | { type: "para"; text: string }
  | { type: "heading"; level: number; text: string }
  | { type: "quote"; lines: string[] }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "code"; text: string };

/**
 * Parse markdown into blocks, processing line-by-line so that block
 * transitions on single newlines are handled correctly (e.g. a blockquote
 * immediately followed by a list, or a heading inside a paragraph).
 */
function parseMdBlocks(src: string): MdBlock[] {
  const blocks: MdBlock[] = [];
  // Split out fenced code blocks first to preserve their content verbatim.
  const parts = src.split(/(```[\w]*\n?[\s\S]*?```)/g);

  for (const part of parts) {
    if (part.startsWith("```")) {
      const inner = part
        .replace(/^```[\w]*\n?/, "")
        .replace(/```$/, "")
        .trim();
      if (inner) blocks.push({ type: "code", text: inner });
      continue;
    }

    const lines = part.split("\n");
    let i = 0;

    while (i < lines.length) {
      const trimmed = lines[i].trim();

      // Skip blank lines between blocks.
      if (!trimmed) {
        i++;
        continue;
      }

      // Heading — must be on its own line.
      const hm = trimmed.match(/^(#{1,6})\s+(.*)/);
      if (hm) {
        blocks.push({ type: "heading", level: hm[1].length, text: hm[2].trim() });
        i++;
        continue;
      }

      // Blockquote — collect consecutive > lines.
      if (/^>\s?/.test(trimmed)) {
        const quoteLines: string[] = [];
        while (i < lines.length && /^>\s?/.test(lines[i].trim())) {
          quoteLines.push(lines[i].replace(/^>\s?/, ""));
          i++;
        }
        if (quoteLines.length) blocks.push({ type: "quote", lines: quoteLines });
        continue;
      }

      // List — collect consecutive list-item lines.
      if (/^[-*+]\s+/.test(trimmed) || /^\d+\.\s+/.test(trimmed)) {
        const ordered = /^\d+\./.test(trimmed);
        const items: string[] = [];
        while (
          i < lines.length &&
          (/^[-*+]\s+/.test(lines[i].trim()) || /^\d+\.\s+/.test(lines[i].trim()))
        ) {
          items.push(lines[i].replace(/^(?:[-*+]|\d+\.)\s+/, ""));
          i++;
        }
        if (items.length) blocks.push({ type: "list", ordered, items });
        continue;
      }

      // Paragraph — collect until a blank line or a block-starting line.
      const paraLines: string[] = [];
      while (i < lines.length) {
        const l = lines[i];
        const tl = l.trim();
        if (!tl) {
          i++;
          break;
        }
        if (/^#{1,6}\s/.test(tl)) break;
        if (/^>\s?/.test(tl)) break;
        if (/^[-*+]\s+/.test(tl) || /^\d+\.\s+/.test(tl)) break;
        paraLines.push(l);
        i++;
      }
      const paraText = paraLines.join("\n").trim();
      if (paraText) blocks.push({ type: "para", text: paraText });
    }
  }

  return blocks;
}

function MarkdownText({ text }: { text: string }) {
  const styles = getStyles();
  const clean = preprocessHtml(text);
  const blocks = parseMdBlocks(clean);
  if (!blocks.length) return null;

  return (
    <View style={styles.mdRoot}>
      {blocks.map((block, bi) => {
        if (block.type === "code") {
          return (
            <View key={bi} style={styles.mdCodeBlock}>
              <Text style={styles.mdCodeText}>{block.text}</Text>
            </View>
          );
        }

        if (block.type === "heading") {
          const hs =
            block.level === 1
              ? styles.mdH1
              : block.level === 2
                ? styles.mdH2
                : styles.mdH3;
          return <InlineText key={bi} text={block.text} extra={hs} />;
        }

        if (block.type === "quote") {
          return (
            <View key={bi} style={styles.mdBlockquote}>
              {block.lines.map((line, li) => (
                <InlineText key={li} text={line || " "} extra={styles.mdQuoteText} />
              ))}
            </View>
          );
        }

        if (block.type === "list") {
          return (
            <View key={bi} style={styles.mdList}>
              {block.items.map((item, ii) => (
                <View key={ii} style={styles.mdListRow}>
                  <Text style={[styles.mdBody, styles.mdListBullet]}>
                    {block.ordered ? `${ii + 1}.` : "•"}
                  </Text>
                  <InlineText text={item} />
                </View>
              ))}
            </View>
          );
        }

        return <InlineText key={bi} text={block.text} />;
      })}
    </View>
  );
}

// ─── Spoiler ─────────────────────────────────────────────────────────────────

function SpoilerBlock({ summary, body }: { summary: string; body: string }) {
  const styles = getStyles();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <View style={styles.spoiler}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={isOpen ? `Hide ${summary}` : `Show ${summary}`}
        onPress={() => setIsOpen((current) => !current)}
        style={({ pressed }) => [styles.spoilerHeader, pressed ? styles.pressed : null]}
      >
        <Ionicons
          name={isOpen ? "chevron-down" : "chevron-forward"}
          size={15}
          color={colors.accentStrong}
        />
        <AppText variant="caption" style={styles.linkText}>
          {summary}
        </AppText>
      </Pressable>
      {isOpen ? (
        <View style={styles.spoilerBody}>
          <ForumMarkdown markdown={body} />
        </View>
      ) : null}
    </View>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────

export function ForumMarkdown({ markdown }: Props) {
  const styles = getStyles();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const segments = parseMarkdown(markdown);

  return (
    <View style={styles.root}>
      {segments.map((segment, index) => {
        if (segment.kind === "image") {
          return (
            <Image
              key={`${segment.url}-${index}`}
              source={{ uri: segment.url }}
              accessibilityLabel={segment.alt}
              resizeMode="cover"
              style={styles.image}
            />
          );
        }

        if (segment.kind === "series") {
          return (
            <Pressable
              key={`${segment.seriesId}-${index}`}
              onPress={() =>
                navigation.navigate("SeriesDetail", { seriesId: segment.seriesId })
              }
              style={({ pressed }) => [styles.linkPill, pressed ? styles.pressed : null]}
              accessibilityRole="button"
              accessibilityLabel={`Open ${segment.label}`}
              accessibilityHint="Opens the title detail screen"
            >
              <Ionicons name="book-outline" size={14} color={colors.accentStrong} />
              <AppText variant="caption" style={styles.linkText}>
                {segment.label}
              </AppText>
            </Pressable>
          );
        }

        if (segment.kind === "link") {
          return (
            <Pressable
              key={`${segment.url}-${index}`}
              onPress={() => Linking.openURL(segment.url)}
              style={({ pressed }) => [styles.linkPill, pressed ? styles.pressed : null]}
              accessibilityRole="link"
              accessibilityLabel={`Open ${segment.label}`}
            >
              <Ionicons name="open-outline" size={14} color={colors.accentStrong} />
              <AppText variant="caption" style={styles.linkText}>
                {segment.label}
              </AppText>
            </Pressable>
          );
        }

        if (segment.kind === "spoiler") {
          return (
            <SpoilerBlock
              key={`${segment.summary}-${index}`}
              summary={segment.summary}
              body={segment.body}
            />
          );
        }

        return <MarkdownText key={`text-${index}`} text={segment.value} />;
      })}
    </View>
  );
}

const MONOSPACE = Platform.OS === "ios" ? "Menlo" : "monospace";

function getStyles() {
  return StyleSheet.create({
    root: {
      gap: spacing.sm,
    },
    image: {
      width: "100%",
      aspectRatio: 16 / 10,
      borderRadius: radii.lg,
      backgroundColor: colors.backgroundSoft,
      borderWidth: 1,
      borderColor: colors.borderSoft,
    },
    linkPill: {
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      maxWidth: "100%",
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radii.pill,
      backgroundColor: colors.accentSoft,
      borderWidth: 1,
      borderColor: colors.accent,
    },
    linkText: {
      color: colors.text,
      flexShrink: 1,
    },
    pressed: {
      opacity: 0.86,
    },
    spoiler: {
      gap: spacing.xs,
      padding: spacing.sm,
      borderRadius: radii.lg,
      backgroundColor: colors.backgroundSoft,
      borderWidth: 1,
      borderColor: colors.borderSoft,
    },
    spoilerHeader: {
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      maxWidth: "100%",
    },
    spoilerBody: {
      paddingTop: spacing.xs,
    },
    // Markdown text block styles
    mdRoot: {
      gap: spacing.sm,
    },
    mdBody: {
      fontSize: 15,
      lineHeight: 23,
      fontWeight: "400",
      color: colors.textMuted,
    },
    mdBold: {
      fontWeight: "700",
      color: colors.text,
    },
    mdItalic: {
      fontStyle: "italic",
    },
    mdStrike: {
      textDecorationLine: "line-through",
    },
    mdLink: {
      color: colors.accentStrong,
      textDecorationLine: "underline",
    },
    mentionChip: {
      color: colors.accentStrong,
      fontWeight: "700",
      backgroundColor: colors.accentSoft,
      borderRadius: 4,
      paddingHorizontal: 2,
    },
    mdInlineCode: {
      fontFamily: MONOSPACE,
      fontSize: 13,
      backgroundColor: colors.backgroundSoft,
      color: colors.accentStrong,
    },
    mdCodeBlock: {
      backgroundColor: colors.backgroundSoft,
      borderWidth: 1,
      borderColor: colors.borderSoft,
      borderRadius: radii.md,
      padding: spacing.sm,
    },
    mdCodeText: {
      fontFamily: MONOSPACE,
      fontSize: 13,
      lineHeight: 20,
      color: colors.textMuted,
    },
    mdBlockquote: {
      borderLeftWidth: 3,
      borderLeftColor: colors.accentBorder,
      paddingLeft: spacing.sm,
      gap: 4,
    },
    mdQuoteText: {
      color: colors.textSubtle,
      fontStyle: "italic",
    },
    mdList: {
      gap: 4,
    },
    mdListRow: {
      flexDirection: "row",
      gap: spacing.xs,
      alignItems: "flex-start",
    },
    mdListBullet: {
      color: colors.textMuted,
      minWidth: 16,
    },
    mdH1: {
      fontSize: 22,
      lineHeight: 28,
      fontWeight: "800",
      color: colors.text,
    },
    mdH2: {
      fontSize: 19,
      lineHeight: 25,
      fontWeight: "700",
      color: colors.text,
    },
    mdH3: {
      fontSize: 16,
      lineHeight: 22,
      fontWeight: "700",
      color: colors.text,
    },
  });
}
