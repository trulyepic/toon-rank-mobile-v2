import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  addReadingListItem,
  createReadingList,
  getMyReadingLists,
} from "../api/readingLists";
import { useAuth } from "../auth/AuthContext";
import { colors, radii, spacing } from "../theme/tokens";
import { AppButton } from "./AppButton";
import { AppText } from "./AppText";
import { LoadingState } from "./StateMessage";
import { Surface } from "./Surface";

type Props = {
  seriesId: number;
  visible: boolean;
  onClose: () => void;
};

/**
 * Reusable "Save to list" bottom-sheet modal. Loads the signed-in user's
 * reading lists, lets them save the given series into a list (with an optional
 * left-off chapter), create a new list inline, and shows which lists already
 * contain the series. Used from Series Detail, Home cards, and Search cards.
 */
export function SaveToListSheet({ seriesId, visible, onClose }: Props) {
  const styles = getStyles();
  const queryClient = useQueryClient();
  const { isSignedIn } = useAuth();
  const scrollRef = useRef<ScrollView>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [leftOffChapter, setLeftOffChapter] = useState("");
  const [newListName, setNewListName] = useState("");

  useEffect(() => {
    const onShow = Keyboard.addListener("keyboardDidShow", (e) => {
      setKeyboardHeight(e.endCoordinates.height);
      scrollRef.current?.scrollToEnd({ animated: true });
    });
    const onHide = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardHeight(0);
    });
    return () => {
      onShow.remove();
      onHide.remove();
    };
  }, []);

  const readingListsQuery = useQuery({
    queryKey: ["reading-lists", "me"],
    queryFn: getMyReadingLists,
    enabled: isSignedIn && visible,
  });

  const saveMutation = useMutation({
    mutationFn: (listId: number) =>
      addReadingListItem(listId, {
        series_id: seriesId,
        left_off_chapter: leftOffChapter.trim() || null,
      }),
    onSuccess: () => {
      setLeftOffChapter("");
      setNewListName("");
      void queryClient.invalidateQueries({ queryKey: ["reading-lists", "me"] });
      onClose();
      Alert.alert("Saved", "Title added to your reading list.");
    },
    onError: (error) => {
      Alert.alert(
        "Title not saved",
        error instanceof Error ? error.message : "Try again in a moment.",
      );
    },
  });

  const createListMutation = useMutation({
    mutationFn: () => createReadingList({ name: newListName.trim() }),
    onSuccess: (list) => {
      void queryClient.invalidateQueries({ queryKey: ["reading-lists", "me"] });
      saveMutation.mutate(list.id);
    },
    onError: (error) => {
      Alert.alert(
        "List not created",
        error instanceof Error ? error.message : "Try again in a moment.",
      );
    },
  });

  function handleClose() {
    setNewListName("");
    onClose();
  }

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.modalBackdrop}>
        <Surface radius="xl" style={styles.saveModal}>
          <View style={styles.saveModalHeader}>
            <AppText variant="sectionTitle">Save to list</AppText>
            <Pressable onPress={handleClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView
            ref={scrollRef}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.saveModalScroll,
              keyboardHeight > 0 ? { paddingBottom: keyboardHeight } : null,
            ]}
          >
            <AppText tone="muted">
              Pick a list below or create a new one. You can also note where you left off.
            </AppText>
            <TextInput
              value={leftOffChapter}
              onChangeText={setLeftOffChapter}
              placeholder="Left-off chapter, optional"
              placeholderTextColor={colors.textSubtle}
              style={styles.input}
            />

            {readingListsQuery.isLoading ? (
              <LoadingState message="Loading lists..." />
            ) : null}

            {readingListsQuery.data && readingListsQuery.data.length > 0 ? (
              <View style={styles.saveListStack}>
                {readingListsQuery.data.map((list) => {
                  const alreadySaved = list.items.some(
                    (item) => item.series_id === seriesId,
                  );
                  return (
                    <Pressable
                      key={list.id}
                      disabled={saveMutation.isPending || alreadySaved}
                      onPress={() => saveMutation.mutate(list.id)}
                    >
                      <Surface
                        variant={alreadySaved ? "accent" : "raised"}
                        radius="lg"
                        style={[
                          styles.saveListRow,
                          alreadySaved ? styles.saveListRowSaved : null,
                        ]}
                      >
                        <Ionicons
                          name={list.is_public ? "earth-outline" : "lock-closed-outline"}
                          size={18}
                          color={colors.accentStrong}
                        />
                        <View style={styles.saveListText}>
                          <AppText variant="cardTitle">{list.name}</AppText>
                          <AppText tone="muted">
                            {alreadySaved
                              ? "Already in this list"
                              : `${list.items.length} saved ${list.items.length === 1 ? "title" : "titles"}`}
                          </AppText>
                        </View>
                        <Ionicons
                          name={alreadySaved ? "bookmark" : "bookmark-outline"}
                          size={22}
                          color={alreadySaved ? colors.success : colors.accentStrong}
                        />
                      </Surface>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}

            {!readingListsQuery.isLoading &&
            readingListsQuery.data &&
            readingListsQuery.data.length === 0 ? (
              <AppText tone="muted">
                You have no lists yet. Create your first one below.
              </AppText>
            ) : null}

            <View style={styles.createListSection}>
              <AppText variant="label" tone="muted">
                New list
              </AppText>
              <View style={styles.createListRow}>
                <TextInput
                  value={newListName}
                  onChangeText={setNewListName}
                  placeholder="List name"
                  placeholderTextColor={colors.textSubtle}
                  style={[styles.input, styles.createListInput]}
                />
                <AppButton
                  label={createListMutation.isPending ? "Creating…" : "Create & save"}
                  size="sm"
                  selected
                  disabled={
                    !newListName.trim() ||
                    createListMutation.isPending ||
                    saveMutation.isPending
                  }
                  onPress={() => createListMutation.mutate()}
                />
              </View>
              {createListMutation.isError ? (
                <AppText tone="danger">Could not create list. Try again.</AppText>
              ) : null}
            </View>
          </ScrollView>
        </Surface>
      </View>
    </Modal>
  );
}

function getStyles() {
  return StyleSheet.create({
    modalBackdrop: {
      flex: 1,
      justifyContent: "center",
      padding: spacing.lg,
      backgroundColor: "rgba(0,0,0,0.62)",
    },
    saveModal: {
      maxHeight: "82%",
      gap: spacing.sm,
    },
    saveModalScroll: {
      gap: spacing.md,
      paddingBottom: spacing.sm,
    },
    saveModalHeader: {
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
    saveListStack: {
      gap: spacing.sm,
    },
    createListSection: {
      gap: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.borderSoft,
      paddingTop: spacing.md,
      marginTop: spacing.xs,
    },
    createListRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    createListInput: {
      flex: 1,
      minHeight: 44,
    },
    saveListRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
    },
    saveListRowSaved: {
      opacity: 0.82,
    },
    saveListText: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
  });
}
