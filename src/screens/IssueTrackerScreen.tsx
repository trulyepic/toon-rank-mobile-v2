import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Alert, Modal, Pressable, StyleSheet, TextInput, View } from "react-native";

import { deleteIssue, listIssues, updateIssueStatus } from "../api/issues";
import { useAuth } from "../auth/AuthContext";
import {
  AppButton,
  AppText,
  Chip,
  ChipButton,
  EmptyState,
  ErrorState,
  LoadingState,
  ScreenShell,
  SectionHeader,
  Surface,
} from "../components";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { colors, radii, spacing } from "../theme/tokens";
import type { Issue, IssueStatus, IssueType } from "../types/issue";
import { openInAppBrowser } from "../utils/externalLinks";
import { canTriageIssues } from "../utils/issueAdmin";

const PAGE_SIZE = 50;

const statusOptions: { label: string; value: IssueStatus }[] = [
  { label: "Open", value: "OPEN" },
  { label: "In Progress", value: "IN_PROGRESS" },
  { label: "Resolved", value: "FIXED" },
  { label: "Won't Fix", value: "WONT_FIX" },
];

const typeOptions: { label: string; value: IssueType }[] = [
  { label: "Bug", value: "BUG" },
  { label: "Feature", value: "FEATURE" },
  { label: "Content", value: "CONTENT" },
  { label: "Other", value: "OTHER" },
];

const statusMeta: Record<
  IssueStatus,
  { label: string; color: string; backgroundColor: string; borderColor: string }
> = {
  OPEN: {
    label: "Open",
    color: colors.warningText,
    backgroundColor: colors.warningSurface,
    borderColor: colors.warningBorder,
  },
  IN_PROGRESS: {
    label: "In Progress",
    color: colors.accentStrong,
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  FIXED: {
    label: "Resolved",
    color: "#7be3b0",
    backgroundColor: "rgba(14, 167, 106, 0.15)",
    borderColor: colors.success,
  },
  WONT_FIX: {
    label: "Won't Fix",
    color: colors.textMuted,
    backgroundColor: colors.backgroundSoft,
    borderColor: colors.borderSoft,
  },
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function statusCount(issues: Issue[], status: IssueStatus) {
  return issues.filter((issue) => issue.status === status).length;
}

function SummaryTile({
  label,
  count,
  selected,
  onPress,
}: {
  label: string;
  count: number;
  selected: boolean;
  onPress: () => void;
}) {
  const styles = getStyles();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.summaryTilePressable,
        pressed ? styles.pressed : null,
      ]}
    >
      <Surface
        variant={selected ? "accent" : "raised"}
        radius="lg"
        style={[styles.summaryTile, selected ? styles.summaryTileSelected : null]}
      >
        <AppText variant="sectionTitle">{count}</AppText>
        <AppText variant="caption" tone="muted">
          {label}
        </AppText>
      </Surface>
    </Pressable>
  );
}

function StatusBadge({ status }: { status: IssueStatus }) {
  const styles = getStyles();
  const meta = statusMeta[status];
  return (
    <View
      style={[
        styles.statusBadge,
        { backgroundColor: meta.backgroundColor, borderColor: meta.borderColor },
      ]}
    >
      <AppText variant="caption" style={{ color: meta.color }}>
        {meta.label}
      </AppText>
    </View>
  );
}

