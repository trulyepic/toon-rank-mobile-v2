import { useEffect, useState } from "react";
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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { saveSeriesDetail } from "../api/series";
import { colors, radii, spacing } from "../theme/tokens";
import { DETAIL_COVER_SPEC, prepareCoverImage } from "../utils/coverImage";
import { AppButton } from "./AppButton";
import { AppText } from "./AppText";
import { Surface } from "./Surface";

type Props = {
  seriesId: number;
  visible: boolean;
  initialSynopsis?: string;
  initialCoverUrl?: string | null;
  hasExistingDetails?: boolean;
  onClose: () => void;
  onSaved: () => void;
};

export function EditSeriesDetailModal({
  seriesId,
  visible,
  initialSynopsis = "",
  initialCoverUrl,
  hasExistingDetails = false,
  onClose,
  onSaved,
}: Props) {
  const styles = getStyles();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { height: screenHeight } = useWindowDimensions();
  const maxScrollHeight = screenHeight * 0.64;

  const [details, setDetails] = useState(initialSynopsis);
  const [cover, setCover] = useState<{
    uri: string;
    mimeType: string;
    width: number;
    height: number;
    sizeKB: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setDetails(initialSynopsis);
    setCover(null);
    setError(null);
  }, [initialSynopsis, visible]);

  const mutation = useMutation({
    mutationFn: () =>
      saveSeriesDetail({
        seriesId,
        synopsis: details.trim(),
        coverUri: cover?.uri,
        coverMimeType: cover?.mimeType,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["series-detail", seriesId] });
      void queryClient.invalidateQueries({ queryKey: ["my-submissions"] });
      onSaved();
      onClose();
    },
    onError: (err: unknown) => {
      setError(
        err instanceof Error
          ? err.message
          : "Could not save title details. Please try again.",
      );
    },
  });

  async function pickCover() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: DETAIL_COVER_SPEC.pickerAspect,
      quality: 1,
    });
    if (!result.canceled && result.assets[0]) {
      try {
        setError(null);
        setCover(await prepareCoverImage(result.assets[0], DETAIL_COVER_SPEC));
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Could not prepare detail cover image.",
        );
      }
    }
  }

  function handleSave() {
    setError(null);
    if (!details.trim()) {
      setError("Title details are required.");
      return;
    }
    if (!hasExistingDetails && !initialCoverUrl && !cover) {
      setError("Choose a wide detail cover before saving.");
      return;
    }
    mutation.mutate();
  }

  const previewUri = cover?.uri || initialCoverUrl || null;

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Surface
          radius="xl"
          style={[styles.sheet, { paddingBottom: spacing.md + insets.bottom }]}
        >
          <View style={styles.header}>
            <View style={styles.headerText}>
              <AppText variant="sectionTitle">
                {hasExistingDetails ? "Edit title details" : "Add title details"}
              </AppText>
              <AppText tone="muted">
                Markdown is supported. Use the wide cover for the detail page banner.
              </AppText>
            </View>
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
              Title details
            </AppText>
            <TextInput
              value={details}
              onChangeText={setDetails}
              placeholder="Summary, brief review, notes, or anything useful..."
              placeholderTextColor={colors.textSubtle}
              style={[styles.input, styles.textArea]}
              multiline
              textAlignVertical="top"
            />

            <AppText variant="label" tone="muted" style={styles.fieldGap}>
              Detail cover
            </AppText>
            <View style={styles.coverPanel}>
              {previewUri ? (
                <Image source={{ uri: previewUri }} style={styles.coverPreview} />
              ) : (
                <View style={styles.coverPlaceholder}>
                  <Ionicons name="image-outline" size={28} color={colors.textSubtle} />
                  <AppText tone="subtle" align="center">
                    3:2 wide cover required
                  </AppText>
                </View>
              )}
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
                  {cover
                    ? "New detail cover selected"
                    : previewUri
                      ? "Replace detail cover"
                      : "Choose detail cover"}
                </AppText>
              </Pressable>
              {cover ? (
                <AppText tone="muted" variant="caption">
                  Ready: {cover.width}x{cover.height}, {cover.sizeKB}KB
                </AppText>
              ) : null}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <AppButton label="Cancel" variant="ghost" onPress={onClose} />
            <AppButton
              label={mutation.isPending ? "Saving..." : "Save details"}
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
      maxHeight: "94%",
      gap: spacing.md,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
    },
    header: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: spacing.md,
    },
    headerText: {
      flex: 1,
      gap: spacing.xs,
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
      paddingVertical: spacing.sm,
      color: colors.text,
      backgroundColor: colors.backgroundSoft,
      fontSize: 15,
    },
    textArea: {
      minHeight: 180,
      lineHeight: 22,
    },
    coverPanel: {
      gap: spacing.sm,
    },
    coverPreview: {
      width: "100%",
      aspectRatio: 3 / 2,
      borderRadius: radii.lg,
      backgroundColor: colors.surfaceRaised,
    },
    coverPlaceholder: {
      width: "100%",
      aspectRatio: 3 / 2,
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.xs,
      borderRadius: radii.lg,
      borderWidth: 1.5,
      borderStyle: "dashed",
      borderColor: colors.accentBorder,
      backgroundColor: colors.accentSoft,
      padding: spacing.md,
    },
    replaceBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      alignSelf: "flex-start",
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
