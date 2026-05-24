import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as ImagePicker from "expo-image-picker";
import { useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";

import { reportIssue } from "../api/issues";
import { AppButton, AppText, ScreenShell, Surface } from "../components";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { colors, radii, spacing } from "../theme/tokens";
import type { Issue, IssueType } from "../types/issue";
import { getReportIssueValidationError } from "../utils/issueValidation";

type ReportIssueRoute = RouteProp<RootStackParamList, "ReportIssue">;

type ImageAsset = {
  uri: string;
  mimeType: string;
};

const issueTypes: { label: string; value: IssueType; icon: string }[] = [
  { label: "Bug", value: "BUG", icon: "bug-outline" },
  { label: "Content", value: "CONTENT", icon: "document-text-outline" },
  { label: "Feature", value: "FEATURE", icon: "sparkles-outline" },
  { label: "Other", value: "OTHER", icon: "help-circle-outline" },
];

async function pickScreenshot(): Promise<ImageAsset | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    Alert.alert(
      "Photo access required",
      "Allow Toon Ranks to access your photo library in Settings to attach a screenshot.",
    );
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: "images",
    allowsEditing: false,
    quality: 0.9,
  });

  if (result.canceled || !result.assets.length) return null;

  const asset = result.assets[0];
  return { uri: asset.uri, mimeType: asset.mimeType ?? "image/jpeg" };
}