function IssueCard({
  issue,
  isAdmin,
  onChangeStatus,
  onDelete,
  isUpdating,
  isDeleting,
}: {
  issue: Issue;
  isAdmin: boolean;
  onChangeStatus: (issue: Issue, status: IssueStatus) => void;
  onDelete: (issue: Issue) => void;
  isUpdating: boolean;
  isDeleting: boolean;
}) {
  const styles = getStyles();
  const [statusPickerVisible, setStatusPickerVisible] = useState(false);

  return (
    <Surface variant="raised" radius="xl" style={styles.issueCard}>
      <View style={styles.issueHeader}>
        <View style={styles.issueTitleWrap}>
          <AppText variant="cardTitle">{issue.title}</AppText>
          <AppText tone="muted" numberOfLines={2}>
            {issue.description}
          </AppText>
        </View>
        <StatusBadge status={issue.status} />
      </View>

      <View style={styles.metaRow}>
        <Chip label={issue.type.toLowerCase()} tone="accent" />
        <AppText variant="caption" tone="subtle">
          Reported {formatDate(issue.created_at)}
        </AppText>
      </View>

      {issue.screenshot_url ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Open screenshot for ${issue.title}`}
          onPress={() => openInAppBrowser(issue.screenshot_url as string)}
          style={({ pressed }) => [
            styles.screenshotButton,
            pressed ? styles.pressed : null,
          ]}
        >
          <Ionicons name="camera-outline" size={16} color={colors.accentStrong} />
          <AppText variant="caption" tone="accent">
            View screenshot
          </AppText>
        </Pressable>
      ) : null}

      {isAdmin ? (
        <View style={styles.adminRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Change status for ${issue.title}`}
            disabled={isUpdating || isDeleting}
            onPress={() => setStatusPickerVisible(true)}
            style={({ pressed }) => [
              styles.adminButton,
              pressed ? styles.pressed : null,
              isUpdating || isDeleting ? styles.adminButtonDisabled : null,
            ]}
          >
            <Ionicons name="swap-horizontal-outline" size={15} color={colors.text} />
            <AppText variant="caption">
              {isUpdating ? "Updating…" : "Change status"}
            </AppText>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Delete ${issue.title}`}
            disabled={isUpdating || isDeleting}
            onPress={() => onDelete(issue)}
            style={({ pressed }) => [
              styles.adminButton,
              styles.adminDeleteButton,
              pressed ? styles.pressed : null,
              isUpdating || isDeleting ? styles.adminButtonDisabled : null,
            ]}
          >
            <Ionicons name="trash-outline" size={15} color={colors.danger} />
            <AppText variant="caption" tone="danger">
              {isDeleting ? "Deleting…" : "Delete"}
            </AppText>
          </Pressable>
        </View>
      ) : null}

      <Modal transparent visible={statusPickerVisible} animationType="fade">
        <Pressable
          style={styles.pickerBackdrop}
          onPress={() => setStatusPickerVisible(false)}
        />
        <View style={styles.pickerSheet}>
          <AppText variant="cardTitle" style={styles.pickerTitle}>
            Set status
          </AppText>
          {statusOptions.map((option) => {
            const active = option.value === issue.status;
            return (
              <Pressable
                key={option.value}
                onPress={() => {
                  setStatusPickerVisible(false);
                  if (!active) onChangeStatus(issue, option.value);
                }}
                style={({ pressed }) => [
                  styles.pickerRow,
                  pressed ? styles.pressed : null,
                ]}
              >
                <AppText tone={active ? "accent" : "primary"}>{option.label}</AppText>
                {active ? (
                  <Ionicons name="checkmark" size={18} color={colors.accentStrong} />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </Modal>
    </Surface>
  );
}

export function IssueTrackerScreen() {
  const styles = getStyles();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = canTriageIssues(user?.role);
  const [statusFilter, setStatusFilter] = useState<IssueStatus | undefined>();
  const [typeFilter, setTypeFilter] = useState<IssueType | undefined>();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: IssueStatus }) =>
      updateIssueStatus(id, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["issues"] });
    },
    onError: (error) => {
      Alert.alert(
        "Status not updated",
        error instanceof Error ? error.message : "Try again in a moment.",
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteIssue(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["issues"] });
    },
    onError: (error) => {
      Alert.alert(
        "Issue not deleted",
        error instanceof Error ? error.message : "Try again in a moment.",
      );
    },
  });

  const handleChangeStatus = (issue: Issue, status: IssueStatus) => {
    statusMutation.mutate({ id: issue.id, status });
  };

  const handleDelete = (issue: Issue) => {
    Alert.alert("Delete issue?", `"${issue.title}" will be permanently removed.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteMutation.mutate(issue.id),
      },
    ]);
  };

  const issuesQuery = useInfiniteQuery({
    queryKey: ["issues", debouncedSearch, statusFilter, typeFilter],
    queryFn: ({ pageParam }) =>
      listIssues({
        q: debouncedSearch || undefined,
        status: statusFilter,
        type: typeFilter,
        page: pageParam,
        page_size: PAGE_SIZE,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === PAGE_SIZE ? allPages.length + 1 : undefined,
  });

  const issues = useMemo(
    () => issuesQuery.data?.pages.flatMap((page) => page) ?? [],
    [issuesQuery.data?.pages],
  );

  const isInitialLoading = issuesQuery.isLoading;
  const isRefreshing = issuesQuery.isFetching && !issuesQuery.isFetchingNextPage;

  return (
    <ScreenShell
      title="Site Updates & Known Issues"
      subtitle="Browse public bug reports, content fixes, and feature requests."
    >
      <Surface variant="accent" radius="xl" style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons name="list-outline" size={24} color={colors.text} />
        </View>
        <View style={styles.heroText}>
          <AppText variant="cardTitle">Issue tracker</AppText>
          <AppText tone="muted">
            Check whether a problem is already known before sending a new report.
          </AppText>
        </View>
        <AppButton
          label="Report"
          size="sm"
          onPress={() => navigation.navigate("ReportIssue")}
          iconLeft={<Ionicons name="bug-outline" size={15} color={colors.text} />}
        />
      </Surface>

      <View style={styles.section}>
        <SectionHeader title="Status summary" />
        <View style={styles.summaryGrid}>
          {statusOptions.map((option) => (
            <SummaryTile
              key={option.value}
              label={option.label}
              count={statusCount(issues, option.value)}
              selected={statusFilter === option.value}
              onPress={() =>
                setStatusFilter((current) =>
                  current === option.value ? undefined : option.value,
                )
              }
            />
          ))}
        </View>
      </View>

      <Surface radius="xl" style={styles.filters}>
        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={18} color={colors.textMuted} />
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            value={search}
            onChangeText={setSearch}
            placeholder="Search issues"
            placeholderTextColor={colors.textSubtle}
            style={styles.searchInput}
          />
          {search ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear issue search"
              onPress={() => setSearch("")}
              hitSlop={8}
            >
              <Ionicons name="close-circle" size={18} color={colors.textSubtle} />
            </Pressable>
          ) : null}
        </View>

        <View style={styles.filterGroup}>
          <AppText variant="caption" tone="subtle">
            Status
          </AppText>
          <View style={styles.chipWrap}>
            <ChipButton
              label="All"
              selected={!statusFilter}
              onPress={() => setStatusFilter(undefined)}
            />
            {statusOptions.map((option) => (
              <ChipButton
                key={option.value}
                label={option.label}
                selected={statusFilter === option.value}
                onPress={() => setStatusFilter(option.value)}
              />
            ))}
          </View>
        </View>

        <View style={styles.filterGroup}>
          <AppText variant="caption" tone="subtle">
            Type
          </AppText>
          <View style={styles.chipWrap}>
            <ChipButton
              label="All"
              selected={!typeFilter}
              onPress={() => setTypeFilter(undefined)}
            />
            {typeOptions.map((option) => (
              <ChipButton
                key={option.value}
                label={option.label}
                selected={typeFilter === option.value}
                onPress={() => setTypeFilter(option.value)}
              />
            ))}
          </View>
        </View>
      </Surface>

      <View style={styles.section}>
        <SectionHeader
          title="Reports"
          body={
            isRefreshing
              ? "Refreshing..."
              : `${issues.length} ${issues.length === 1 ? "issue" : "issues"} shown`
          }
        />

        {isInitialLoading ? <LoadingState message="Loading issues..." /> : null}
        {issuesQuery.isError ? (
          <ErrorState message="Issues could not load. Check your connection and try again." />
        ) : null}
        {!isInitialLoading && !issuesQuery.isError && issues.length === 0 ? (
          <EmptyState message="No issues match these filters yet." />
        ) : null}

        <View style={styles.issueStack}>
          {issues.map((issue) => (
            <IssueCard
              key={issue.id}
              issue={issue}
              isAdmin={isAdmin}
              onChangeStatus={handleChangeStatus}
              onDelete={handleDelete}
              isUpdating={
                statusMutation.isPending && statusMutation.variables?.id === issue.id
              }
              isDeleting={
                deleteMutation.isPending && deleteMutation.variables === issue.id
              }
            />
          ))}
        </View>

        {issuesQuery.hasNextPage ? (
          <AppButton
            label={issuesQuery.isFetchingNextPage ? "Loading..." : "Load more"}
            disabled={issuesQuery.isFetchingNextPage}
            onPress={() => issuesQuery.fetchNextPage()}
            iconLeft={
              <Ionicons name="chevron-down-outline" size={15} color={colors.text} />
            }
          />
        ) : null}
      </View>
    </ScreenShell>
  );
}

