import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { updateSeries } from "../api/series";
import { colors, radii, spacing } from "../theme/tokens";
import type { RankedSeries, SeriesType } from "../types/series";
import { getSeriesStatusMeta } from "../utils/seriesStatus";
import { AppButton } from "./AppButton";
import { AppText } from "./AppText";
import { Surface } from "./Surface";

type Props = {
  series: RankedSeries;
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
};

const TYPE_OPTIONS: { label: string; value: SeriesType }[] = [
  { label: "Manhwa", value: "MANHWA" },
  { label: "Manga", value: "MANGA" },
  { label: "Manhua", value: "MANHUA" },
];

const STATUS_OPTIONS: { label: string; value: string }[] = [
  { label: "Ongoing", value: "ONGOING" },
  { label: "Complete", value: "COMPLETE" },
  { label: "Hiatus", value: "HIATUS" },
  { label: "Season End", value: "SEASON_END" },
  { label: "Unknown", value: "UNKNOWN" },
];

export function EditSeriesModal({ series, visible, onClose, onSaved }: Props) {
  const styles = getStyles();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const maxScrollHeight = screenHeight * 0.62;

  const [title, setTitle] = useState(series.title);
  const [genre, setGenre] = useState(series.genre ?? "");
  const [type, setType] = useState<SeriesType>(series.type);
  const [author, setAuthor] = useState(series.author ?? "");
  const [artist, setArtist] = useState(series.artist ?? "");
  const [status, setStatus] = useState<string>((series.status ?? "").toUpperCase());
  const [cover, setCover] = useState<{ uri: string; mimeType: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      updateSeries(series.id, {
        title: title.trim(),
        genre: genre.trim(),
        type,
        author: author.trim(),
        artist: artist.trim(),
        status: status || undefined,
        coverUri: cover?.uri,
        coverMimeType: cover?.mimeType,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["rankings"] });
      void queryClient.invalidateQueries({ queryKey: ["series-summary", series.id] });
      void queryClient.invalidateQueries({ queryKey: ["series-detail", series.id] });
      onSaved();
      onClose();
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        "Could not save changes. Please try again.";
      setError(msg);
    },
  });

  async function pickCover() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [2, 3],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setCover({ uri: asset.uri, mimeType: asset.mimeType ?? "image/jpeg" });
    }
  }

  function handleSave() {
    setError(null);
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!genre.trim()) {
      setError("Genre is required.");
      return;
    }
    mutation.mutate();
  }

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Surface
          radius="xl"
          style={[styles.sheet, { paddingBottom: spacing.md + insets.bottom }]}
        >
          <View style={styles.header}>
            <AppText variant="sectionTitle">Edit title</AppText>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView
            style={{ maxHeight: maxScrollHeight }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator
            contentContainerStyle={styles.scroll}
          >
            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={16} color={colors.danger} />
                <AppText tone="danger" style={styles.errorText}>
                  {error}
                </AppText>
              </View>
            ) : null}

            <AppText variant="label" tone="muted">
              Title
            </AppText>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Title"
              placeholderTextColor={colors.textSubtle}
              style={styles.input}
              maxLength={200}
            />

            <AppText variant="label" tone="muted" style={styles.fieldGap}>
              Type
            </AppText>
            <View style={styles.pills}>
              {TYPE_OPTIONS.map((t) => (
                <Pressable
                  key={t.value}
                  onPress={() => setType(t.value)}
                  style={[styles.pill, type === t.value ? styles.pillActive : null]}
                >
                  <AppText variant="caption" tone={type === t.value ? "accent" : "muted"}>
                    {t.label}
                  </AppText>
                </Pressable>
              ))}
            </View>

            <AppText variant="label" tone="muted" style={styles.fieldGap}>
              Status
            </AppText>
            <View style={styles.pills}>
              {STATUS_OPTIONS.map((s) => {
                const selected = status === s.value;
                const dot = getSeriesStatusMeta(s.value)?.background;
                return (
                  <Pressable
                    key={s.value}
                    onPress={() => setStatus(selected ? "" : s.value)}
                    style={[styles.pill, selected ? styles.pillActive : null]}
                  >
                    {dot ? <View style={[styles.dot, { backgroundColor: dot }]} /> : null}
                    <AppText variant="caption" tone={selected ? "accent" : "muted"}>
                      {s.label}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>

            <AppText variant="label" tone="muted" style={styles.fieldGap}>
              Genre
            </AppText>
            <TextInput
              value={genre}
              onChangeText={setGenre}
              placeholder="e.g. Action, Fantasy"
              placeholderTextColor={colors.textSubtle}
              style={styles.input}
              maxLength={100}
            />

            <AppText variant="label" tone="muted" style={styles.fieldGap}>
              Author
            </AppText>
            <TextInput
              value={author}
              onChangeText={setAuthor}
              placeholder="Optional"
              placeholderTextColor={colors.textSubtle}
              style={styles.input}
              maxLength={100}
            />

            <AppText variant="label" tone="muted" style={styles.fieldGap}>
              Artist
            </AppText>
            <TextInput
              value={artist}
              onChangeText={setArtist}
              placeholder="Optional"
              placeholderTextColor={colors.textSubtle}
              style={styles.input}
              maxLength={100}
            />

            <AppText variant="label" tone="muted" style={styles.fieldGap}>
              Cover
            </AppText>
            <View style={styles.coverRow}>
              <Image
                source={{ uri: cover?.uri || series.cover_url }}
                style={styles.coverPreview}
              />
              <Pressable
                onPress={pickCover}
                style={({ pressed }) => [
                  styles.replaceBtn,
                  pressed ? styles.pressed : null,
                ]}
              >
                <Ionicons
                  name="swap-horizontal-outline"
                  size={16}
                  color={colors.accentStrong}
                />
                <AppText tone="accent" variant="caption">
                  {cover ? "Cover selected — tap to change" : "Replace cover"}
                </AppText>
              </Pressable>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <AppButton label="Cancel" variant="ghost" onPress={onClose} />
            <AppButton
              label={mutation.isPending ? "Saving…" : "Save"}
              selected
              disabled={mutation.isPending}
              onPress={handleSave}
              iconLeft={
                mutation.isPending ? (
                  <ActivityIndicator size="small" color={colors.text} />
                ) : (
                  <Ionicons name="checkmark" size={16} color={colors.text} />
                )
              }
            />
          </View>
        </Surface>
      </View>
    </Modal>
  );
}

function getStyles() {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: "rgba(0,0,0,0.6)",
    },
    sheet: {
      maxHeight: "92%",
      gap: spacing.md,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.md,
    },
    scroll: {
      gap: spacing.xs,
      paddingBottom: spacing.sm,
    },
    errorBox: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.sm,
      padding: spacing.sm,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.danger,
      marginBottom: spacing.sm,
    },
    errorText: {
      flex: 1,
    },
    fieldGap: {
      marginTop: spacing.sm,
    },
    input: {
      minHeight: 48,
      borderWidth: 1,
      borderColor: colors.borderSoft,
      borderRadius: radii.lg,
      paddingHorizontal: spacing.md,
      color: colors.text,
      backgroundColor: colors.backgroundSoft,
      fontSize: 15,
    },
    pills: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
    },
    pill: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: radii.pill,
      borderWidth: 1,
      borderColor: colors.borderSoft,
    },
    pillActive: {
      borderColor: colors.accentStrong,
      backgroundColor: colors.accentSoft,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    coverRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
    },
    coverPreview: {
      width: 64,
      height: 92,
      borderRadius: radii.md,
      backgroundColor: colors.surfaceRaised,
    },
    replaceBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      flex: 1,
    },
    pressed: {
      opacity: 0.8,
    },
    footer: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: spacing.sm,
    },
  });
}
