import { test, expect, type Page } from "@playwright/test";
import { api, login } from "../support/api";
import { readFixtures } from "../support/provision";
import { loginViaForm } from "../support/ui";
import { E2E_PASSWORD } from "../support/env";

/** Opens whichever account menu holds "Đăng xuất" (sidebar card or header avatar) and logs out. */
async function logoutViaMenu(page: Page) {
  const triggers = page.locator('[aria-haspopup="menu"]');
  const count = await triggers.count();
  for (let i = count - 1; i >= 0; i--) {
    const t = triggers.nth(i);
    if (!(await t.isVisible())) continue;
    await t.click();
    const item = page.getByRole("menuitem", { name: "Đăng xuất" });
    if (await item.isVisible().catch(() => false)) {
      await item.click();
      return;
    }
    await page.keyboard.press("Escape");
  }
  throw new Error("Không tìm thấy menu Đăng xuất");
}

test.describe("Phiên đăng nhập", () => {
  test("FE-WF1-06 đăng xuất rồi bấm Back không hiện lại vỏ trang School Admin", async ({ page }) => {
    const f = readFixtures()!;
    await loginViaForm(page, f.schoolAdmin.email, f.schoolAdmin.password);
    await expect(page).toHaveURL(/\/school/);
    await page.goto("/school/tokens");
    await expect(page.getByText("Hạn mức token mỗi ngày")).toBeVisible();

    await logoutViaMenu(page);
    await expect(page).toHaveURL(/\/login/);
    await page.goBack();
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
    await expect(page.getByText("Hạn mức token mỗi ngày")).toHaveCount(0);
  });

  test("FE-WF1-06 đăng xuất System Admin rồi Back về /staff/admin/payment/history", async ({ page }) => {
    await loginViaForm(page, "systemadmin@historytalk.com", "123456789");
    await expect(page).toHaveURL(/\/staff\/admin/);
    await page.goto("/staff/admin/payment/history");
    await logoutViaMenu(page);
    await expect(page).toHaveURL(/\/login/);
    await page.goBack();
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
  });

  test("FE-WF1-04 giáo viên bị khóa đăng nhập → thông báo trung tính, không nhắc 'học sinh tốt nghiệp'", async ({ page }) => {
    const f = readFixtures()!;
    const sa = await login(f.schoolAdmin.email, f.schoolAdmin.password);
    const stamp = Date.now().toString().slice(-6);
    const email = `gv.lock.${stamp}@e2etest.edu.vn`;
    const t = await api<{ uid: string; initialPassword: string }>("POST", "/school-admin/teachers", {
      token: sa.accessToken,
      body: { fullName: `GV Khóa ${stamp}`, email },
    });
    await api("PUT", `/school-admin/teachers/${t.uid}/status`, { token: sa.accessToken, body: { active: false } });

    await loginViaForm(page, email, t.initialPassword);
    await expect(page.getByText(/vô hiệu hóa|ngừng hoạt động/).first()).toBeVisible();
    await expect(page.getByText(/học sinh đã tốt nghiệp/)).toHaveCount(0);
    await expect(page).toHaveURL(/\/login/);
  });

  test("AUTH-FIRST đăng nhập lần đầu bắt buộc đổi mật khẩu (không đóng được hộp thoại)", async ({ page }) => {
    const f = readFixtures()!;
    const sa = await login(f.schoolAdmin.email, f.schoolAdmin.password);
    const stamp = Date.now().toString().slice(-6);
    const email = `gv.first.${stamp}@e2etest.edu.vn`;
    const t = await api<{ initialPassword: string }>("POST", "/school-admin/teachers", { token: sa.accessToken, body: { fullName: `GV Lần Đầu ${stamp}`, email } });

    await loginViaForm(page, email, t.initialPassword);
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 30_000 });
    await page.keyboard.press("Escape");
    await expect(dialog).toBeVisible();

    const pw = dialog.locator('input[type="password"]');
    await pw.nth(0).fill(t.initialPassword);
    await pw.nth(1).fill(E2E_PASSWORD);
    await pw.nth(2).fill(E2E_PASSWORD);
    await dialog.getByRole("button", { name: /Đổi mật khẩu|Lưu|Xác nhận/ }).click();
    await expect(dialog).toBeHidden({ timeout: 20_000 });
    await expect(page).toHaveURL(/\/teaching/);
  });
});