function getStyles() {
  return StyleSheet.create({
    hero: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
    },
    heroIcon: {
      width: 54,
      height: 54,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: radii.pill,
      backgroundColor: colors.accent,
      borderWidth: 1,
      borderColor: colors.accentBorder,
    },
    heroText: {
      flex: 1,
      minWidth: 0,
      gap: spacing.xs,
    },
    section: {
      gap: spacing.sm,
    },
    summaryGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
    },
    summaryTilePressable: {
      width: "48%",
      flexGrow: 1,
    },
    summaryTile: {
      gap: spacing.xs,
    },
    summaryTileSelected: {
      borderColor: colors.accentBorder,
    },
    filters: {
      gap: spacing.md,
    },
    searchWrap: {
      minHeight: 48,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.borderSoft,
      backgroundColor: colors.backgroundSoft,
      paddingHorizontal: spacing.md,
    },
    searchInput: {
      flex: 1,
      minWidth: 0,
      color: colors.text,
      fontSize: 16,
      paddingVertical: spacing.sm,
    },
    filterGroup: {
      gap: spacing.xs,
    },
    chipWrap: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
    },
    issueStack: {
      gap: spacing.sm,
    },
    issueCard: {
      gap: spacing.md,
    },
    issueHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.sm,
    },
    issueTitleWrap: {
      flex: 1,
      minWidth: 0,
      gap: spacing.xs,
    },
    statusBadge: {
      borderRadius: radii.pill,
      borderWidth: 1,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      gap: spacing.sm,
    },
    screenshotButton: {
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      borderRadius: radii.pill,
      borderWidth: 1,
      borderColor: colors.borderSoft,
      backgroundColor: colors.backgroundSoft,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    pressed: {
      opacity: 0.88,
      transform: [{ scale: 0.99 }],
    },
    adminRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.borderSoft,
      paddingTop: spacing.sm,
    },
    adminButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      borderRadius: radii.pill,
      borderWidth: 1,
      borderColor: colors.borderSoft,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
    },
    adminDeleteButton: {
      borderColor: colors.danger,
    },
    adminButtonDisabled: {
      opacity: 0.5,
    },
    pickerBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
    },
    pickerSheet: {
      position: "absolute",
      left: spacing.lg,
      right: spacing.lg,
      top: "35%",
      gap: spacing.xs,
      borderRadius: radii.xl,
      borderWidth: 1,
      borderColor: colors.borderSoft,
      backgroundColor: colors.surfaceRaised,
      padding: spacing.md,
    },
    pickerTitle: {
      marginBottom: spacing.xs,
    },
    pickerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.md,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.sm,
      borderRadius: radii.md,
    },
  });
}
