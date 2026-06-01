import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useState } from "react";

import { deleteForumReport, getForumReports, reviewForumReport } from "../api/forum";
import { useAuth } from "../auth/AuthContext";
import {
  AccountRequiredCard,
  AppButton,
  AppText,
  ChipButton,
  EmptyState,
  ErrorState,
  LoadingState,
  ScreenShell,
  Surface,
} from "../components";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { colors, radii, spacing } from "../theme/tokens";
import type { ForumReport } from "../types/forum";

type StatusFilter = "OPEN" | "REVIEWED" | "DISMISSED" | undefined;
type AdminReportNav = NativeStackNavigationProp<RootStackParamList>;

const STATUS_TABS: { label: string; value: StatusFilter }[] = [
  { label: "Open", value: "OPEN" },
  { label: "Reviewed", value: "REVIEWED" },
  { label: "Dismissed", value: "DISMISSED" },
  { label: "All", value: undefined },
];

function statusColor(status: ForumReport["status"]) {
  if (status === "OPEN") return colors.danger;
  if (status === "REVIEWED") return colors.success;
  return colors.textMuted;
}

function ReportCard({
  report,
  onReview,
  onDismiss,
  onDelete,
  isActioning,
}: {
  report: ForumReport;
  onReview: () => void;
  onDismiss: () => void;
  onDelete: () => void;
  isActioning: boolean;
}) {
  const styles = getStyles();
  const navigation = useNavigation<AdminReportNav>();

  return (
    <Surface variant="raised" radius="xl" style={styles.card}>
      {/* Status + meta */}
      <View style={styles.cardHeader}>
        <View style={[styles.statusBadge, { borderColor: statusColor(report.status) }]}>
          <AppText variant="caption" style={{ color: statusColor(report.status) }}>
            {report.status}
          </AppText>
        </View>
        <AppText variant="caption" tone="muted">
          {report.reporter_username ? `@${report.reporter_username}` : "Anonymous"} ·{" "}
          {new Date(report.created_at).toLocaleDateString()}
        </AppText>
      </View>

      {/* Thread link */}
      {report.thread_title ? (
        <Pressable
          onPress={() =>
            navigation.navigate("ForumThread", {
              threadId: report.thread_id,
              postId: report.post_id,
            })
          }
          style={({ pressed }) => (pressed ? styles.pressed : null)}
        >
          <AppText variant="caption" style={styles.threadLink} numberOfLines={1}>
            🔗 {report.thread_title}
          </AppText>
        </Pressable>
      ) : null}

      {/* Post excerpt */}
      {report.post_excerpt ? (
        <Surface variant="default" radius="lg" style={styles.excerpt}>
          <AppText tone="muted" numberOfLines={3}>
            {report.post_excerpt}
          </AppText>
        </Surface>
      ) : null}

      {/* Reason */}
      {report.reason ? (
        <AppText variant="caption" tone="muted">
          Reason: {report.reason}
        </AppText>
      ) : null}

      {/* Reviewed info */}
      {report.reviewed_by_username ? (
        <AppText variant="caption" tone="subtle">
          {report.status === "REVIEWED" ? "Reviewed" : "Dismissed"} by @
          {report.reviewed_by_username}
          {report.reviewed_at
            ? ` · ${new Date(report.reviewed_at).toLocaleDateString()}`
            : ""}
        </AppText>
      ) : null}

      {/* Actions */}
      <View style={styles.cardActions}>
        {report.status === "OPEN" ? (
          <>
            <AppButton
              label="✓ Reviewed"
              size="sm"
              selected
              disabled={isActioning}
              onPress={onReview}
            />
            <AppButton
              label="Dismiss"
              size="sm"
              variant="secondary"
              disabled={isActioning}
              onPress={onDismiss}
            />
          </>
        ) : null}
        <AppButton
          label="Delete"
          size="sm"
          variant="ghost"
          disabled={isActioning}
          onPress={onDelete}
        />
      </View>
    </Surface>
  );
}

