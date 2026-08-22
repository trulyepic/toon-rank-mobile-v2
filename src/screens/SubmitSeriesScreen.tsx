import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { submitSeries } from "../api/series";
import { AppButton, AppText, Surface } from "../components";
import { useAuth } from "../auth/AuthContext";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { colors, radii, spacing } from "../theme/tokens";
import type { SeriesType } from "../types/series";
import { prepareCoverImage, TITLE_COVER_SPEC } from "../utils/coverImage";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const SERIES_TYPES: { label: string; value: SeriesType }[] = [
  { label: "Manhwa", value: "MANHWA" },
  { label: "Manga", value: "MANGA" },
  { label: "Manhua", value: "MANHUA" },
];

export function SubmitSeriesScreen() {
  const styles = getStyles();
  const navigation = useNavigation<Nav>();
  const { isSignedIn, user } = useAuth();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();

  const [title, setTitle] = useState("");
  const [type, setType] = useState<SeriesType>("MANHWA");
  const [genre, setGenre] = useState("");
  const [author, setAuthor] = useState("");
  const [artist, setArtist] = useState("");
  const [cover, setCover] = useState<{
    uri: string;
    mimeType: string;
    width: number;
    height: number;
    sizeKB: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    isSignedIn && (user?.role === "CONTRIBUTOR" || user?.role === "ADMIN");

  const mutation = useMutation({
    mutationFn: () =>
      submitSeries({
        title: title.trim(),
        type,
        genre: genre.trim(),
        author: author.trim() || undefined,
        artist: artist.trim() || undefined,
        coverUri: cover!.uri,
        coverMimeType: cover!.mimeType,
      }),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["my-submissions"] });
      navigation.replace("SeriesDetail", {
        seriesId: created.id,
        canManagePendingDetails: true,
      });
    },
    onError: (err: unknown) => {
      setError(
        err instanceof Error ? err.message : "Submission failed. Please try again.",
      );
    },
  });

  async function pickCover() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: TITLE_COVER_SPEC.pickerAspect,
      quality: 1,
    });
    if (!result.canceled && result.assets[0]) {
      try {
        setError(null);
        setCover(await prepareCoverImage(result.assets[0], TITLE_COVER_SPEC));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not prepare cover image.");
      }
    }
  }

  function validate(): string | null {
    if (!title.trim()) return "Title is required.";
    if (!genre.trim()) return "Genre is required.";
    if (!cover) return "Cover image is required.";
    return null;
  }

  function handleSubmit() {
    setError(null);
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    mutation.mutate();
  }

  if (!isSignedIn) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <View style={styles.center}>
          <AppText tone="muted">Sign in to submit a series.</AppText>
        </View>
      </SafeAreaView>
    );
  }

  if (!canSubmit) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: spacing.xl }]}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={22} color={colors.text} />
              <AppText>Back</AppText>
            </Pressable>
          </View>
          <Surface variant="accent" radius="xl" style={styles.stateCard}>
            <Ionicons name="lock-closed-outline" size={24} color={colors.accentStrong} />
            <AppText variant="cardTitle">Contributor Access Required</AppText>
            <AppText tone="muted">
              Only Contributors and Admins can submit new series. Earn Cred Points on the
              leaderboard to reach Contributor status.
            </AppText>
          </Surface>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboard}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: spacing.xl + insets.bottom + 180 },
          ]}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={22} color={colors.text} />
              <AppText>Back</AppText>
            </Pressable>
            <AppText variant="screenTitle">Submit a Title</AppText>
            <AppText tone="muted">
              Add a new manhwa, manga, or manhua to the Toon Ranks catalogue for admin
              review.
            </AppText>
          </View>

          {error ? (
            <Surface variant="default" radius="md" style={styles.errorCard}>
              <Ionicons name="alert-circle-outline" size={16} color={colors.danger} />
              <AppText tone="danger" style={styles.errorText}>
                {error}
              </AppText>
            </Surface>
          ) : null}

          {/* Cover image */}
          <Surface variant="raised" radius="xl" style={styles.section}>
            <AppText variant="label" tone="muted">
              Cover Image *
            </AppText>
            <Pressable onPress={pickCover} style={styles.coverPicker}>
              {cover ? (
                <Image source={{ uri: cover.uri }} style={styles.coverPreview} />
              ) : (
                <View style={styles.coverPlaceholder}>
                  <Ionicons name="image-outline" size={32} color={colors.textSubtle} />
                  <AppText tone="subtle">Tap to choose cover</AppText>
                  <AppText tone="subtle" style={styles.coverHint}>
                    Exports 600x900 under 800KB
                  </AppText>
                </View>
              )}
            </Pressable>
            {cover ? (
              <View style={styles.coverStatus}>
                <Pressable onPress={pickCover} style={styles.changePhoto}>
                  <Ionicons
                    name="swap-horizontal-outline"
                    size={15}
                    color={colors.accentStrong}
                  />
                  <AppText tone="accent" style={styles.changePhotoText}>
                    Change photo
                  </AppText>
                </Pressable>
                <AppText tone="muted" align="center" style={styles.coverHint}>
                  Ready: {cover.width}x{cover.height}, {cover.sizeKB}KB
                </AppText>
              </View>
            ) : null}
          </Surface>

          {/* Title */}
          <Surface variant="raised" radius="xl" style={styles.section}>
            <AppText variant="label" tone="muted">
              Title *
            </AppText>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Official title"
              placeholderTextColor={colors.textSubtle}
              style={styles.input}
              autoCapitalize="words"
              maxLength={200}
            />
          </Surface>

          {/* Type */}
          <Surface variant="raised" radius="xl" style={styles.section}>
            <AppText variant="label" tone="muted">
              Type *
            </AppText>
            <View style={styles.pills}>
              {SERIES_TYPES.map((t) => (
                <Pressable
                  key={t.value}
                  onPress={() => setType(t.value)}
                  style={[styles.pill, type === t.value && styles.pillActive]}
                >
                  <AppText
                    tone={type === t.value ? "accent" : "muted"}
                    variant="label"
                    style={styles.pillText}
                  >
                    {t.label}
                  </AppText>
                </Pressable>
              ))}
            </View>
          </Surface>

          {/* Genre */}
          <Surface variant="raised" radius="xl" style={styles.section}>
            <AppText variant="label" tone="muted">
              Genre *
            </AppText>
            <TextInput
              value={genre}
              onChangeText={setGenre}
              placeholder="e.g. Action, Romance, Fantasy"
              placeholderTextColor={colors.textSubtle}
              style={styles.input}
              autoCapitalize="words"
              maxLength={100}
            />
          </Surface>

          {/* Author / Artist */}
          <Surface variant="raised" radius="xl" style={styles.section}>
            <AppText variant="label" tone="muted">
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
            <AppText variant="label" tone="muted" style={styles.labelGap}>
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
          </Surface>

          <AppButton
            label={mutation.isPending ? "Submitting…" : "Submit for Review"}
            variant="primary"
            disabled={mutation.isPending}
            onPress={handleSubmit}
            iconLeft={
              mutation.isPending ? (
                <ActivityIndicator size="small" color={colors.text} />
              ) : (
                <Ionicons name="cloud-upload-outline" size={16} color={colors.text} />
              )
            }
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function getStyles() {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.background,
    },
    keyboard: {
      flex: 1,
    },
    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    content: {
      padding: spacing.md,
      paddingTop: spacing.lg,
      paddingBottom: spacing.xl,
      gap: spacing.md,
    },
    header: {
      gap: spacing.xs,
    },
    backBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
      marginBottom: spacing.xs,
    },
    errorCard: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.sm,
      borderColor: colors.danger,
    },
    errorText: {
      flex: 1,
    },
    section: {
      gap: spacing.sm,
    },
    coverPicker: {
      alignSelf: "center",
      width: 140,
      aspectRatio: 2 / 3,
      borderRadius: radii.lg,
      overflow: "hidden",
    },
    coverPreview: {
      width: "100%",
      height: "100%",
    },
    coverPlaceholder: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.xs,
      backgroundColor: colors.accentSoft,
      borderWidth: 1.5,
      borderStyle: "dashed",
      borderColor: colors.accentBorder,
      borderRadius: radii.lg,
      padding: spacing.md,
    },
    coverHint: {
      fontSize: 11,
    },
    changePhoto: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.xs,
    },
    coverStatus: {
      gap: spacing.xs,
    },
    changePhotoText: {
      fontSize: 13,
    },
    input: {
      color: colors.text,
      fontSize: 15,
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderSoft,
    },
    pills: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    pill: {
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
    pillText: {
      textTransform: "none",
      letterSpacing: 0,
    },
    labelGap: {
      marginTop: spacing.xs,
    },
    stateCard: {
      alignItems: "center",
      gap: spacing.sm,
    },
  });
}
