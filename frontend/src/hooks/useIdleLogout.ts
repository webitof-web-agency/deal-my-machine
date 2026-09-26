'use client';

import { useCallback, useEffect, useState } from 'react';
import { getIdleTimeoutMs, getInitialActivityAt, getWarningAtMs, isIdleExpired } from '@/lib/idleSession.mjs';

const LAST_ACTIVITY_KEY = 'jcbexchange_idle_last_activity';
const LOGOUT_KEY = 'jcbexchange_idle_logout';
const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'scroll', 'touchstart', 'mousemove'] as const;

const readTimestamp = (key: string) => {
  try {
    const value = Number(window.localStorage.getItem(key));
    return Number.isFinite(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
};

export const useIdleLogout = ({ enabled, onLogout }: { enabled: boolean; onLogout: () => void }) => {
  const [isWarningVisible, setIsWarningVisible] = useState(false);

  const continueSession = useCallback(() => {
    const now = Date.now();
    try {
      window.localStorage.setItem(LAST_ACTIVITY_KEY, String(now));
    } catch {
      // The in-memory timer still protects the current tab if storage is unavailable.
    }
    setIsWarningVisible(false);
  }, []);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    const timeoutMs = getIdleTimeoutMs(process.env.NEXT_PUBLIC_IDLE_TIMEOUT_MINUTES);
    const warningAtMs = getWarningAtMs(timeoutMs);
    // A successful login starts a new session. Never inherit an expired timestamp
    // from a previous user/session in this browser tab.
    let lastActivityAt = getInitialActivityAt(Date.now());
    let lastPersistedActivityAt = lastActivityAt;

    try {
      window.localStorage.setItem(LAST_ACTIVITY_KEY, String(lastActivityAt));
    } catch {
      // Continue with the current tab's wall-clock timer.
    }

    const logoutCurrentSession = () => {
      try {
        window.localStorage.setItem(LOGOUT_KEY, String(Date.now()));
      } catch {
        // Cross-tab sync is best effort when storage is blocked.
      }
      onLogout();
    };

    const handleActivity = () => {
      const now = Date.now();
      if (isIdleExpired(lastActivityAt, now, timeoutMs)) {
        logoutCurrentSession();
        return;
      }

      lastActivityAt = now;
      setIsWarningVisible(false);
      if (now - lastPersistedActivityAt >= 1000) {
        lastPersistedActivityAt = now;
        try {
          window.localStorage.setItem(LAST_ACTIVITY_KEY, String(now));
        } catch {
          // The current tab remains protected by lastActivityAt.
        }
      }
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === LOGOUT_KEY) {
        onLogout();
        return;
      }

      if (event.key === LAST_ACTIVITY_KEY) {
        const sharedActivityAt = Number(event.newValue);
        if (Number.isFinite(sharedActivityAt) && sharedActivityAt > lastActivityAt) {
          lastActivityAt = sharedActivityAt;
          lastPersistedActivityAt = sharedActivityAt;
          setIsWarningVisible(false);
        }
      }
    };

    const checkIdleState = () => {
      const sharedActivityAt = readTimestamp(LAST_ACTIVITY_KEY);
      if (sharedActivityAt && sharedActivityAt > lastActivityAt) {
        lastActivityAt = sharedActivityAt;
      }

      const elapsedMs = Date.now() - lastActivityAt;
      if (isIdleExpired(lastActivityAt, Date.now(), timeoutMs)) {
        logoutCurrentSession();
        return;
      }

      setIsWarningVisible(elapsedMs >= warningAtMs);
    };

    ACTIVITY_EVENTS.forEach((eventName) => window.addEventListener(eventName, handleActivity, { passive: true }));
    window.addEventListener('storage', handleStorage);
    const intervalId = window.setInterval(checkIdleState, 1000);

    return () => {
      ACTIVITY_EVENTS.forEach((eventName) => window.removeEventListener(eventName, handleActivity));
      window.removeEventListener('storage', handleStorage);
      window.clearInterval(intervalId);
    };
  }, [enabled, onLogout]);

  return { isWarningVisible: enabled && isWarningVisible, continueSession };
};
