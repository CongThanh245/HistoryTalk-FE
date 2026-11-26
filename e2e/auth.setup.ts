import { test as setup, expect } from "@playwright/test";
import { ROLES, authFile } from "./support/env";
import { credentialsFor, provision } from "./support/provision";
import { loginViaForm } from "./support/ui";

const HOME: Record<(typeof ROLES)[number], RegExp> = {
  systemAdmin: /\/staff\/admin/,
  contentAdmin: /\/staff/,
  customer: /\/home/,
  schoolAdmin: /\/school/,
  teacher: /\/teaching/,
  student: /\/classes/,
};

setup.describe.configure({ mode: "serial" });

for (const role of ROLES) {
  setup(`đăng nhập qua form: ${role}`, async ({ page }) => {
    const fixtures = await provision();
    const { email, password } = credentialsFor(role, fixtures);
    await loginViaForm(page, email, password);
    await expect(page).toHaveURL(HOME[role], { timeout: 60_000 });
    await page.context().storageState({ path: authFile(role) });
  });
}
