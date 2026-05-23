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

// ─── Inline token renderer ───────────────────────────────────────────────────

type InlineToken =
  | { k: "t"; v: string }
  | { k: "b"; v: string }
  | { k: "i"; v: string }
  | { k: "c"; v: string };

const inlinePattern = /\*\*([\s\S]*?)\*\*|`([^`\n]+)`|\*([\s\S]*?)\*/g;

function parseInline(src: string): InlineToken[] {
  const out: InlineToken[] = [];
  let pos = 0;

  for (const m of src.matchAll(inlinePattern)) {
    const at = m.index!;
    if (at > pos) out.push({ k: "t", v: src.slice(pos, at) });
    if (m[1] !== undefined) out.push({ k: "b", v: m[1] });
    else if (m[2] !== undefined) out.push({ k: "c", v: m[2] });
    else if (m[3] !== undefined) out.push({ k: "i", v: m[3] });
    pos = at + m[0].length;
  }

  if (pos < src.length) out.push({ k: "t", v: src.slice(pos) });
  return out;
}

function InlineText({ text, extra }: { text: string; extra?: object }) {
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

function parseMdBlocks(src: string): MdBlock[] {
  const blocks: MdBlock[] = [];
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

    for (const chunk of part.split(/\n\n+/)) {
      const trimmed = chunk.trim();
      if (!trimmed) continue;

      const lines = trimmed.split("\n");

      if (lines.length === 1) {
        const hm = lines[0].match(/^(#{1,6})\s+(.*)/);
        if (hm) {
          blocks.push({ type: "heading", level: hm[1].length, text: hm[2] });
          continue;
        }
      }

      if (lines.every((l) => /^>\s*/.test(l))) {
        blocks.push({ type: "quote", lines: lines.map((l) => l.replace(/^>\s*/, "")) });
        continue;
      }

      if (lines.every((l) => /^[-*+]\s+/.test(l) || /^\d+\.\s+/.test(l))) {
        const ordered = /^\d+\./.test(lines[0]);
        blocks.push({
          type: "list",
          ordered,
          items: lines.map((l) => l.replace(/^(?:[-*+]|\d+\.)\s+/, "")),
        });
        continue;
      }

      blocks.push({ type: "para", text: trimmed });
    }
  }

  return blocks;
}

function MarkdownText({ text }: { text: string }) {
  const blocks = parseMdBlocks(text);
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
                <InlineText key={li} text={line || " "} extra={styles.mdQuoteText} />
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

const styles = StyleSheet.create({
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
