import { expect, type Page } from "@playwright/test";

export async function loginViaForm(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.locator('form button[type="submit"]').click();
}

/**
 * Collects what breaks a page silently: uncaught exceptions, console errors and API 5xx answers.
 * Known noise (dev-only warnings, third-party telemetry, aborted requests) is filtered out.
 */
export function watchPage(page: Page) {
  const problems: string[] = [];
  const ignore = [/Download the React DevTools/, /\[Fast Refresh\]/, /favicon/, /hydrat/i, /ERR_ABORTED/, /net::ERR_/, /Failed to load resource/, /google|gtag|analytics|vercel/i, /ResizeObserver/];
  page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error" && !ignore.some((r) => r.test(m.text()))) problems.push(`console: ${m.text().slice(0, 300)}`);
  });
  page.on("response", (r) => {
    if (r.status() >= 500 && /\/api\/v1\//.test(r.url())) problems.push(`HTTP ${r.status()} ${r.request().method()} ${r.url().replace(/^.*\/api\/v1/, "")}`);
  });
  return {
    problems,
    expectClean: () => expect(problems, problems.join("\n")).toEqual([]),
  };
}

/** Next's own error screens and our app-level error boundaries. */
export async function expectNoErrorScreen(page: Page) {
  await expect(page.getByText(/Application error|Unhandled Runtime Error|This page could not be found|Đã xảy ra lỗi không mong muốn/i)).toHaveCount(0);
}

/** Opens a route and checks it renders: right URL, a heading, no crash screen, no console/5xx errors. */
export async function visitAndCheck(page: Page, path: string, opts: { heading?: RegExp | string; url?: RegExp } = {}) {
  const watch = watchPage(page);
  const res = await page.goto(path);
  expect(res?.status() ?? 200, `HTTP status of ${path}`).toBeLessThan(400);
  await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => {});
  if (opts.url) await expect(page).toHaveURL(opts.url);
  await expectNoErrorScreen(page);
  if (opts.heading) await expect(page.getByRole("heading", { name: opts.heading }).first()).toBeVisible();
  else await expect(page.locator("h1, h2").first()).toBeVisible();
  watch.expectClean();
  return watch;
}
