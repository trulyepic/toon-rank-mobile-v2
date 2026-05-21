import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useState } from "react";
import { Image, Linking, Pressable, StyleSheet, View } from "react-native";

import type { RootStackParamList } from "../navigation/RootNavigator";
import { colors, radii, spacing } from "../theme/tokens";
import { AppText } from "./AppText";

type Props = {
  markdown: string;
};

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
        summary: cleanText(match[1]) || "Spoiler",
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

function cleanText(value: string) {
  return value
    .replace(/```([\s\S]*?)```/g, "$1")
    .replace(/<\/?(?:b|strong|i|em|u|span)\b[^>]*>/gi, "")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/[*_`>]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

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

        const text = cleanText(segment.value);

        if (!text) return null;

        return (
          <AppText key={`${text}-${index}`} tone="muted">
            {text}
          </AppText>
        );
      })}
    </View>
  );
}

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
});
