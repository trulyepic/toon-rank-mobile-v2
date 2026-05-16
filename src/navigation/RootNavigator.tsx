import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { MainTabs } from "./TabsNavigator";
import { SeriesDetailScreen } from "../screens/SeriesDetailScreen";

export type RootStackParamList = {
  MainTabs: undefined;
  SeriesDetail: { seriesId: number };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="SeriesDetail" component={SeriesDetailScreen} />
    </Stack.Navigator>
  );
}
