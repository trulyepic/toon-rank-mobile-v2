import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  type AlertButton,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import {
  AccountRequiredCard,
  AppButton,
  AppText,
  CoverImage,
  EmptyState,
  ScreenShell,
  SectionHeader,
  Surface,
  UserIdentity,
} from "../components";
import { useAuth } from "../auth/AuthContext";
import {
  resetMyAvatar,
  setAvatarPreset,
  updateMyUsername,
  uploadAvatar,
} from "../api/auth";
import { searchSeries } from "../api/series";
import {
  getMyFavorites,
  getPublicProfile,
  removeMyFavorite,
  replaceMyFavorites,
} from "../api/users";
import type { AvatarPreset, FavoriteSeries } from "../types/account";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { colors, radii, spacing } from "../theme/tokens";
import { avatarPresetColors, normalizeAvatarPreset } from "../utils/avatar";
import { SeriesRatingsSection } from "./SeriesRatingsSection";

const PRESETS: AvatarPreset[] = ["blue", "emerald", "amber"];
const MAX_FAVORITES = 15;

const PRESET_LABELS: Record<AvatarPreset, string> = {
  blue: "Blue",
  emerald: "Emerald",
  amber: "Amber",
};

async function pickAvatarImage() {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    Alert.alert(
      "Photo access required",
      "Allow Toon Ranks to access your photo library in Settings to set a profile photo.",
    );
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: "images",
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.85,
  });

  if (result.canceled || !result.assets.length) return null;

  return result.assets[0];
}

function FavoriteCard({
  favorite,
  removing,
  onOpen,
  onRemove,
}: {
  favorite: FavoriteSeries;
  removing: boolean;
  onOpen: () => void;
  onRemove: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${favorite.title}`}
      onPress={onOpen}
      style={({ pressed }) => [styles.favoriteCard, pressed ? styles.pressed : null]}
    >
      <CoverImage uri={favorite.cover_url} style={styles.favoriteCover} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Remove ${favorite.title} from favorites`}
        onPress={(event) => {
          event.stopPropagation();
          onRemove();
        }}
        disabled={removing}
        style={styles.removeFavoriteButton}
      >
        {removing ? (
          <ActivityIndicator size="small" color={colors.text} />
        ) : (
          <Ionicons name="close" size={16} color={colors.text} />
        )}
      </Pressable>
      <View style={styles.favoriteText}>
        <AppText variant="caption" numberOfLines={2}>
          {favorite.title}
        </AppText>
        {favorite.type ? (
          <AppText variant="caption" tone="subtle">
            {favorite.type}
          </AppText>
        ) : null}
      </View>
    </Pressable>
  );
}

