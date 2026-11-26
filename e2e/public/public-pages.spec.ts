import { test, expect } from "@playwright/test";
import { visitAndCheck, watchPage, expectNoErrorScreen } from "../support/ui";

// Guests: marketing pages render, protected pages send them to /login?next=…

const PUBLIC_PAGES = ["/", "/about", "/features", "/for-schools", "/pricing", "/privacy", "/terms", "/login", "/register", "/forgot-password", "/events"];

test.describe("Trang công khai (khách)", () => {
  for (const path of PUBLIC_PAGES) {
    test(`PUB-${path} hiển thị không lỗi`, async ({ page }) => {
      await visitAndCheck(page, path);
    });
  }

  const PROTECTED = ["/staff", "/staff/admin", "/school", "/school/tokens", "/classes", "/teaching", "/profile", "/assignments", "/grades", "/chat/abc"];
  for (const path of PROTECTED) {
    test(`PUB-GUARD ${path} → chuyển về /login?next=`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login\?next=/);
      expect(decodeURIComponent(new URL(page.url()).searchParams.get("next") ?? "")).toBe(path);
    });
  }

  test("PUB-404 đường dẫn không tồn tại hiện trang 404", async ({ page }) => {
    const res = await page.goto("/khong-ton-tai-e2e");
    expect(res?.status()).toBe(404);
  });
});

test.describe("Đăng nhập / Đăng ký", () => {
  test("AUTH-01 sai mật khẩu báo lỗi, ở lại trang đăng nhập", async ({ page }) => {
    await page.goto("/login");
    await page.locator("#email").fill("systemadmin@historytalk.com");
    await page.locator("#password").fill("SaiMatKhau123");
    await page.locator('form button[type="submit"]').click();
    await expect(page.getByText(/Đăng nhập thất bại/i)).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("AUTH-02 bỏ trống email/mật khẩu không gửi được", async ({ page }) => {
    await page.goto("/login");
    let sent = false;
    page.on("request", (r) => {
      if (r.url().includes("/auth/login")) sent = true;
    });
    await page.locator('form button[type="submit"]').click();
    await page.waitForTimeout(800);
    expect(sent).toBe(false);
    await expect(page).toHaveURL(/\/login/);
  });

  test("AUTH-03 đăng ký: mật khẩu xác nhận không khớp bị chặn", async ({ page }) => {
    const watch = watchPage(page);
    await page.goto("/register");
    await page.locator("#userName").fill("e2e_user");
    await page.locator("#email").fill(`e2e.${Date.now()}@example.com`);
    await page.locator("#password").fill("Matkhau@123");
    await page.locator("#confirmPassword").fill("Khac@1234");
    let sent = false;
    page.on("request", (r) => {
      if (r.url().includes("/auth/register")) sent = true;
    });
    await page.locator('form button[type="submit"]').click();
    await page.waitForTimeout(800);
    expect(sent).toBe(false);
    await expectNoErrorScreen(page);
    watch.expectClean();
  });

  test("AUTH-04 quên mật khẩu mở được hộp thoại từ trang đăng nhập", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Quên mật khẩu?" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
  });
});
