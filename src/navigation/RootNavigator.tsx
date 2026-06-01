import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { NavigatorScreenParams } from "@react-navigation/native";

import { MainTabs } from "./TabsNavigator";
import type { TabParamList } from "./TabsNavigator";
import { CheckEmailScreen } from "../screens/CheckEmailScreen";
import { LoginScreen } from "../screens/LoginScreen";
import { SignupScreen } from "../screens/SignupScreen";
import { SeriesDetailScreen } from "../screens/SeriesDetailScreen";
import { ForumActivityScreen } from "../screens/ForumActivityScreen";
import { ForumCreateThreadScreen } from "../screens/ForumCreateThreadScreen";
import { ForumThreadScreen } from "../screens/ForumThreadScreen";
import { LeaderboardScreen } from "../screens/LeaderboardScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { ReadingListsScreen } from "../screens/ReadingListsScreen";
import { ReadingListDetailScreen } from "../screens/ReadingListDetailScreen";
import { PublicReadingListScreen } from "../screens/PublicReadingListScreen";
import { PublicProfileScreen } from "../screens/PublicProfileScreen";
import { ReportIssueScreen } from "../screens/ReportIssueScreen";
import { IssueTrackerScreen } from "../screens/IssueTrackerScreen";
import { AdminReportQueueScreen } from "../screens/AdminReportQueueScreen";
import { NotificationsScreen } from "../screens/NotificationsScreen";
import { AboutScreen } from "../screens/AboutScreen";
import { HowRankingsWorkScreen } from "../screens/HowRankingsWorkScreen";
import { NotFoundScreen } from "../screens/NotFoundScreen";
import { SettingsScreen } from "../screens/SettingsScreen";

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<TabParamList> | undefined;
  SeriesDetail: { seriesId: number };
  Login: undefined;
  Signup: undefined;
  CheckEmail: undefined;
  ReadingLists: undefined;
  ReadingListDetail: { listId: number; listName: string };
  PublicReadingList: { token: string };
  PublicProfile: { username: string };
  ForumCreateThread: undefined;
  ForumThread: { threadId: number; postId?: number };
  ForumActivity: undefined;
  Leaderboard: undefined;
  Profile: undefined;
  ReportIssue: { pageUrl?: string; title?: string; issueType?: string } | undefined;
  IssueTracker: undefined;
  AdminReportQueue: undefined;
  Notifications: undefined;
  About: undefined;
  HowRankingsWork: undefined;
  NotFound: undefined;
  Settings: undefined;
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
      <Stack.Screen name="ReadingLists" component={ReadingListsScreen} />
      <Stack.Screen name="ReadingListDetail" component={ReadingListDetailScreen} />
      <Stack.Screen name="PublicReadingList" component={PublicReadingListScreen} />
      <Stack.Screen name="PublicProfile" component={PublicProfileScreen} />
      <Stack.Screen name="ForumCreateThread" component={ForumCreateThreadScreen} />
      <Stack.Screen name="ForumThread" component={ForumThreadScreen} />
      <Stack.Screen name="ForumActivity" component={ForumActivityScreen} />
      <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="ReportIssue" component={ReportIssueScreen} />
      <Stack.Screen name="IssueTracker" component={IssueTrackerScreen} />
      <Stack.Screen name="AdminReportQueue" component={AdminReportQueueScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="HowRankingsWork" component={HowRankingsWorkScreen} />
      <Stack.Screen name="NotFound" component={NotFoundScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
}
