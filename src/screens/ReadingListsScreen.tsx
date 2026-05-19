import Ionicons from "@expo/vector-icons/Ionicons";
import { useQuery } from "@tanstack/react-query";
import { StyleSheet, View } from "react-native";

import { getMyReadingLists } from "../api/readingLists";
import { useAuth } from "../auth/AuthContext";
import {
  AccountRequiredCard,
  AppText,
  EmptyState,
  ErrorState,
  LoadingState,
  ScreenShell,
  SectionHeader,
  Surface,
} from "../components";
import { colors, radii, spacing } from "../theme/tokens";

const listStates = [
  {
    icon: "library-outline" as const,
    title: "Reading",
    body: "Titles you are actively following will appear here.",
  },
  {
    icon: "time-outline" as const,
    title: "Plan to read",
    body: "Keep future reads close without mixing them into current progress.",
  },
  {
    icon: "checkmark-done-outline" as const,
    title: "Completed",
    body: "Finished titles and chapter notes will sync from your web lists.",
  },
];

export function ReadingListsScreen() {
  const { isSignedIn, status } = useAuth();
  const listsQuery = useQuery({
    queryKey: ["reading-lists", "me"],
    queryFn: getMyReadingLists,
    enabled: isSignedIn,
  });

  const totalItems =
    listsQuery.data?.reduce((count, list) => count + list.items.length, 0) ?? 0;

  return (
    <ScreenShell
      title="Reading Lists"
      subtitle="Saved titles and chapter progress will mirror your Toon Ranks website account."
    >
      {status === "loading" ? <LoadingState message="Checking account..." /> : null}

      {!isSignedIn && status !== "loading" ? (
        <AccountRequiredCard
          title="Log in to see your library"
          body="Reading lists are shared with your Toon Ranks website account, so your saved titles stay in one place."
        />
      ) : null}

      {isSignedIn ? (
        <>
          <Surface variant="accent" radius="hero" style={styles.hero}>
            <View style={styles.heroIcon}>
              <Ionicons name="bookmark-outline" size={24} color={colors.text} />
            </View>
            <View style={styles.heroText}>
              <AppText variant="sectionTitle">Your library</AppText>
              <AppText tone="muted">
                {listsQuery.data
                  ? `${listsQuery.data.length} lists and ${totalItems} saved titles are ready to browse once list details are expanded.`
                  : "Loading the same saved list data used on the web."}
              </AppText>
            </View>
          </Surface>

          {listsQuery.isLoading ? (
            <LoadingState message="Loading reading lists..." />
          ) : null}

          {listsQuery.isError ? (
            <ErrorState message="Reading lists could not be loaded. Try again in a moment." />
          ) : null}

          {listsQuery.data && listsQuery.data.length === 0 ? (
            <EmptyState
              title="No lists yet"
              message="Create a reading list on the website now, and it will appear here after mobile editing is connected."
            />
          ) : null}

          {listsQuery.data && listsQuery.data.length > 0 ? (
            <View style={styles.section}>
              <SectionHeader title="Your lists" />
              <View style={styles.stack}>
                {listsQuery.data.map((list) => (
                  <Surface key={list.id} variant="raised" radius="xl" style={styles.row}>
                    <View style={styles.rowIcon}>
                      <Ionicons
                        name={list.is_public ? "earth-outline" : "lock-closed-outline"}
                        size={19}
                        color={colors.accentStrong}
                      />
                    </View>
                    <View style={styles.rowText}>
                      <AppText variant="cardTitle">{list.name}</AppText>
                      <AppText tone="muted">
                        {list.items.length} saved{" "}
                        {list.items.length === 1 ? "title" : "titles"} /{" "}
                        {list.is_public ? "Public" : "Private"}
                      </AppText>
                    </View>
                  </Surface>
                ))}
              </View>
            </View>
          ) : null}
        </>
      ) : null}

      <View style={styles.section}>
        <SectionHeader title="List sections" />
        <View style={styles.stack}>
          {listStates.map((item) => (
            <Surface key={item.title} variant="raised" radius="xl" style={styles.row}>
              <View style={styles.rowIcon}>
                <Ionicons name={item.icon} size={19} color={colors.accentStrong} />
              </View>
              <View style={styles.rowText}>
                <AppText variant="cardTitle">{item.title}</AppText>
                <AppText tone="muted">{item.body}</AppText>
              </View>
            </Surface>
          ))}
        </View>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
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
  section: {
    gap: spacing.sm,
  },
  stack: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: "row",
    gap: spacing.md,
  },
  rowIcon: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.md,
    backgroundColor: colors.backgroundSoft,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  rowText: {
    flex: 1,
    gap: spacing.xs,
  },
});
