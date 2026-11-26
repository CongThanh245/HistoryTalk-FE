import { test, expect, type Browser } from "@playwright/test";
import { authFile, type Role } from "../support/env";

// Role matrix enforced by src/middlewares/auth.middleware.ts: each role opening a page outside its area lands on its home.

const HOME: Record<Role, string> = {
  systemAdmin: "/staff/admin",
  contentAdmin: "/staff",
  customer: "/home",
  schoolAdmin: "/school",
  teacher: "/teaching",
  student: "/classes",
};

const FORBIDDEN: Record<Role, { path: string; to: string }[]> = {
  systemAdmin: [
    { path: "/staff/characters", to: "/staff/admin" },
    { path: "/home", to: "/staff/admin" },
    { path: "/school", to: "/staff/admin" },
    { path: "/login", to: "/staff/admin" },
  ],
  contentAdmin: [
    { path: "/staff/admin", to: "/staff" },
    { path: "/staff/admin/schools", to: "/staff" },
    { path: "/home", to: "/staff" },
    { path: "/school", to: "/staff" },
  ],
  customer: [
    { path: "/staff", to: "/home" },
    { path: "/school", to: "/home" },
    { path: "/classes", to: "/home" },
    { path: "/teaching", to: "/home" },
    { path: "/assignments", to: "/home" },
  ],
  schoolAdmin: [
    { path: "/home", to: "/school" },
    { path: "/staff", to: "/school" },
    { path: "/teaching", to: "/school" },
    { path: "/payment/history", to: "/school/tokens" },
  ],
  teacher: [
    { path: "/staff", to: "/teaching" },
    { path: "/school", to: "/teaching" },
    { path: "/pricing", to: "/teaching" },
    { path: "/assignments", to: "/teaching" },
    { path: "/grades", to: "/teaching" },
  ],
  student: [
    { path: "/staff", to: "/classes" },
    { path: "/school", to: "/classes" },
    { path: "/teaching", to: "/classes" },
    { path: "/pricing", to: "/classes" },
    { path: "/payment/history", to: "/classes" },
  ],
};

async function asRole(browser: Browser, role: Role) {
  const context = await browser.newContext({ storageState: authFile(role) });
  return { context, page: await context.newPage() };
}

for (const role of Object.keys(FORBIDDEN) as Role[]) {
  test.describe(`RBAC ${role}`, () => {
    test(`RBAC-${role}-HOME trang chủ của role mở được`, async ({ browser }) => {
      const { context, page } = await asRole(browser, role);
      await page.goto(HOME[role]);
      await expect(page).toHaveURL(new RegExp(`${HOME[role]}(\\?|$)`));
      await context.close();
    });

    for (const { path, to } of FORBIDDEN[role]) {
      test(`RBAC-${role} ${path} → ${to}`, async ({ browser }) => {
        const { context, page } = await asRole(browser, role);
        await page.goto(path);
        await expect(page).toHaveURL(new RegExp(`${to.replace(/\//g, "\\/")}(\\?|$)`));
        await context.close();
      });
    }
  });
}
