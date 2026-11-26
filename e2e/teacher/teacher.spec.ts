import { test, expect } from "@playwright/test";
import { visitAndCheck } from "../support/ui";
import { readFixtures } from "../support/provision";

const PAGES = [
  "/teaching",
  "/teaching/assignments",
  "/teaching/assignments/new",
  "/teaching/local",
  "/teaching/local/new",
  "/teaching/local/stories",
  "/teaching/local/trash",
  "/teaching/local/quizzes/new",
  "/teaching/token-requests",
  "/classes",
  "/map/class",
  "/characters",
  "/library",
  "/profile",
  "/chat-history",
];

test.describe("Giáo viên — các màn hình", () => {
  for (const path of PAGES) {
    test(`TCH-PAGE ${path}`, async ({ page }) => {
      await visitAndCheck(page, path);
    });
  }

  test("TCH-CLS-01 lớp được phân công hiện trong /classes và mở được", async ({ page }) => {
    const f = readFixtures()!;
    await visitAndCheck(page, "/classes");
    await expect(page.getByText(f.className).first()).toBeVisible();
    await visitAndCheck(page, `/classes/${f.classId}`);
    await page.getByRole("tab", { name: /^Học sinh/ }).click();
    await expect(page.getByText(f.students[0].code).first()).toBeVisible();
  });

  test("TCH-ASG-01 tạo bài tập: bỏ trống tiêu đề thì không gửi", async ({ page }) => {
    await visitAndCheck(page, "/teaching/assignments/new");
    let sent = false;
    page.on("request", (r) => {
      if (r.method() === "POST" && r.url().includes("/teacher/assignments")) sent = true;
    });
    // Either the submit button is locked while the form is empty, or clicking it must not send anything.
    const submit = page.getByRole("main").getByRole("button", { name: /Giao bài|Tạo bài|Lưu/ }).last();
    if (await submit.isEnabled()) await submit.click({ timeout: 5_000 }).catch(() => {});
    await page.waitForTimeout(800);
    expect(sent).toBe(false);
  });

  test("TCH-LOCAL-01 mở nội dung địa phương đầu tiên (nếu có)", async ({ page }) => {
    await visitAndCheck(page, "/teaching/local");
    const link = page.locator('a[href^="/teaching/local/"]').filter({ hasNotText: /Tạo|Thùng rác|Truyện/ }).first();
    test.skip((await link.count()) === 0, "Chưa có nội dung địa phương");
    await visitAndCheck(page, (await link.getAttribute("href"))!);
  });
});