export function ReportIssueScreen() {
  const route = useRoute<ReportIssueRoute>();
  const initialType = (route.params?.issueType as IssueType | undefined) ?? "BUG";
  const [type, setType] = useState<IssueType>(initialType);
  const [title, setTitle] = useState(route.params?.title ?? "");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [imageAsset, setImageAsset] = useState<ImageAsset | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedIssue, setSubmittedIssue] = useState<Issue | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pageUrl = route.params?.pageUrl ?? "toonranks://mobile/report-issue";
  const validationError = useMemo(
    () => getReportIssueValidationError({ title, description, email }),
    [description, email, title],
  );
  const canSubmit = !validationError && !isSubmitting;

  async function handleSubmit() {
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSubmittedIssue(null);

    try {
      const issue = await reportIssue({
        type,
        title: title.trim(),
        description: description.trim(),
        email: email.trim() || undefined,
        page_url: pageUrl,
        screenshot: imageAsset
          ? {
              uri: imageAsset.uri,
              name: `screenshot.${imageAsset.mimeType.split("/")[1] ?? "jpg"}`,
              type: imageAsset.mimeType,
            }
          : undefined,
      });

      setSubmittedIssue(issue);
      setTitle("");
      setDescription("");
      setEmail("");
      setImageAsset(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit the report.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScreenShell
      title="Report an Issue"
      subtitle="Send a bug, content problem, or suggestion to Toon Ranks."
    >
      {submittedIssue ? (
        <Surface variant="accent" radius="xl" style={styles.feedback}>
          <Ionicons name="checkmark-circle-outline" size={24} color={colors.success} />
          <View style={styles.feedbackText}>
            <AppText variant="cardTitle">Report submitted</AppText>
            <AppText tone="muted">
              Thanks. Issue #{submittedIssue.id} is now in the Toon Ranks issue queue.
            </AppText>
          </View>
        </Surface>
      ) : null}

      {error ? (
        <Surface radius="xl" style={[styles.feedback, styles.errorCard]}>
          <Ionicons name="alert-circle-outline" size={24} color={colors.danger} />
          <View style={styles.feedbackText}>
            <AppText variant="cardTitle">Could not submit</AppText>
            <AppText tone="muted">{error}</AppText>
          </View>
        </Surface>
      ) : null}

      <Surface radius="xl" style={styles.form}>
        <View style={styles.field}>
          <AppText variant="caption" tone="muted">
            Issue type
          </AppText>
          <View style={styles.typeGrid}>
            {issueTypes.map((issueType) => {
              const selected = issueType.value === type;
              return (
                <Pressable
                  key={issueType.value}
                  onPress={() => setType(issueType.value)}
                  style={({ pressed }) => [
                    styles.typeChip,
                    selected ? styles.typeChipSelected : null,
                    pressed ? styles.pressed : null,
                  ]}
                >
                  <Ionicons
                    name={issueType.icon as keyof typeof Ionicons.glyphMap}
                    size={17}
                    color={selected ? colors.text : colors.textMuted}
                  />
                  <AppText variant="caption" tone={selected ? "primary" : "muted"}>
                    {issueType.label}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.field}>
          <View style={styles.labelRow}>
            <AppText variant="caption" tone="muted">
              Summary
            </AppText>
            <AppText variant="caption" tone={title.length > 120 ? "danger" : "subtle"}>
              {title.length}/120
            </AppText>
          </View>
          <TextInput
            autoCapitalize="sentences"
            autoCorrect
            value={title}
            onChangeText={setTitle}
            placeholder="Short summary"
            placeholderTextColor={colors.textSubtle}
            style={styles.input}
            maxLength={140}
          />
        </View>

        <View style={styles.field}>
          <AppText variant="caption" tone="muted">
            Details
          </AppText>
          <TextInput
            autoCapitalize="sentences"
            autoCorrect
            value={description}
            onChangeText={setDescription}
            placeholder="What happened? What were you trying to do?"
            placeholderTextColor={colors.textSubtle}
            style={[styles.input, styles.textArea]}
            multiline
            textAlignVertical="top"
          />
        </View>

        <View style={styles.field}>
          <AppText variant="caption" tone="muted">
            Email optional
          </AppText>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            placeholder="Only if you want follow-up"
            placeholderTextColor={colors.textSubtle}
            style={styles.input}
          />
        </View>

        <View style={styles.field}>
          <AppText variant="caption" tone="muted">
            Screenshot optional
          </AppText>
          {imageAsset ? (
            <View style={styles.attachmentRow}>
              <Image
                source={{ uri: imageAsset.uri }}
                style={styles.thumbnail}
                resizeMode="cover"
                accessibilityLabel="Attached screenshot"
              />
              <View style={styles.attachmentMeta}>
                <AppText variant="caption">Screenshot attached</AppText>
                <AppText tone="muted" variant="caption">
                  Tap remove to clear.
                </AppText>
              </View>
              <Pressable
                onPress={() => setImageAsset(null)}
                style={({ pressed }) => [
                  styles.removeBtn,
                  pressed ? styles.pressed : null,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Remove screenshot"
              >
                <Ionicons name="close-circle" size={22} color={colors.danger} />
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={async () => {
                const asset = await pickScreenshot();
                if (asset) setImageAsset(asset);
              }}
              style={({ pressed }) => [styles.attachBtn, pressed ? styles.pressed : null]}
              accessibilityRole="button"
              accessibilityLabel="Attach a screenshot"
            >
              <Ionicons name="image-outline" size={20} color={colors.accentStrong} />
              <AppText variant="caption" tone="accent">
                Attach a screenshot
              </AppText>
            </Pressable>
          )}
        </View>

        <AppButton
          label={
            isSubmitting
              ? imageAsset
                ? "Uploading & submitting…"
                : "Submitting…"
              : "Submit report"
          }
          disabled={!canSubmit}
          onPress={handleSubmit}
          iconLeft={
            isSubmitting ? (
              <ActivityIndicator size="small" color={colors.text} />
            ) : (
              <Ionicons name="send-outline" size={15} color={colors.text} />
            )
          }
        />
      </Surface>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  feedback: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  feedbackText: {
    flex: 1,
    gap: spacing.xs,
  },
  errorCard: {
    backgroundColor: "rgba(235, 106, 90, 0.12)",
    borderColor: colors.danger,
  },
  form: {
    gap: spacing.md,
  },
  field: {
    gap: spacing.xs,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  typeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  typeChip: {
    minHeight: 44,
    minWidth: "46%",
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.backgroundSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  typeChipSelected: {
    borderColor: colors.accentBorder,
    backgroundColor: colors.accentSoft,
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.99 }],
  },
  input: {
    minHeight: 50,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.backgroundSoft,
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
  },
  textArea: {
    minHeight: 140,
  },
  attachBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: 50,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.accent,
    borderStyle: "dashed",
    backgroundColor: colors.accentSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  attachmentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.backgroundSoft,
    padding: spacing.sm,
  },
  thumbnail: {
    width: 52,
    height: 52,
    borderRadius: radii.md,
    backgroundColor: colors.backgroundSoft,
  },
  attachmentMeta: {
    flex: 1,
    gap: 2,
  },
  removeBtn: {
    padding: spacing.xs,
  },
});
