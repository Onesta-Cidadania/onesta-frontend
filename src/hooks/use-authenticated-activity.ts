import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  hasAuthenticatedSessionExpired,
  recordAuthenticatedActivity,
  SESSION_EXPIRED_EVENT,
} from "@/lib/auth/session-activity";

const ACTIVITY_EVENTS: Array<keyof WindowEventMap> = ["keydown", "pointerdown", "scroll", "touchstart"];
const ACTIVITY_RECORD_INTERVAL_MS = 60 * 1000;

export const useAuthenticatedActivity = (enabled = true) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let lastRecordedActivity = 0;

    const recordActivity = () => {
      const now = Date.now();

      if (hasAuthenticatedSessionExpired(now) || now - lastRecordedActivity < ACTIVITY_RECORD_INTERVAL_MS) {
        return;
      }

      lastRecordedActivity = now;
      recordAuthenticatedActivity(now);
    };

    const handleSessionExpired = () => {
      navigate("/login", { replace: true });
    };

    recordActivity();

    ACTIVITY_EVENTS.forEach((eventName) => window.addEventListener(eventName, recordActivity, { passive: true }));
    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);

    return () => {
      ACTIVITY_EVENTS.forEach((eventName) => window.removeEventListener(eventName, recordActivity));
      window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    };
  }, [enabled, navigate]);
};
