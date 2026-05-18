import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { MainTabs } from "./TabsNavigator";
import { CheckEmailScreen } from "../screens/CheckEmailScreen";
import { LoginScreen } from "../screens/LoginScreen";
import { SignupScreen } from "../screens/SignupScreen";
import { SeriesDetailScreen } from "../screens/SeriesDetailScreen";

export type RootStackParamList = {
  MainTabs: undefined;
  SeriesDetail: { seriesId: number };
  Login: undefined;
  Signup: undefined;
  CheckEmail: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="SeriesDetail" component={SeriesDetailScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="CheckEmail" component={CheckEmailScreen} />
    </Stack.Navigator>
  );
}
