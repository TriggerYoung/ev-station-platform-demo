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
  // 现有页面以 role=admin 展示完整功能；所有写操作仍只修改内存中的 Demo 副本。
  window.localStorage.setItem("user_id", "9001");
  window.localStorage.setItem("role", "admin");
  window.localStorage.setItem("username", "演示访客");
  window.localStorage.setItem(DEMO_GUEST_STORAGE_KEY, "true");
};

export const clearDemoGuestSession = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(DEMO_GUEST_STORAGE_KEY);
};
