import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";

import { getMySubmissions } from "../api/series";
import { AppButton, AppText, Chip, CoverImage, Surface } from "../components";
import { useAuth } from "../auth/AuthContext";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { colors, radii, spacing } from "../theme/tokens";
import type { SeriesSubmission, SubmissionStatus } from "../types/series";

type Nav = NativeStackNavigationProp<RootStackParamList>;

function statusLabel(s: SubmissionStatus): string {
  if (s === "APPROVED") return "Approved";
  if (s === "REJECTED") return "Rejected";
  return "Awaiting approval";
}

function statusTone(s: SubmissionStatus): "accent" | "warning" | "neutral" {
  if (s === "APPROVED") return "accent";
  if (s === "REJECTED") return "neutral";
  return "warning";
}

function SubmissionCard({ item }: { item: SeriesSubmission }) {
  const styles = getStyles();
  const navigation = useNavigation<Nav>();
  const isPending = String(item.approval_status).toUpperCase().startsWith("PENDING");

  return (
    <Pressable
      onPress={() =>
        navigation.navigate("SeriesDetail", {
          seriesId: item.id,
          canManagePendingDetails: isPending,
        })
      }
    >
      <Surface variant="raised" radius="xl" style={styles.card}>
        <View style={styles.cardRow}>
          {item.cover_url ? (
            <CoverImage
              uri={item.cover_url}
              style={[styles.cover, { width: 56, height: 80 }]}
            />
          ) : (
            <View style={styles.coverPlaceholder}>
              <Ionicons name="image-outline" size={20} color={colors.textSubtle} />
            </View>
          )}
          <View style={styles.cardMeta}>
            <AppText variant="cardTitle" numberOfLines={2}>
              {item.title}
            </AppText>
            <View style={styles.chips}>
              <Chip label={item.type} tone="neutral" />
              <Chip
                label={statusLabel(item.approval_status)}
                tone={statusTone(item.approval_status)}
              />
            </View>
            {!item.detail_ready && isPending ? (
              <View style={styles.detailPrompt}>
                <Ionicons
                  name="information-circle-outline"
                  size={14}
                  color={colors.warning}
                />
                <AppText tone="muted" style={styles.detailText}>
                  Open the title page to add title details and secondary cover before
                  admin review.
                </AppText>
              </View>
            ) : null}
            {item.detail_ready ? (
              <View style={styles.readyRow}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={14}
                  color={colors.success}
                />
                <AppText tone="muted" style={styles.detailText}>
                  Ready for review
                </AppText>
              </View>
            ) : null}
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} />
        </View>
      </Surface>
    </Pressable>
  );
}

export function MySubmissionsScreen() {
  const styles = getStyles();
  const navigation = useNavigation<Nav>();
  const { isSignedIn, user } = useAuth();

  const canSubmit =
    isSignedIn && (user?.role === "CONTRIBUTOR" || user?.role === "ADMIN");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["my-submissions"],
    queryFn: getMySubmissions,
    enabled: canSubmit,
  });

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
            <AppText>Back</AppText>
          </Pressable>
          <AppText variant="screenTitle">My Submissions</AppText>
          <AppText tone="muted">
            Titles you have submitted for ranking consideration.
          </AppText>
        </View>

        <AppButton
          label="Submit a Title"
          variant="primary"
          onPress={() => navigation.navigate("SubmitSeries")}
          iconLeft={<Ionicons name="add-circle-outline" size={16} color={colors.text} />}
        />

        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.accentStrong} />
            <AppText tone="muted">Loading submissions…</AppText>
          </View>
        ) : isError ? (
          <Surface variant="default" radius="xl" style={styles.stateCard}>
            <Ionicons name="alert-circle-outline" size={20} color={colors.danger} />
            <AppText tone="muted">Failed to load submissions.</AppText>
            <AppButton label="Retry" onPress={() => refetch()} />
          </Surface>
        ) : !data || data.length === 0 ? (
          <Surface variant="raised" radius="xl" style={styles.stateCard}>
            <Ionicons name="documents-outline" size={28} color={colors.textSubtle} />
            <AppText variant="cardTitle">No submissions yet</AppText>
            <AppText tone="muted">
              Tap Submit a Title to add a new manhwa, manga, or manhua for review.
            </AppText>
          </Surface>
        ) : (
          <View style={styles.list}>
            {data.map((item) => (
              <SubmissionCard key={item.id} item={item} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function getStyles() {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.background,
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
    center: {
      alignItems: "center",
      gap: spacing.sm,
      paddingVertical: spacing.xl,
    },
    stateCard: {
      alignItems: "center",
      gap: spacing.sm,
    },
    list: {
      gap: spacing.sm,
    },
    card: {
      gap: 0,
    },
    cardRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
    },
    cover: {
      borderRadius: radii.sm,
      overflow: "hidden",
    },
    coverPlaceholder: {
      width: 56,
      height: 80,
      borderRadius: radii.sm,
      backgroundColor: colors.accentSoft,
      borderWidth: 1,
      borderColor: colors.accentBorder,
      alignItems: "center",
      justifyContent: "center",
    },
    cardMeta: {
      flex: 1,
      gap: spacing.xs,
    },
    chips: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs,
    },
    detailPrompt: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.xs,
    },
    readyRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
    },
    detailText: {
      flex: 1,
      fontSize: 12,
    },
  });
}
