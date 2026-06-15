import { useEffect } from "react";
import {
  clearAuthenticatedActivity,
  getLastAuthenticatedActivity,
  getSessionActivityStorageKey,
  recordAuthenticatedActivity,
  SESSION_ACTIVITY_UPDATED_EVENT,
  SESSION_EXPIRED_EVENT,
  SESSION_INACTIVITY_LIMIT_MS,
} from "@/lib/auth/session-activity";
import { supabase } from "@/lib/supabase/client";

const SessionExpirationMonitor = () => {
  useEffect(() => {
    let expirationTimer: ReturnType<typeof setTimeout> | undefined;

    const clearExpirationTimer = () => {
      if (expirationTimer) {
        clearTimeout(expirationTimer);
        expirationTimer = undefined;
      }
    };

    const expireSession = async () => {
      clearExpirationTimer();
      clearAuthenticatedActivity();
      await supabase().auth.signOut();
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    };

    const scheduleExpiration = async () => {
      clearExpirationTimer();

      const {
        data: { session },
      } = await supabase().auth.getSession();

      if (!session?.user) {
        clearAuthenticatedActivity();
        return;
      }

      const lastActivity = getLastAuthenticatedActivity();

      if (lastActivity === null) {
        recordAuthenticatedActivity();
        return;
      }

      const remainingTime = SESSION_INACTIVITY_LIMIT_MS - (Date.now() - lastActivity);

      if (remainingTime <= 0) {
        await expireSession();
        return;
      }

      expirationTimer = setTimeout(expireSession, remainingTime);
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === getSessionActivityStorageKey()) {
        void scheduleExpiration();
      }
    };

    const handleActivityUpdate = () => {
      void scheduleExpiration();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void scheduleExpiration();
      }
    };

    void scheduleExpiration();
    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", handleActivityUpdate);
    window.addEventListener(SESSION_ACTIVITY_UPDATED_EVENT, handleActivityUpdate);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearExpirationTimer();
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", handleActivityUpdate);
      window.removeEventListener(SESSION_ACTIVITY_UPDATED_EVENT, handleActivityUpdate);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return null;
};

export default SessionExpirationMonitor;
