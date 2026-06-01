import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useRef, useState } from "react";

import { createForumThread, updateForumThread, uploadForumMedia } from "../api/forum";
import { useAuth } from "../auth/AuthContext";
import {
  AccountRequiredCard,
  AppButton,
  AppText,
  ForumComposerToolbar,
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
import {
  appendForumMediaMarkdown,
  pickForumMediaAttachment,
  type ForumMediaAttachment,
} from "../utils/forumMedia";
import {
  applyForumFormat,
  type ForumFormatAction,
  type ForumTextSelection,
} from "../utils/forumComposerFormatting";
import { validateForumThreadDraft } from "../utils/forumValidation";

type CreateThreadNavigation = NativeStackNavigationProp<RootStackParamList>;

const MAX_TITLE_LENGTH = 200;
const MAX_BODY_LENGTH = 2000;

export function ForumCreateThreadScreen() {
  const navigation = useNavigation<CreateThreadNavigation>();
  const queryClient = useQueryClient();
  const { isSignedIn, status } = useAuth();
  const bodyInputRef = useRef<TextInput | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [bodySelection, setBodySelection] = useState<ForumTextSelection>({
    start: 0,
    end: 0,
  });
  const [attachment, setAttachment] = useState<ForumMediaAttachment | null>(null);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const activeMention = getActiveForumMention(body);

  const createMutation = useMutation({
    mutationFn: async () => {
      const draft = validateForumThreadDraft({ title, body });

      if (draft.error) {
        throw new Error(draft.error);
      }

      const createdThread = await createForumThread({
        title: draft.title,
        first_post_markdown: draft.body,
        series_ids: extractForumSeriesIds(draft.body),
      });

      if (!attachment) {
        return createdThread;
      }

      const media = await uploadForumMedia(createdThread.id, attachment);
      await updateForumThread(createdThread.id, {
        title: draft.title,
        first_post_markdown: appendForumMediaMarkdown(draft.body, media.url),
        series_ids: extractForumSeriesIds(
          appendForumMediaMarkdown(draft.body, media.url),
        ),
      });

      return createdThread;
    },
    onMutate: () => {
      setValidationMessage(null);
    },
    onSuccess: (thread) => {
      setTitle("");
      setBody("");
      setAttachment(null);
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

  const handlePickAttachment = async () => {
    const picked = await pickForumMediaAttachment();
    if (picked) setAttachment(picked);
  };

  const handleFormatBody = (action: ForumFormatAction) => {
    const formatted = applyForumFormat(body, bodySelection, action);
    const nextBody = formatted.text.slice(0, MAX_BODY_LENGTH);
    setBody(nextBody);
    setBodySelection({
      start: Math.min(formatted.selection.start, nextBody.length),
      end: Math.min(formatted.selection.end, nextBody.length),
    });
    setValidationMessage(null);
    requestAnimationFrame(() => bodyInputRef.current?.focus());
  };

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
                Markdown, series references, and one image or GIF attachment are
                supported.
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
            <ForumComposerToolbar
              disabled={createMutation.isPending}
              onFormat={handleFormatBody}
              onPickAttachment={handlePickAttachment}
            />
            <TextInput
              ref={bodyInputRef}
              value={body}
              onChangeText={(value) => {
                setBody(value.slice(0, MAX_BODY_LENGTH));
                setValidationMessage(null);
              }}
              onSelectionChange={(event) => setBodySelection(event.nativeEvent.selection)}
              selection={bodySelection}
              placeholder="Write the opening post..."
              placeholderTextColor={colors.textSubtle}
              multiline
              textAlignVertical="top"
              style={styles.bodyInput}
            />
            <ForumMentionSuggestions
              mention={activeMention}
              onSelect={(series) => {
                setBody((current) => {
                  const next = activeMention
                    ? insertForumMention(current, activeMention, series).slice(
                        0,
                        MAX_BODY_LENGTH,
                      )
                    : current;
                  setBodySelection({ start: next.length, end: next.length });
                  return next;
                });
                setValidationMessage(null);
              }}
            />

            {attachment ? (
              <View style={styles.attachmentBlock}>
                <View style={styles.attachmentPreview}>
                  <Image
                    source={{ uri: attachment.uri }}
                    style={styles.attachmentImage}
                  />
                  <View style={styles.attachmentInfo}>
                    <AppText variant="caption" numberOfLines={1}>
                      {attachment.name}
                    </AppText>
                    <AppText variant="caption" tone="subtle">
                      {attachment.type}
                    </AppText>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Remove attachment"
                    onPress={() => setAttachment(null)}
                    style={({ pressed }) => [
                      styles.removeAttachmentButton,
                      pressed ? styles.pressed : null,
                    ]}
                  >
                    <Ionicons name="close" size={18} color={colors.text} />
                  </Pressable>
                </View>
              </View>
            ) : null}

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
                label={
                  createMutation.isPending
                    ? attachment
                      ? "Uploading..."
                      : "Creating..."
                    : "Create thread"
                }
                selected
                disabled={!canSubmit}
                iconLeft={
                  createMutation.isPending ? (
                    <ActivityIndicator size="small" color={colors.text} />
                  ) : (
                    <Ionicons name="send-outline" size={16} color={colors.text} />
                  )
                }
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
  attachmentBlock: {
    gap: spacing.sm,
  },
  attachmentPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radii.lg,
    backgroundColor: colors.backgroundSoft,
  },
  attachmentImage: {
    width: 58,
    height: 58,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceRaised,
  },
  attachmentInfo: {
    flex: 1,
    minWidth: 0,
  },
  removeAttachmentButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.borderSoft,
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
