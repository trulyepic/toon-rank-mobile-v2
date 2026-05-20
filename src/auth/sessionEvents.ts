type SessionExpiredListener = () => void | Promise<void>;

const sessionExpiredListeners = new Set<SessionExpiredListener>();

export function subscribeToSessionExpired(listener: SessionExpiredListener) {
  sessionExpiredListeners.add(listener);

  return () => {
    sessionExpiredListeners.delete(listener);
  };
}

export function notifySessionExpired() {
  for (const listener of sessionExpiredListeners) {
    void listener();
  }
}

export function clearSessionExpiredListenersForTests() {
  sessionExpiredListeners.clear();
}
