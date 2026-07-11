import { E2E_SESSION_SECRET, sessionCookie } from "./tests/e2e/helpers/auth.mjs";

const PORT = Number(process.env.PORT ?? 3000);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${PORT}`;
const authenticatedStorageState = {
  cookies: [sessionCookie("admin", baseURL)],
  origins: []
};

/** @type {import('@playwright/test').PlaywrightTestConfig} */
const config = {
  testDir: "./tests/e2e",
  timeout: 45_000,
  expect: {
    timeout: 8_000
  },
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]] : "list",
  use: {
    baseURL,
    storageState: authenticatedStorageState,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure"
  },
  projects: [
    {
      name: "chromium-desktop",
      use: {
        browserName: "chromium",
        viewport: { width: 1440, height: 1000 }
      }
    },
    {
      name: "chromium-mobile",
      use: {
        browserName: "chromium",
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true
      }
    }
  ],
  webServer: process.env.PLAYWRIGHT_SKIP_WEB_SERVER
    ? undefined
    : {
        command: `npm run dev -- -p ${PORT}`,
        url: baseURL,
        reuseExistingServer: process.env.PLAYWRIGHT_REUSE_SERVER === "true",
        timeout: 120_000,
        env: {
          NEXT_PUBLIC_DEMO_MODE: "false",
          NEXT_PUBLIC_REQUIRE_AUTH: "true",
          MUNI_SESSION_SECRET: E2E_SESSION_SECRET,
          WORKFLOW_STORE_PROVIDER: "local_json",
          WORKFLOW_TENANT_ID: "e2e-tenant",
          DISABLE_EXPENSIVE_JOBS: "true"
        }
      }
};

export default config;
