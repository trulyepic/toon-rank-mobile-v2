import Ionicons from "@expo/vector-icons/Ionicons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, Modal, Pressable, StyleSheet, TextInput, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useState } from "react";

import { createReadingList, getMyReadingLists } from "../api/readingLists";
import { useAuth } from "../auth/AuthContext";
import {
  AccountRequiredCard,
  AppButton,
  AppText,
  EmptyState,
  ErrorState,
  LoadingState,
  ScreenShell,
  SectionHeader,
  Surface,
} from "../components";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { colors, radii, spacing } from "../theme/tokens";

type ReadingListsNavigation = NativeStackNavigationProp<RootStackParamList>;

export function ReadingListsScreen() {
  const navigation = useNavigation<ReadingListsNavigation>();
  const queryClient = useQueryClient();
  const { isSignedIn, status } = useAuth();
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [newListName, setNewListName] = useState("");
  const listsQuery = useQuery({
    queryKey: ["reading-lists", "me"],
    queryFn: getMyReadingLists,
    enabled: isSignedIn,
  });
  const createMutation = useMutation({
    mutationFn: () => createReadingList({ name: newListName.trim() }),
    onSuccess: (list) => {
      setCreateModalVisible(false);
      setNewListName("");
      void queryClient.invalidateQueries({ queryKey: ["reading-lists", "me"] });
      navigation.navigate("ReadingListDetail", {
        listId: list.id,
        listName: list.name,
      });
    },
    onError: (error) => {
      Alert.alert(
        "List not created",
        error instanceof Error ? error.message : "Try again in a moment.",
      );
    },
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
                  ? `${listsQuery.data.length} ${listsQuery.data.length === 1 ? "list" : "lists"} · ${totalItems} saved ${totalItems === 1 ? "title" : "titles"}`
                  : "Loading the same saved list data used on the web."}
              </AppText>
            </View>
          </Surface>

          <AppButton
            label="Create list"
            selected
            iconLeft={<Ionicons name="add" size={17} color={colors.text} />}
            onPress={() => setCreateModalVisible(true)}
          />

          {listsQuery.isLoading ? (
            <LoadingState message="Loading reading lists..." />
          ) : null}

          {listsQuery.isError ? (
            <ErrorState message="Reading lists could not be loaded. Try again in a moment." />
          ) : null}

          {listsQuery.data && listsQuery.data.length === 0 ? (
            <EmptyState
              title="No lists yet"
              message="Create your first reading list from the website for now, then manage saved titles here."
            />
          ) : null}

          {listsQuery.data && listsQuery.data.length > 0 ? (
            <View style={styles.section}>
              <SectionHeader title="Your lists" />
              <View style={styles.stack}>
                {listsQuery.data.map((list) => (
                  <Pressable
                    key={list.id}
                    onPress={() =>
                      navigation.navigate("ReadingListDetail", {
                        listId: list.id,
                        listName: list.name,
                      })
                    }
                  >
                    <Surface variant="raised" radius="xl" style={styles.row}>
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
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color={colors.textMuted}
                      />
                    </Surface>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}
        </>
      ) : null}

      <Modal transparent visible={createModalVisible} animationType="fade">
        <View style={styles.modalBackdrop}>
          <Surface radius="xl" style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <AppText variant="sectionTitle">Create list</AppText>
              <Pressable onPress={() => setCreateModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>
            <AppText tone="muted">
              Toon Ranks currently allows up to two reading lists per non-admin account.
            </AppText>
            <TextInput
              value={newListName}
              onChangeText={setNewListName}
              placeholder="List name"
              placeholderTextColor={colors.textSubtle}
              style={styles.input}
            />
            <View style={styles.modalActions}>
              <AppButton
                label="Cancel"
                variant="ghost"
                onPress={() => setCreateModalVisible(false)}
              />
              <AppButton
                label={createMutation.isPending ? "Creating..." : "Create"}
                selected
                disabled={!newListName.trim() || createMutation.isPending}
                onPress={() => createMutation.mutate()}
              />
            </View>
          </Surface>
        </View>
      </Modal>
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
  modalBackdrop: {
    flex: 1,
    justifyContent: "center",
    padding: spacing.lg,
    backgroundColor: "rgba(0,0,0,0.62)",
  },
  modalCard: {
    gap: spacing.md,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  input: {
    minHeight: 54,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    color: colors.text,
    backgroundColor: colors.backgroundSoft,
    fontSize: 16,
    fontWeight: "700",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
});
