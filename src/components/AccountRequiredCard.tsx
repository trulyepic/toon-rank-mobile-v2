import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StyleSheet, View } from "react-native";

import type { RootStackParamList } from "../navigation/RootNavigator";
import { colors, radii, spacing } from "../theme/tokens";
import { AppButton } from "./AppButton";
import { AppText } from "./AppText";
import { Surface } from "./Surface";

type Props = {
  title: string;
  body: string;
};

export function AccountRequiredCard({ title, body }: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <Surface variant="accent" radius="hero" style={styles.card}>
      <View style={styles.icon}>
        <Ionicons name="lock-closed-outline" size={22} color={colors.text} />
      </View>
      <View style={styles.text}>
        <AppText variant="sectionTitle">{title}</AppText>
        <AppText tone="muted">{body}</AppText>
      </View>
      <View style={styles.actions}>
        <AppButton
          label="Log in"
          onPress={() => navigation.navigate("Login")}
          iconLeft={<Ionicons name="log-in-outline" size={15} color={colors.text} />}
        />
        <AppButton
          label="Sign up"
          variant="ghost"
          onPress={() => navigation.navigate("Signup")}
          iconLeft={<Ionicons name="person-add-outline" size={15} color={colors.text} />}
        />
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
  },
  icon: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.pill,
    backgroundColor: colors.accent,
    borderWidth: 1,
    borderColor: colors.accentBorder,
  },
  text: {
    gap: spacing.xs,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
});
