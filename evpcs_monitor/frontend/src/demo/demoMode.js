export const DEMO_MODE_STORAGE_KEY = "ev_station_demo_mode";
export const DEMO_GUEST_STORAGE_KEY = "ev_station_demo_guest";

let currentDemoMode;

const parseBoolean = (value) => {
  if (value === true || value === "true" || value === "1") return true;
  if (value === false || value === "false" || value === "0") return false;
  return undefined;
};

const readQueryOverride = () => {
  if (typeof window === "undefined") return undefined;
  return parseBoolean(new URLSearchParams(window.location.search).get("demo"));
};

export const initializeDemoMode = () => {
  if (currentDemoMode !== undefined) return currentDemoMode;

  const queryOverride = readQueryOverride();
  if (queryOverride !== undefined) {
    window.localStorage.setItem(DEMO_MODE_STORAGE_KEY, String(queryOverride));
    currentDemoMode = queryOverride;
    return currentDemoMode;
  }

  if (typeof window !== "undefined") {
    const savedPreference = parseBoolean(
      window.localStorage.getItem(DEMO_MODE_STORAGE_KEY)
    );
    if (savedPreference !== undefined) {
      currentDemoMode = savedPreference;
      return currentDemoMode;
    }
  }

  const environmentDefault = parseBoolean(process.env.REACT_APP_DEMO_MODE);
  currentDemoMode =
    environmentDefault !== undefined
      ? environmentDefault
      : process.env.NODE_ENV === "production";

  return currentDemoMode;
};

export const isDemoMode = () => initializeDemoMode();

export const isDemoGuestSession = () =>
  typeof window !== "undefined" &&
  isDemoMode() &&
  window.localStorage.getItem(DEMO_GUEST_STORAGE_KEY) === "true" &&
  window.localStorage.getItem("role") === "demo_guest";

export const getAppRole = () => {
  if (typeof window === "undefined") return null;
  const role = window.localStorage.getItem("role");
  return role === "demo_guest" ? (isDemoGuestSession() ? role : null) : role;
};

export const canViewDemoAdminPages = (role) =>
  role === "admin" || (role === "demo_guest" && isDemoGuestSession());

export const setDemoMode = (enabled) => {
  currentDemoMode = Boolean(enabled);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(DEMO_MODE_STORAGE_KEY, String(currentDemoMode));
    window.dispatchEvent(
      new CustomEvent("ev-station-demo-mode-change", {
        detail: { enabled: currentDemoMode },
      })
    );
  }
  return currentDemoMode;
};

export const createDemoGuestSession = () => {
  if (typeof window === "undefined") return;

  setDemoMode(true);
  // 使用独立访客角色，避免演示会话被当成真实后端的管理员登录。
  window.localStorage.setItem("user_id", "9001");
  window.localStorage.setItem("role", "demo_guest");
  window.localStorage.setItem("username", "演示访客");
  window.localStorage.setItem(DEMO_GUEST_STORAGE_KEY, "true");
  window.dispatchEvent(new Event("ev-station-demo-guest-change"));
};

export const clearDemoGuestSession = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(DEMO_GUEST_STORAGE_KEY);
  window.dispatchEvent(new Event("ev-station-demo-guest-change"));
};

export const initializeDemoGuestFromUrl = () => {
  if (typeof window === "undefined") return false;
  const url = new URL(window.location.href);
  if (url.searchParams.get("guest") !== "1" || !isDemoMode()) return false;

  createDemoGuestSession();
  url.searchParams.delete("guest");
  window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
  return true;
};
