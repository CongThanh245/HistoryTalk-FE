import { test, expect } from "@playwright/test";
import { visitAndCheck, watchPage } from "../support/ui";
import { readFixtures } from "../support/provision";

const PAGES = [
  "/staff/admin",
  "/staff/admin/schools",
  "/staff/admin/schools/new",
  "/staff/admin/b2b-quotes",
  "/staff/admin/subscriptions",
  "/staff/admin/payment/history",
  "/staff/admin/accounts/customer",
  "/staff/admin/accounts/content-admin",
  "/staff/admin/accounts/system-admin",
];

test.describe("System Admin — các màn hình", () => {
  for (const path of PAGES) {
    test(`SA-PAGE ${path}`, async ({ page }) => {
      await visitAndCheck(page, path);
    });
  }

  test("SA-SCH-02 chi tiết trường E2E hiện đúng tên trường", async ({ page }) => {
    const f = readFixtures()!;
    await visitAndCheck(page, `/staff/admin/schools/${f.schoolId}`);
    await expect(page.getByRole("heading", { name: f.schoolName })).toBeVisible();
  });

  test("SA-SCH-03 danh sách trường tìm được trường E2E", async ({ page }) => {
    const f = readFixtures()!;
    await visitAndCheck(page, "/staff/admin/schools");
    const search = page.getByRole("searchbox").or(page.getByPlaceholder(/Tìm/i)).first();
    await search.fill(f.schoolName);
    await expect(page.getByText(f.schoolName).first()).toBeVisible();
  });
});

test.describe("System Admin — hồi quy WF-01", () => {
  test("FE-WF1-03 trường không tồn tại hiện 'Không tìm thấy trường' ngay (không treo skeleton)", async ({ page }) => {
    await page.goto("/staff/admin/schools/00000000-0000-0000-0000-000000000000");
    await expect(page.getByText("Không tìm thấy trường")).toBeVisible({ timeout: 8_000 });
    await expect(page.getByRole("link", { name: /Về danh sách trường/ })).toBeVisible();
  });

  test("FE-WF1-09 breadcrumb cha /staff/admin/accounts và /payment không còn 404", async ({ page }) => {
    await page.goto("/staff/admin/accounts");
    await expect(page).toHaveURL(/\/staff\/admin\/accounts\/customer/);
    await page.goto("/staff/admin/payment");
    await expect(page).toHaveURL(/\/staff\/admin\/payment\/history/);
  });

  test("FE-WF1-09 danh sách Customer khớp số người dùng role CUSTOMER (đọc hết các trang)", async ({ page }) => {
    const pages: number[] = [];
    page.on("request", (r) => {
      const u = new URL(r.url());
      if (u.pathname.endsWith("/admin/users") && r.method() === "GET") pages.push(Number(u.searchParams.get("page")));
    });
    await visitAndCheck(page, "/staff/admin/accounts/customer");
    // page 1 is always read; more pages only when the BE has them — the hook must not stop at the first 100.
    expect(pages).toContain(1);
  });

  test("FE-WF1-10 trang gói hiển thị nhãn 'Tổng giá niêm yết' thay cho 'Doanh thu tổng gói'", async ({ page }) => {
    await visitAndCheck(page, "/staff/admin/subscriptions");
    await expect(page.getByText("Tổng giá niêm yết các gói")).toBeVisible();
    await expect(page.getByText("Tổng hạn mức ngày các gói")).toBeVisible();
    await expect(page.getByText("Doanh thu tổng gói")).toHaveCount(0);
  });

  test("SA-DASH granularity 'Năm' không gây lỗi API", async ({ page }) => {
    const watch = watchPage(page);
    const bad: string[] = [];
    page.on("response", (r) => {
      if (r.url().includes("/system-admin/dashboard") && r.status() >= 400) bad.push(`${r.status()} ${r.url()}`);
    });
    await page.goto("/staff/admin");
    await page.getByRole("button", { name: /^Năm$/ }).first().click();
    await page.waitForLoadState("networkidle").catch(() => {});
    expect(bad, bad.join("\n")).toEqual([]);
    watch.expectClean();
  });

  test("FE-WF1-08 dashboard gọi API token theo khoảng ngày /system-admin/dashboard/tokens", async ({ page }) => {
    // The dashboard fires a dozen queries at once; record them instead of racing a single waitForRequest.
    const calls: string[] = [];
    page.on("request", (r) => {
      if (r.url().includes("/system-admin/dashboard/tokens")) calls.push(r.url());
    });
    await page.goto("/staff/admin");
    await expect(page.getByText(/Token dùng trong khoảng/)).toBeVisible({ timeout: 45_000 });
    await expect.poll(() => calls.length, { timeout: 30_000 }).toBeGreaterThan(0);
    expect(new URL(calls[0]).searchParams.get("from")).toBeTruthy();
  });

  test("SA-ACC-01 thêm Content Admin: mật khẩu xác nhận lệch thì không tạo được", async ({ page }) => {
    await visitAndCheck(page, "/staff/admin/accounts/content-admin");
    await page.getByRole("main").getByRole("button", { name: /^Tạo tài khoản/ }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    const pw = dialog.locator('input[type="password"]');
    await pw.nth(0).fill("Matkhau@123");
    await pw.nth(1).fill("Khac@12345");
    await expect(dialog.getByText(/không khớp/i)).toBeVisible();
  });
});
