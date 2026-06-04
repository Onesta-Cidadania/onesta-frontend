export const SESSION_INACTIVITY_LIMIT_MS = 24 * 60 * 60 * 1000;
export const SESSION_ACTIVITY_UPDATED_EVENT = "session-activity-updated";
export const SESSION_EXPIRED_EVENT = "session-expired";

const SESSION_LAST_ACTIVITY_KEY = "onesta:last-authenticated-activity";

export const getLastAuthenticatedActivity = (): number | null => {
  const storedValue = window.localStorage.getItem(SESSION_LAST_ACTIVITY_KEY);
  const timestamp = storedValue ? Number(storedValue) : NaN;

  return Number.isFinite(timestamp) ? timestamp : null;
};

export const hasAuthenticatedSessionExpired = (now = Date.now()): boolean => {
  const lastActivity = getLastAuthenticatedActivity();

  return lastActivity !== null && now - lastActivity >= SESSION_INACTIVITY_LIMIT_MS;
};

export const recordAuthenticatedActivity = (timestamp = Date.now()) => {
  window.localStorage.setItem(SESSION_LAST_ACTIVITY_KEY, String(timestamp));
  window.dispatchEvent(new Event(SESSION_ACTIVITY_UPDATED_EVENT));
};

export const clearAuthenticatedActivity = () => {
  window.localStorage.removeItem(SESSION_LAST_ACTIVITY_KEY);
};

export const getSessionActivityStorageKey = () => SESSION_LAST_ACTIVITY_KEY;
