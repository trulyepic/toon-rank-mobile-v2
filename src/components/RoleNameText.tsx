import { Text } from "react-native";

import { interpolateRoleColor, roleColor, roleGradientColors } from "../utils/avatar";
import { AppText } from "./AppText";

type Props = {
  children: string;
  role?: string | null;
  variant?: "caption" | "cardTitle" | "sectionTitle";
  align?: "left" | "center";
};

export function RoleNameText({
  children,
  role,
  variant = "cardTitle",
  align = "left",
}: Props) {
  const colors = roleGradientColors(role);

  if (colors.length <= 1) {
    return (
      <AppText variant={variant} align={align} style={{ color: roleColor(role) }}>
        {children}
      </AppText>
    );
  }

  const characters = Array.from(children);

  return (
    <AppText variant={variant} align={align}>
      {characters.map((character, index) => (
        <Text
          key={`${character}-${index}`}
          style={{ color: interpolateRoleColor(colors, index, characters.length) }}
        >
          {character}
        </Text>
      ))}
    </AppText>
  );
}
