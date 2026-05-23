import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Ionicons from "@expo/vector-icons/Ionicons";

import { CompareScreen } from "../screens/CompareScreen";
import { ForumScreen } from "../screens/ForumScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { MoreScreen } from "../screens/MoreScreen";
import { colors } from "../theme/tokens";
import { SearchScreen } from "../screens/SearchScreen";

export type TabParamList = {
  Home: undefined;
  Search: undefined;
  Forum: undefined;
  Compare: undefined;
  More: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

function getTabIconName(
  routeName: keyof TabParamList,
): React.ComponentProps<typeof Ionicons>["name"] {
  switch (routeName) {
    case "Home":
      return "home-outline";
    case "Search":
      return "search-outline";
    case "Forum":
      return "chatbubbles-outline";
    case "Compare":
      return "git-compare-outline";
    case "More":
      return "menu-outline";
  }
}

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={getTabIconName(route.name)} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Forum" component={ForumScreen} />
      <Tab.Screen name="Compare" component={CompareScreen} />
      <Tab.Screen name="More" component={MoreScreen} />
    </Tab.Navigator>
  );
}
