import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useRef, useState } from "react";

import {
  createForumThread,
  getForumCategories,
  updateForumThread,
  uploadForumMedia,
} from "../api/forum";
import { useAuth } from "../auth/AuthContext";
import {
  AccountRequiredCard,
  AppButton,
  AppText,
  ForumComposerToolbar,
  ForumMentionSuggestions,
  HintScrollRow,
  InsertReadingListSheet,
  ScreenShell,
  Surface,
} from "../components";
import { buildReadingListRef } from "../utils/forumReadingListRef";
import type { ReadingList } from "../types/readingList";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { colors, radii, spacing } from "../theme/tokens";
import {
  extractForumSeriesIds,
  getActiveForumMention,
  insertForumMention,
  insertUserMention,
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
import {
  EMPTY_THREAD_DRAFT,
  isThreadDraftEmpty,
  newThreadDraftKey,
} from "../utils/forumDrafts";
import { useForumDraft } from "../hooks/useForumDraft";

type CreateThreadNavigation = NativeStackNavigationProp<RootStackParamList>;

const MAX_TITLE_LENGTH = 200;
const MAX_BODY_LENGTH = 2000;

export function ForumCreateThreadScreen() {
  const styles = getStyles();
  const navigation = useNavigation<CreateThreadNavigation>();
  const queryClient = useQueryClient();
  const { isSignedIn, status } = useAuth();
  const bodyInputRef = useRef<TextInput | null>(null);
  const { draft, setDraft, clearDraft } = useForumDraft(
    newThreadDraftKey(),
    EMPTY_THREAD_DRAFT,
    isThreadDraftEmpty,
  );
  const { title, body, categoryId: selectedCategoryId } = draft;
  const setTitle = (value: string) => setDraft((d) => ({ ...d, title: value }));
  const setBody = (updater: string | ((prev: string) => string)) =>
    setDraft((d) => ({
      ...d,
      body: typeof updater === "function" ? updater(d.body) : updater,
    }));
  const setSelectedCategoryId = (value: number | null) =>
    setDraft((d) => ({ ...d, categoryId: value }));
  const [bodySelection, setBodySelection] = useState<ForumTextSelection>({
    start: 0,
    end: 0,
  });
  const [attachment, setAttachment] = useState<ForumMediaAttachment | null>(null);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [insertListVisible, setInsertListVisible] = useState(false);
  // Formatting tools hidden by default (most first posts are plain text);
  // the "Aa" toggle reveals them — same pattern as the thread reply composer.
  const [formattingVisible, setFormattingVisible] = useState(false);
  const activeMention = getActiveForumMention(body);

  const categoriesQuery = useQuery({
    queryKey: ["forum", "categories"],
    queryFn: getForumCategories,
    staleTime: 5 * 60 * 1000,
    enabled: isSignedIn,
  });
  const categories = categoriesQuery.data ?? [];

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
        category_id: selectedCategoryId,
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
      clearDraft();
      setAttachment(null);
      void queryClient.invalidateQueries({ queryKey: ["forum", "threads"] });
      void queryClient.invalidateQueries({ queryKey: ["forum", "categories"] });
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

  const handleInsertReadingList = (list: ReadingList) => {
    const ref = buildReadingListRef(list.name, list.share_token);
    setBody((current) => {
      const { start, end } = bodySelection;
      const next = (current.slice(0, start) + ref + current.slice(end)).slice(
        0,
        MAX_BODY_LENGTH,
      );
      const caret = Math.min(start + ref.length, next.length);
      setBodySelection({ start: caret, end: caret });
      return next;
    });
    setInsertListVisible(false);
    setValidationMessage(null);
    requestAnimationFrame(() => bodyInputRef.current?.focus());
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
            {categories.length > 0 ? (
              <View style={styles.categorySection}>
                <AppText variant="caption">Category (optional)</AppText>
                <HintScrollRow contentContainerStyle={styles.pillStrip}>
                  {categories.map((cat) => {
                    const active = selectedCategoryId === cat.id;
                    return (
                      <Pressable
                        key={cat.id}
                        onPress={() => setSelectedCategoryId(active ? null : cat.id)}
                        style={[styles.pill, active ? styles.pillActive : null]}
                      >
                        <AppText
                          variant="caption"
                          style={active ? styles.pillTextActive : styles.pillText}
                        >
                          {cat.name}
                        </AppText>
                      </Pressable>
                    );
                  })}
                </HintScrollRow>
              </View>
            ) : null}

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
            <ForumMentionSuggestions
              mention={activeMention}
              onSelect={(selection) => {
                setBody((current) => {
                  if (!activeMention) return current;
                  const next = (
                    selection.type === "series"
                      ? insertForumMention(current, activeMention, selection.series)
                      : insertUserMention(current, activeMention, selection.username)
                  ).slice(0, MAX_BODY_LENGTH);
                  setBodySelection({ start: next.length, end: next.length });
                  return next;
                });
                setValidationMessage(null);
              }}
            />
            {formattingVisible ? (
              <ForumComposerToolbar
                disabled={createMutation.isPending}
                onFormat={handleFormatBody}
              />
            ) : null}
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
              <View style={styles.quickActions}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    formattingVisible ? "Hide formatting tools" : "Show formatting tools"
                  }
                  accessibilityState={{ selected: formattingVisible }}
                  disabled={createMutation.isPending}
                  onPress={() => setFormattingVisible((prev) => !prev)}
                  style={({ pressed }) => [
                    styles.quickAction,
                    formattingVisible ? styles.quickActionActive : null,
                    pressed ? styles.pressed : null,
                  ]}
                >
                  <AppText variant="caption" style={styles.quickActionLabel}>
                    Aa
                  </AppText>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Attach image or GIF"
                  disabled={createMutation.isPending}
                  onPress={handlePickAttachment}
                  style={({ pressed }) => [
                    styles.quickAction,
                    pressed ? styles.pressed : null,
                  ]}
                >
                  <Ionicons name="image-outline" size={17} color={colors.text} />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Insert a reading list"
                  disabled={createMutation.isPending}
                  onPress={() => setInsertListVisible(true)}
                  style={({ pressed }) => [
                    styles.quickAction,
                    pressed ? styles.pressed : null,
                  ]}
                >
                  <Ionicons name="bookmark-outline" size={17} color={colors.text} />
                </Pressable>
              </View>
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

      <InsertReadingListSheet
        visible={insertListVisible}
        onClose={() => setInsertListVisible(false)}
        onInsert={handleInsertReadingList}
      />
    </ScreenShell>
  );
}

function getStyles() {
  return StyleSheet.create({
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
      alignItems: "center",
      justifyContent: "flex-end",
      flexWrap: "wrap",
      gap: spacing.sm,
    },
    // Quick actions (Aa / image / list) sit left; Cancel + Create push right.
    quickActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      marginRight: "auto",
    },
    quickAction: {
      minWidth: 38,
      height: 34,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.borderSoft,
      backgroundColor: colors.backgroundSoft,
      paddingHorizontal: spacing.sm,
    },
    quickActionActive: {
      borderColor: colors.accentBorder,
      backgroundColor: colors.accentSoft,
    },
    quickActionLabel: {
      fontWeight: "800",
    },
    categorySection: {
      gap: spacing.xs,
    },
    pillStrip: {
      flexDirection: "row",
      gap: spacing.xs,
      paddingHorizontal: 2,
    },
    pill: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: radii.pill,
      borderWidth: 1,
      borderColor: colors.borderSoft,
      backgroundColor: colors.backgroundSoft,
    },
    pillActive: {
      borderColor: colors.accentBorder,
      backgroundColor: colors.accent,
    },
    pillText: {
      color: colors.textMuted,
    },
    pillTextActive: {
      color: colors.text,
    },
  });
}
