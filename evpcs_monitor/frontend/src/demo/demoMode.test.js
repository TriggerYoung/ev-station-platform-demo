beforeEach(() => {
  jest.resetModules();
  window.localStorage.clear();
  window.history.replaceState({}, "", "/");
});

test("README demo link starts a guest session without redirecting to the dashboard", () => {
  window.history.replaceState({}, "", "/?demo=1&guest=1");
  const demo = require("./demoMode");

  demo.initializeDemoMode();
  expect(demo.initializeDemoGuestFromUrl()).toBe(true);
  expect(demo.getAppRole()).toBe("demo_guest");
  expect(demo.canViewDemoAdminPages(demo.getAppRole())).toBe(true);
  expect(window.location.pathname).toBe("/");
  expect(window.location.search).toBe("?demo=1");
});

test("guest role cannot authorize real backend mode", () => {
  const demo = require("./demoMode");
  demo.createDemoGuestSession();
  expect(demo.getAppRole()).toBe("demo_guest");

  demo.setDemoMode(false);
  expect(demo.getAppRole()).toBeNull();
  expect(demo.canViewDemoAdminPages("demo_guest")).toBe(false);
});

test("guest flag is ignored when the URL explicitly disables demo mode", () => {
  window.history.replaceState({}, "", "/?demo=0&guest=1");
  const demo = require("./demoMode");

  demo.initializeDemoMode();
  expect(demo.initializeDemoGuestFromUrl()).toBe(false);
  expect(demo.getAppRole()).toBeNull();
});