export function AdminReportQueueScreen() {
  const styles = getStyles();
  const { isSignedIn, user } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === "ADMIN";
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("OPEN");

  const reportsQuery = useInfiniteQuery({
    queryKey: ["forum", "reports", statusFilter],
    queryFn: ({ pageParam }) => getForumReports(pageParam as number, statusFilter),
    getNextPageParam: (lastPage) => (lastPage.has_next ? lastPage.page + 1 : undefined),
    initialPageParam: 1,
    enabled: isAdmin,
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: "REVIEWED" | "DISMISSED" }) =>
      reviewForumReport(id, status),
    onSuccess: (_result, { id, status }) => {
      queryClient.setQueryData<{ pages: { items: ForumReport[] }[] }>(
        ["forum", "reports", statusFilter],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              items: page.items.map((r) => (r.id === id ? { ...r, status } : r)),
            })),
          };
        },
      );
    },
    onError: () => Alert.alert("Action failed", "Could not update report. Try again."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteForumReport(id),
    onSuccess: (_result, id) => {
      queryClient.setQueryData<{ pages: { items: ForumReport[] }[] }>(
        ["forum", "reports", statusFilter],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              items: page.items.filter((r) => r.id !== id),
            })),
          };
        },
      );
    },
    onError: () => Alert.alert("Delete failed", "Could not delete report. Try again."),
  });

  const confirmDelete = (report: ForumReport) => {
    Alert.alert("Delete report?", "This permanently removes the report record.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteMutation.mutate(report.id),
      },
    ]);
  };

  const reports = reportsQuery.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <ScreenShell title="Report Queue" subtitle="Review and action flagged forum posts.">
      {!isSignedIn || !isAdmin ? (
        <AccountRequiredCard
          title="Admin access required"
          body="Only admins can view the report queue."
        />
      ) : (
        <>
          {/* Filter tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabRow}
          >
            {STATUS_TABS.map((tab) => (
              <ChipButton
                key={String(tab.value)}
                label={tab.label}
                selected={statusFilter === tab.value}
                onPress={() => setStatusFilter(tab.value)}
              />
            ))}
          </ScrollView>

          {/* Content */}
          {reportsQuery.isLoading ? (
            <LoadingState message="Loading reports…" />
          ) : reportsQuery.isError ? (
            <ErrorState message="Could not load reports. Try again." />
          ) : reports.length === 0 ? (
            <EmptyState
              title="No reports"
              message={
                statusFilter
                  ? `No ${statusFilter.toLowerCase()} reports.`
                  : "No reports found."
              }
            />
          ) : (
            <>
              <View style={styles.list}>
                {reports.map((report) => (
                  <ReportCard
                    key={report.id}
                    report={report}
                    isActioning={
                      (reviewMutation.isPending &&
                        reviewMutation.variables?.id === report.id) ||
                      (deleteMutation.isPending && deleteMutation.variables === report.id)
                    }
                    onReview={() =>
                      reviewMutation.mutate({ id: report.id, status: "REVIEWED" })
                    }
                    onDismiss={() =>
                      reviewMutation.mutate({ id: report.id, status: "DISMISSED" })
                    }
                    onDelete={() => confirmDelete(report)}
                  />
                ))}
              </View>
              {reportsQuery.hasNextPage ? (
                <AppButton
                  label={reportsQuery.isFetchingNextPage ? "Loading…" : "Load more"}
                  variant="secondary"
                  disabled={reportsQuery.isFetchingNextPage}
                  onPress={() => void reportsQuery.fetchNextPage()}
                />
              ) : null}
            </>
          )}
        </>
      )}
    </ScreenShell>
  );
}

function getStyles() {
  return StyleSheet.create({
    tabRow: {
      flexDirection: "row",
      gap: spacing.sm,
      paddingVertical: spacing.xs,
    },
    list: {
      gap: spacing.sm,
    },
    card: {
      gap: spacing.sm,
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      flexWrap: "wrap",
    },
    statusBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: radii.pill,
      borderWidth: 1,
    },
    threadLink: {
      color: colors.accentStrong,
      textDecorationLine: "underline",
    },
    excerpt: {
      padding: spacing.sm,
    },
    cardActions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs,
    },
    pressed: {
      opacity: 0.75,
    },
  });
}
