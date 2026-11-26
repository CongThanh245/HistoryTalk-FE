import { defineConfig, devices } from "@playwright/test";
import { BASE_URL, authFile } from "./e2e/support/env";

/**
 * E2E suite (Playwright). Needs the Java BE running (default http://localhost:8080) against a dev DB — the suites create
 * schools, classes and students. The FE is built and served on :3456 (reused when already up; E2E_SKIP_BUILD=1 skips
 * the build). The AI service is not needed: chat / AI calls are mocked in e2e/support/ai-mock.ts.
 *   npm run e2e            — everything
 *   npm run e2e -- --project=school-admin
 *   npm run e2e:report     — open the last HTML report
 */
export default defineConfig({
  testDir: "./e2e",
  outputDir: "./e2e/.results",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  workers: process.env.CI ? 2 : 4,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { outputFolder: "e2e/.report", open: "never" }]],
  use: {
    baseURL: BASE_URL,
    locale: "vi-VN",
    timezoneId: "Asia/Ho_Chi_Minh",
    // First hit of a route compiles it in `next dev`, which can take a while.
    navigationTimeout: 60_000,
    actionTimeout: 15_000,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    ...devices["Desktop Chrome"],
    viewport: { width: 1440, height: 900 },
  },
  // Production build on its own port: `next dev` compiles each route on first hit, too slow for parallel workers,
  // and a build is what users actually get. Set E2E_BASE_URL to test an already running server instead.
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: process.env.E2E_SKIP_BUILD ? "npx next start -p 3456" : "npm run build && npx next start -p 3456",
        url: BASE_URL,
        reuseExistingServer: true,
        timeout: 600_000,
      },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    { name: "public", testMatch: /public\/.*\.spec\.ts/ },
    { name: "system-admin", testMatch: /system-admin\/.*\.spec\.ts/, dependencies: ["setup"], use: { storageState: authFile("systemAdmin") } },
    { name: "content-admin", testMatch: /content-admin\/.*\.spec\.ts/, dependencies: ["setup"], use: { storageState: authFile("contentAdmin") } },
    { name: "customer", testMatch: /customer\/.*\.spec\.ts/, dependencies: ["setup"], use: { storageState: authFile("customer") } },
    { name: "school-admin", testMatch: /school-admin\/.*\.spec\.ts/, dependencies: ["setup"], use: { storageState: authFile("schoolAdmin") } },
    { name: "teacher", testMatch: /teacher\/.*\.spec\.ts/, dependencies: ["setup"], use: { storageState: authFile("teacher") } },
    { name: "student", testMatch: /student\/.*\.spec\.ts/, dependencies: ["setup"], use: { storageState: authFile("student") } },
    // Role switching / access-control checks log in on their own.
    { name: "rbac", testMatch: /rbac\/.*\.spec\.ts/, dependencies: ["setup"] },
  ],
});
