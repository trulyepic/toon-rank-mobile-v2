import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useQuery } from "@tanstack/react-query";

import { getMyReadingLists } from "../api/readingLists";
import { useAuth } from "../auth/AuthContext";
import { colors, spacing } from "../theme/tokens";
import type { ReadingList } from "../types/readingList";
import { AppText } from "./AppText";
import { LoadingState } from "./StateMessage";
import { Surface } from "./Surface";

type Props = {
  visible: boolean;
  onClose: () => void;
  onInsert: (list: ReadingList) => void;
};

/**
 * Picker that lets a user drop a link to one of their public reading lists into
 * a forum post. Only public lists with a share token can be inserted (matching
 * the web composer); private lists are not shareable.
 */
export function InsertReadingListSheet({ visible, onClose, onInsert }: Props) {
  const styles = getStyles();
  const { isSignedIn } = useAuth();

  const listsQuery = useQuery({
    queryKey: ["reading-lists", "me"],
    queryFn: getMyReadingLists,
    enabled: isSignedIn && visible,
  });

  const shareableLists = (listsQuery.data ?? []).filter(
    (list) => list.is_public && !!list.share_token,
  );

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Surface radius="xl" style={styles.sheet}>
          <View style={styles.header}>
            <AppText variant="sectionTitle">Insert a reading list</AppText>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scroll}
          >
            <AppText tone="muted">
              Only public lists can be shared in a post. Make a list public from Reading
              Lists to share it here.
            </AppText>

            {listsQuery.isLoading ? <LoadingState message="Loading lists..." /> : null}

            {!listsQuery.isLoading && shareableLists.length === 0 ? (
              <AppText tone="muted">You have no public reading lists yet.</AppText>
            ) : null}

            {shareableLists.map((list) => (
              <Pressable
                key={list.id}
                onPress={() => onInsert(list)}
                accessibilityRole="button"
                accessibilityLabel={`Insert ${list.name}`}
              >
                <Surface variant="raised" radius="lg" style={styles.row}>
                  <Ionicons name="earth-outline" size={18} color={colors.accentStrong} />
                  <View style={styles.rowText}>
                    <AppText variant="cardTitle">{list.name}</AppText>
                    <AppText tone="muted">
                      {list.items.length} saved{" "}
                      {list.items.length === 1 ? "title" : "titles"}
                    </AppText>
                  </View>
                  <Ionicons name="add-outline" size={22} color={colors.accentStrong} />
                </Surface>
              </Pressable>
            ))}
          </ScrollView>
        </Surface>
      </View>
    </Modal>
  );
}

function getStyles() {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      justifyContent: "center",
      padding: spacing.lg,
      backgroundColor: "rgba(0,0,0,0.62)",
    },
    sheet: {
      maxHeight: "82%",
      gap: spacing.sm,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.md,
    },
    scroll: {
      gap: spacing.sm,
      paddingBottom: spacing.sm,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
    },
    rowText: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
  });
}