export function ProfileScreen() {
  const { isSignedIn, user, updateUser } = useAuth();
  const queryClient = useQueryClient();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const currentPreset = normalizeAvatarPreset(user?.avatar_preset);
  const [favoriteSearchOpen, setFavoriteSearchOpen] = useState(false);
  const [favoriteQuery, setFavoriteQuery] = useState("");
  const [debouncedFavoriteQuery, setDebouncedFavoriteQuery] = useState("");
  const [usernameModalOpen, setUsernameModalOpen] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const publicProfileQuery = useQuery({
    queryKey: ["users", "public-profile", user?.username],
    queryFn: () => getPublicProfile(user?.username ?? ""),
    enabled: isSignedIn && Boolean(user?.username),
    staleTime: 60 * 1000,
  });
  const publicProfile = publicProfileQuery.data;
  const favoritesQuery = useQuery({
    queryKey: ["users", "me", "favorites"],
    queryFn: getMyFavorites,
    enabled: isSignedIn,
  });
  const favorites = favoritesQuery.data ?? [];
  const favoriteIds = new Set(favorites.map((favorite) => favorite.series_id));
  const favoriteSearchQuery = useQuery({
    queryKey: ["series-search", "favorite-picker", debouncedFavoriteQuery],
    queryFn: () => searchSeries(debouncedFavoriteQuery),
    enabled: favoriteSearchOpen && debouncedFavoriteQuery.length >= 2,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFavoriteQuery(favoriteQuery.trim());
    }, 250);

    return () => clearTimeout(timer);
  }, [favoriteQuery]);

  const presetMutation = useMutation({
    mutationFn: (preset: string) => setAvatarPreset(preset),
    onSuccess: (data) => {
      void updateUser({
        avatar_url: data.avatar_url,
        avatar_preset: data.avatar_preset as AvatarPreset,
      });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      const asset = await pickAvatarImage();
      if (!asset) return null;
      const mimeType = asset.mimeType ?? "image/jpeg";
      return uploadAvatar(asset.uri, mimeType);
    },
    onSuccess: (data) => {
      if (!data) return;
      void updateUser({
        avatar_url: data.avatar_url,
        avatar_preset: data.avatar_preset as AvatarPreset,
      });
    },
  });

  const resetMutation = useMutation({
    mutationFn: resetMyAvatar,
    onSuccess: (data) => {
      void updateUser({
        avatar_url: data.avatar_url,
        avatar_preset: data.avatar_preset as AvatarPreset,
      });
    },
  });

  const replaceFavoritesMutation = useMutation({
    mutationFn: (seriesIds: number[]) => replaceMyFavorites(seriesIds),
    onSuccess: (data) => {
      queryClient.setQueryData(["users", "me", "favorites"], data);
      void queryClient.invalidateQueries({
        queryKey: ["users", "public-profile", user?.username],
      });
      setFavoriteSearchOpen(false);
      setFavoriteQuery("");
    },
    onError: () => {
      Alert.alert("Favorite not saved", "Could not update favorite series. Try again.");
    },
  });

  const removeFavoriteMutation = useMutation({
    mutationFn: removeMyFavorite,
    onSuccess: (data) => {
      queryClient.setQueryData(["users", "me", "favorites"], data);
      void queryClient.invalidateQueries({
        queryKey: ["users", "public-profile", user?.username],
      });
    },
    onError: () => {
      Alert.alert("Favorite not removed", "Could not remove this favorite. Try again.");
    },
  });

  const USERNAME_REGEX = /^[A-Za-z0-9_-]{3,20}$/;

  const usernameMutation = useMutation({
    mutationFn: (newUsername: string) => updateMyUsername(newUsername),
    onSuccess: (data) => {
      void updateUser({ username: data.username });
      setUsernameModalOpen(false);
      setUsernameInput("");
      setUsernameError("");
      Alert.alert("Username updated", `Your username is now "${data.username}".`);
    },
    onError: (error: unknown) => {
      const axiosError = error as {
        response?: { status?: number; data?: { detail?: string } };
      };
      if (axiosError.response?.status === 409) {
        setUsernameError("That username is already taken.");
      } else if (axiosError.response?.status === 429) {
        setUsernameError("Too many attempts. Please wait before trying again.");
      } else {
        setUsernameError(
          axiosError.response?.data?.detail ?? "Could not update username. Try again.",
        );
      }
    },
  });

  const openUsernameModal = () => {
    setUsernameInput(user?.username ?? "");
    setUsernameError("");
    setUsernameModalOpen(true);
  };

  const submitUsername = () => {
    const trimmed = usernameInput.trim();
    if (!USERNAME_REGEX.test(trimmed)) {
      setUsernameError(
        "3–20 characters — letters, numbers, underscores, or hyphens only.",
      );
      return;
    }
    usernameMutation.mutate(trimmed);
  };

  const addFavorite = (seriesId: number) => {
    if (favorites.length >= MAX_FAVORITES) {
      Alert.alert("Favorite limit reached", "You can pin up to 15 favorite series.");
      return;
    }

    if (favoriteIds.has(seriesId)) {
      Alert.alert("Already pinned", "This series is already in your favorites.");
      return;
    }

    replaceFavoritesMutation.mutate([
      ...favorites.map((favorite) => favorite.series_id),
      seriesId,
    ]);
  };

  const openAvatarActions = () => {
    const actions: AlertButton[] = [
      {
        text: "Choose photo",
        onPress: () => uploadMutation.mutate(),
      },
    ];

    if (user?.avatar_url) {
      actions.push({
        text: "Remove photo",
        onPress: () =>
          Alert.alert(
            "Remove photo",
            "Your avatar will revert to your selected color preset.",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Remove",
                style: "destructive",
                onPress: () => resetMutation.mutate(),
              },
            ],
          ),
      });
    }

    Alert.alert("Edit avatar", "Choose how you want to update your profile image.", [
      ...actions,
      { text: "Cancel", style: "cancel" },
    ]);
  };

  return (
    <ScreenShell
      title="Profile"
      subtitle="Your public Toon Ranks identity will stay shared across web and mobile."
    >
      {!isSignedIn ? (
        <AccountRequiredCard
          title="Log in to use your profile"
          body="Your avatar, role, saved titles, votes, and forum identity all come from the same website account."
        />
      ) : null}

      <Surface variant="raised" radius="hero" shadow style={styles.hero}>
        <UserIdentity
          user={user}
          titleFallback="Guest reader"
          avatarSize="xl"
          centered
          nameAccessory={
            isSignedIn ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Edit username"
                onPress={openUsernameModal}
                style={({ pressed }) => [
                  styles.usernameEditButton,
                  pressed ? styles.pressed : null,
                ]}
              >
                <Ionicons name="pencil-outline" size={14} color={colors.textMuted} />
              </Pressable>
            ) : null
          }
          avatarAccessory={
            isSignedIn ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Edit avatar"
                disabled={uploadMutation.isPending || resetMutation.isPending}
                onPress={openAvatarActions}
                style={({ pressed }) => [
                  styles.avatarEditButton,
                  pressed ? styles.pressed : null,
                ]}
              >
                {uploadMutation.isPending || resetMutation.isPending ? (
                  <ActivityIndicator size="small" color={colors.text} />
                ) : (
                  <Ionicons name="pencil" size={16} color={colors.text} />
                )}
              </Pressable>
            ) : null
          }
          subtitle={
            isSignedIn
              ? "Avatar and role data are synced from your Toon Ranks account."
              : "This preview shows where your shared Toon Ranks identity appears after login."
          }
        />
        {isSignedIn && publicProfile ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open Rankers leaderboard"
            onPress={() => navigation.navigate("Leaderboard")}
            style={({ pressed }) => [styles.statChips, pressed ? styles.pressed : null]}
          >
            <View style={[styles.statChip, styles.cpChip]}>
              <Ionicons name="diamond-outline" size={14} color={colors.credText} />
              <AppText variant="caption" style={{ color: colors.credText }}>
                {publicProfile.cred_score.toLocaleString()} CP
              </AppText>
            </View>
            {publicProfile.rank ? (
              <View style={styles.statChip}>
                <Ionicons name="trophy-outline" size={14} color={colors.accentStrong} />
                <AppText variant="caption">#{publicProfile.rank} Ranker</AppText>
              </View>
            ) : null}
          </Pressable>
        ) : null}
      </Surface>

      {isSignedIn ? (
        <>
          <View style={styles.section}>
            <SectionHeader
              title="Favorite Series"
              body="Pin up to 15 series to your public profile."
            />
            {favoritesQuery.isLoading ? (
              <Surface variant="raised" radius="xl" style={styles.loadingCard}>
                <ActivityIndicator size="small" color={colors.accentStrong} />
                <AppText tone="muted">Loading favorites...</AppText>
              </Surface>
            ) : null}
            {favoritesQuery.isError ? (
              <Surface variant="warning" radius="xl" style={styles.loadingCard}>
                <Ionicons
                  name="alert-circle-outline"
                  size={20}
                  color={colors.warningText}
                />
                <AppText tone="warning">Favorites could not load.</AppText>
                <AppButton
                  label="Retry"
                  size="sm"
                  variant="ghost"
                  onPress={() => favoritesQuery.refetch()}
                />
              </Surface>
            ) : null}
            {!favoritesQuery.isLoading && !favoritesQuery.isError ? (
              <>
                {favorites.length > 0 ? (
                  <View style={styles.favoritesGrid}>
                    {favorites.map((favorite) => (
                      <FavoriteCard
                        key={`${favorite.series_id}-${favorite.position}`}
                        favorite={favorite}
                        removing={
                          removeFavoriteMutation.isPending &&
                          removeFavoriteMutation.variables === favorite.series_id
                        }
                        onOpen={() =>
                          navigation.navigate("SeriesDetail", {
                            seriesId: favorite.series_id,
                          })
                        }
                        onRemove={() =>
                          Alert.alert(
                            "Remove favorite?",
                            `Remove "${favorite.title}" from your public profile?`,
                            [
                              { text: "Cancel", style: "cancel" },
                              {
                                text: "Remove",
                                style: "destructive",
                                onPress: () =>
                                  removeFavoriteMutation.mutate(favorite.series_id),
                              },
                            ],
                          )
                        }
                      />
                    ))}
                  </View>
                ) : (
                  <EmptyState
                    title="No favorites pinned"
                    message="Add series here to show them on your public profile."
                  />
                )}
                {favorites.length < MAX_FAVORITES ? (
                  <AppButton
                    label="Add Series"
                    variant="secondary"
                    onPress={() => setFavoriteSearchOpen(true)}
                    iconLeft={<Ionicons name="add" size={16} color={colors.text} />}
                  />
                ) : (
                  <AppText variant="caption" tone="muted">
                    Favorite limit reached.
                  </AppText>
                )}
              </>
            ) : null}
          </View>

          <View style={styles.section}>
            <SectionHeader title="Avatar preset" />
            {user?.avatar_url ? (
              <AppText tone="muted" style={styles.presetNote}>
                Selecting a preset will replace your uploaded photo.
              </AppText>
            ) : null}
            <Surface variant="raised" radius="xl" style={styles.presetRow}>
              {PRESETS.map((preset) => {
                const pc = avatarPresetColors[preset];
                const isActive = currentPreset === preset && !user?.avatar_url;
                const isLoading =
                  presetMutation.isPending && presetMutation.variables === preset;

                return (
                  <Pressable
                    key={preset}
                    onPress={() => {
                      if (!isActive && !presetMutation.isPending) {
                        presetMutation.mutate(preset);
                      }
                    }}
                    disabled={isActive || presetMutation.isPending}
                    accessibilityRole="button"
                    accessibilityLabel={`${PRESET_LABELS[preset]} avatar preset${isActive ? ", selected" : ""}`}
                    accessibilityState={{ selected: isActive }}
                    style={({ pressed }) => [
                      styles.swatchWrap,
                      pressed && !isActive ? styles.pressed : null,
                    ]}
                  >
                    <View
                      style={[
                        styles.swatch,
                        {
                          backgroundColor: pc.background,
                          borderColor: pc.border,
                        },
                        isActive && styles.swatchActive,
                      ]}
                    >
                      {isLoading ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : isActive ? (
                        <Ionicons name="checkmark" size={22} color="#fff" />
                      ) : null}
                    </View>
                    <AppText
                      variant="caption"
                      tone={isActive ? "accent" : "muted"}
                      align="center"
                    >
                      {PRESET_LABELS[preset]}
                    </AppText>
                  </Pressable>
                );
              })}
            </Surface>
            {presetMutation.isError ? (
              <AppText tone="danger" style={styles.presetNote}>
                Could not update preset. Please try again.
              </AppText>
            ) : null}
            {uploadMutation.isError ? (
              <AppText tone="danger" style={styles.presetNote}>
                Upload failed. Check your connection and try again.
              </AppText>
            ) : null}
            {resetMutation.isError ? (
              <AppText tone="danger" style={styles.presetNote}>
                Could not remove photo. Try again.
              </AppText>
            ) : null}
            {user?.avatar_url ? (
              <AppText variant="caption" tone="muted" style={styles.presetNote}>
                Tap the pencil on your avatar to change or remove your photo.
              </AppText>
            ) : null}
          </View>
        </>
      ) : null}

      {isSignedIn ? (
        <View style={styles.section}>
          <SectionHeader title="Series rated" />
          <SeriesRatingsSection />
        </View>
      ) : null}

      <View style={styles.section}>
        <SectionHeader title="Account shortcuts" />
        <View style={styles.actions}>
          <AppButton
            label="Reading lists"
            variant="secondary"
            onPress={() => navigation.navigate("ReadingLists")}
            iconLeft={<Ionicons name="bookmark-outline" size={15} color={colors.text} />}
          />
          <AppButton
            label="Forum activity"
            variant="secondary"
            onPress={() => navigation.navigate("ForumActivity")}
            iconLeft={
              <Ionicons name="chatbubbles-outline" size={15} color={colors.text} />
            }
          />
        </View>
      </View>

      <Modal transparent visible={usernameModalOpen} animationType="slide">
        <View style={styles.modalBackdrop}>
          <Surface radius="xl" style={styles.usernameModal}>
            <View style={styles.modalHeader}>
              <AppText variant="sectionTitle">Change username</AppText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close"
                onPress={() => {
                  setUsernameModalOpen(false);
                  setUsernameError("");
                }}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
              placeholder="New username"
              placeholderTextColor={colors.textMuted}
              style={[
                styles.usernameInput,
                usernameError ? styles.usernameInputError : null,
              ]}
              value={usernameInput}
              onChangeText={(text) => {
                setUsernameInput(text);
                if (usernameError) setUsernameError("");
              }}
              onSubmitEditing={submitUsername}
              returnKeyType="done"
              maxLength={20}
            />
            <AppText variant="caption" tone="muted">
              3–20 characters — letters, numbers, underscores, or hyphens.
            </AppText>
            {usernameError ? (
              <AppText tone="danger" variant="caption">
                {usernameError}
              </AppText>
            ) : null}
            <AppButton
              label="Save"
              variant="primary"
              disabled={
                !usernameInput.trim() ||
                usernameInput.trim() === user?.username ||
                usernameMutation.isPending
              }
              onPress={submitUsername}
              iconLeft={
                usernameMutation.isPending ? (
                  <ActivityIndicator size="small" color={colors.text} />
                ) : undefined
              }
            />
          </Surface>
        </View>
      </Modal>

      <Modal transparent visible={favoriteSearchOpen} animationType="fade">
        <View style={styles.modalBackdrop}>
          <Surface radius="xl" style={styles.favoriteModal}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitle}>
                <AppText variant="sectionTitle">Add favorite</AppText>
                <AppText variant="caption" tone="muted">
                  {favorites.length}/{MAX_FAVORITES} pinned
                </AppText>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close favorite search"
                onPress={() => setFavoriteSearchOpen(false)}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>
            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={18} color={colors.textMuted} />
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="Search series to pin..."
                placeholderTextColor={colors.textMuted}
                style={styles.searchInput}
                value={favoriteQuery}
                onChangeText={setFavoriteQuery}
              />
            </View>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.favoriteSearchResults}
            >
              {favoriteQuery.trim() && debouncedFavoriteQuery.length < 2 ? (
                <AppText tone="muted">Type at least 2 characters.</AppText>
              ) : null}
              {favoriteSearchQuery.isLoading ? (
                <View style={styles.loadingCard}>
                  <ActivityIndicator size="small" color={colors.accentStrong} />
                  <AppText tone="muted">Searching...</AppText>
                </View>
              ) : null}
              {favoriteSearchQuery.isError ? (
                <AppText tone="danger">Search failed. Try again.</AppText>
              ) : null}
              {(favoriteSearchQuery.data ?? []).map((series) => {
                const alreadyPinned = favoriteIds.has(series.id);
                return (
                  <Pressable
                    key={series.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Pin ${series.title}`}
                    disabled={alreadyPinned || replaceFavoritesMutation.isPending}
                    onPress={() => addFavorite(series.id)}
                    style={({ pressed }) => [
                      styles.searchResultRow,
                      alreadyPinned ? styles.searchResultDisabled : null,
                      pressed ? styles.pressed : null,
                    ]}
                  >
                    <CoverImage uri={series.cover_url} style={styles.searchResultCover} />
                    <View style={styles.searchResultText}>
                      <AppText variant="cardTitle" numberOfLines={1}>
                        {series.title}
                      </AppText>
                      <AppText variant="caption" tone="muted">
                        {series.type}
                        {alreadyPinned ? " / Already pinned" : ""}
                      </AppText>
                    </View>
                    {replaceFavoritesMutation.isPending &&
                    replaceFavoritesMutation.variables?.includes(series.id) ? (
                      <ActivityIndicator size="small" color={colors.accentStrong} />
                    ) : (
                      <Ionicons
                        name={alreadyPinned ? "checkmark-circle" : "add-circle-outline"}
                        size={22}
                        color={alreadyPinned ? colors.success : colors.accentStrong}
                      />
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Surface>
        </View>
      </Modal>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: "center",
    gap: spacing.md,
  },
  section: {
    gap: spacing.sm,
  },
  presetRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: spacing.md,
  },
  swatchWrap: {
    alignItems: "center",
    gap: spacing.xs,
  },
  swatch: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  swatchActive: {
    borderWidth: 4,
  },
  presetNote: {
    paddingHorizontal: spacing.xs,
  },
  pressed: {
    opacity: 0.8,
  },
  avatarEditButton: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  loadingCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  favoritesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  favoriteCard: {
    width: "48%",
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surfaceRaised,
    overflow: "hidden",
  },
  favoriteCover: {
    width: "100%",
    aspectRatio: 2 / 3,
  },
  favoriteText: {
    gap: 2,
    padding: spacing.sm,
  },
  removeFavoriteButton: {
    position: "absolute",
    right: spacing.xs,
    top: spacing.xs,
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.overlayBorder,
    backgroundColor: colors.overlay,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.72)",
    padding: spacing.lg,
  },
  favoriteModal: {
    maxHeight: "82%",
    gap: spacing.md,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  modalTitle: {
    flex: 1,
    gap: 2,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.backgroundSoft,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    paddingVertical: 0,
  },
  favoriteSearchResults: {
    gap: spacing.sm,
  },
  searchResultRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.backgroundSoft,
    padding: spacing.sm,
  },
  searchResultDisabled: {
    opacity: 0.62,
  },
  searchResultCover: {
    width: 48,
    aspectRatio: 2 / 3,
    borderRadius: radii.sm,
  },
  searchResultText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  usernameEditButton: {
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.backgroundSoft,
  },
  usernameModal: {
    gap: spacing.md,
  },
  usernameInput: {
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.backgroundSoft,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
    fontSize: 16,
  },
  usernameInputError: {
    borderColor: colors.danger ?? colors.accentStrong,
  },
  statChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: spacing.xs,
  },
  statChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.backgroundSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  cpChip: {
    borderColor: colors.credBorder,
    backgroundColor: colors.credSurface,
  },
});
