import { useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { getUnreadCount } from "../api/notifications";
import { useAuth } from "../auth/AuthContext";

const POLL_INTERVAL_MS = 60_000;
export const NOTIF_COUNT_KEY = ["notifications", "unread-count"] as const;

export function useNotificationCount() {
  const { isSignedIn } = useAuth();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: NOTIF_COUNT_KEY,
    queryFn: getUnreadCount,
    enabled: isSignedIn,
    refetchInterval: POLL_INTERVAL_MS,
    staleTime: 30_000,
  });

  // Also refetch when app comes back to foreground
  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    const subscription = AppState.addEventListener(
      "change",
      (nextState: AppStateStatus) => {
        if (nextState === "active" && isSignedIn && isMounted.current) {
          void queryClient.invalidateQueries({ queryKey: NOTIF_COUNT_KEY });
        }
      },
    );
    return () => {
      isMounted.current = false;
      subscription.remove();
    };
  }, [isSignedIn, queryClient]);

  return { count: data?.count ?? 0 };
}
