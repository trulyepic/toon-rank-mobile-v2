import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert, Pressable, StyleSheet, TextInput, View } from "react-native";
import { useState } from "react";

import { createForumThread } from "../api/forum";
import { useAuth } from "../auth/AuthContext";
import {
  AccountRequiredCard,
  AppButton,
  AppText,
  ForumMentionSuggestions,
  ScreenShell,
  Surface,
} from "../components";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { colors, radii, spacing } from "../theme/tokens";
import {
  extractForumSeriesIds,
  getActiveForumMention,
  insertForumMention,
} from "../utils/forumMentions";
import { validateForumThreadDraft } from "../utils/forumValidation";

type CreateThreadNavigation = NativeStackNavigationProp<RootStackParamList>;

const MAX_TITLE_LENGTH = 200;
const MAX_BODY_LENGTH = 2000;

export function ForumCreateThreadScreen() {
  const navigation = useNavigation<CreateThreadNavigation>();
  const queryClient = useQueryClient();
  const { isSignedIn, status } = useAuth();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const activeMention = getActiveForumMention(body);

  const createMutation = useMutation({
    mutationFn: () => {
      const draft = validateForumThreadDraft({ title, body });

      if (draft.error) {
        throw new Error(draft.error);
      }

      return createForumThread({
        title: draft.title,
        first_post_markdown: draft.body,
        series_ids: extractForumSeriesIds(draft.body),
      });
    },
    onMutate: () => {
      setValidationMessage(null);
    },
    onSuccess: (thread) => {
      setTitle("");
      setBody("");
      void queryClient.invalidateQueries({ queryKey: ["forum", "threads"] });
      navigation.replace("ForumThread", { threadId: thread.id });
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Thread could not be created.";
      setValidationMessage(message);

      if (!message.includes("Thread title") && !message.includes("Write the first")) {
        Alert.alert("Thread not created", message);
      }
    },
  });

  const titleCount = title.trim().length;
  const bodyCount = body.trim().length;
  const canSubmit =
    isSignedIn &&
    !createMutation.isPending &&
    titleCount >= 3 &&
    titleCount <= MAX_TITLE_LENGTH &&
    bodyCount > 0;

  return (
    <ScreenShell
      title="New thread"
      subtitle="Start a Toon Ranks discussion from the same account you use on the website."
      rightSlot={
        <Pressable
          accessibilityLabel="Back to forum"
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [styles.closeButton, pressed ? styles.pressed : null]}
        >
          <Ionicons name="close" size={22} color={colors.text} />
        </Pressable>
      }
    >
      {status !== "loading" && !isSignedIn ? (
        <AccountRequiredCard
          title="Log in to create threads"
          body="New forum threads use your Toon Ranks avatar, role, and username across both web and mobile."
        />
      ) : null}

      {isSignedIn ? (
        <>
          <Surface variant="accent" radius="hero" style={styles.hero}>
            <View style={styles.heroIcon}>
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={24}
                color={colors.text}
              />
            </View>
            <View style={styles.heroText}>
              <AppText variant="sectionTitle">Start a discussion</AppText>
              <AppText tone="muted">
                Markdown is supported. Series references and image uploads are coming in
                the next forum slices.
              </AppText>
            </View>
          </Surface>

          <Surface radius="xl" style={styles.formCard}>
            <View style={styles.fieldHeader}>
              <AppText variant="caption">Title</AppText>
              <AppText variant="caption" tone="subtle">
                {title.length}/{MAX_TITLE_LENGTH}
              </AppText>
            </View>
            <TextInput
              value={title}
              onChangeText={(value) => {
                setTitle(value.slice(0, MAX_TITLE_LENGTH));
                setValidationMessage(null);
              }}
              placeholder="What do you want to discuss?"
              placeholderTextColor={colors.textSubtle}
              style={styles.titleInput}
            />

            <View style={styles.fieldHeader}>
              <AppText variant="caption">First post</AppText>
              <AppText variant="caption" tone="subtle">
                {body.length}/{MAX_BODY_LENGTH}
              </AppText>
            </View>
            <TextInput
              value={body}
              onChangeText={(value) => {
                setBody(value.slice(0, MAX_BODY_LENGTH));
                setValidationMessage(null);
              }}
              placeholder="Write the opening post..."
              placeholderTextColor={colors.textSubtle}
              multiline
              textAlignVertical="top"
              style={styles.bodyInput}
            />
            <ForumMentionSuggestions
              mention={activeMention}
              onSelect={(series) => {
                setBody((current) =>
                  activeMention
                    ? insertForumMention(current, activeMention, series).slice(
                        0,
                        MAX_BODY_LENGTH,
                      )
                    : current,
                );
                setValidationMessage(null);
              }}
            />

            {validationMessage ? (
              <View style={styles.validationBox}>
                <Ionicons name="alert-circle-outline" size={18} color={colors.danger} />
                <AppText tone="muted" style={styles.validationText}>
                  {validationMessage}
                </AppText>
              </View>
            ) : null}

            <View style={styles.actions}>
              <AppButton
                label="Cancel"
                variant="ghost"
                onPress={() => navigation.goBack()}
              />
              <AppButton
                label={createMutation.isPending ? "Creating..." : "Create thread"}
                selected
                disabled={!canSubmit}
                iconLeft={<Ionicons name="send-outline" size={16} color={colors.text} />}
                onPress={() => createMutation.mutate()}
              />
            </View>
          </Surface>
        </>
      ) : null}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  closeButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  pressed: {
    opacity: 0.84,
    transform: [{ scale: 0.98 }],
  },
  hero: {
    flexDirection: "row",
    gap: spacing.md,
  },
  heroIcon: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.pill,
    backgroundColor: colors.accent,
    borderWidth: 1,
    borderColor: colors.accentBorder,
  },
  heroText: {
    flex: 1,
    gap: spacing.xs,
  },
  formCard: {
    gap: spacing.md,
  },
  fieldHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  titleInput: {
    minHeight: 56,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    color: colors.text,
    backgroundColor: colors.backgroundSoft,
    fontSize: 17,
    fontWeight: "800",
  },
  bodyInput: {
    minHeight: 190,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.text,
    backgroundColor: colors.backgroundSoft,
    fontSize: 16,
    lineHeight: 23,
    fontWeight: "600",
  },
  validationBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: "rgba(235, 106, 90, 0.14)",
    borderWidth: 1,
    borderColor: colors.danger,
  },
  validationText: {
    flex: 1,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
});
