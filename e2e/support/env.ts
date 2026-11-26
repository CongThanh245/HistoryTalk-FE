/**
 * E2E environment. Defaults: FE production build on :3456 (started by Playwright), Java BE on :8080 (run-historytalk.ps1).
 * Override with E2E_BASE_URL / E2E_API_URL. Never point the write-heavy suites at production.
 */
export const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3456";
export const API_URL = process.env.E2E_API_URL ?? "http://localhost:8080/Historical-tell/api/v1";

/** Seeded platform accounts (dev DB). */
export const SEED = {
  systemAdmin: { email: process.env.E2E_SYSADMIN_EMAIL ?? "systemadmin@historytalk.com", password: process.env.E2E_SYSADMIN_PASSWORD ?? "123456789" },
  contentAdmin: { email: process.env.E2E_CONTENT_EMAIL ?? "contentadmin@historytalk.com", password: process.env.E2E_CONTENT_PASSWORD ?? "123456789" },
  customer: { email: process.env.E2E_CUSTOMER_EMAIL ?? "customer@gmail.com", password: process.env.E2E_CUSTOMER_PASSWORD ?? "123456789" },
};

/** Password every provisioned school account is switched to after its forced first change. */
export const E2E_PASSWORD = "E2eTest@2026";

export const ROLES = ["systemAdmin", "contentAdmin", "customer", "schoolAdmin", "teacher", "student"] as const;
export type Role = (typeof ROLES)[number];

export const authFile = (role: Role) => `e2e/.auth/${role}.json`;
export const FIXTURE_FILE = "e2e/.auth/fixtures.json";
