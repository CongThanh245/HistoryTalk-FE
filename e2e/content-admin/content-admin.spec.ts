import { test, expect } from "@playwright/test";
import { expectNoErrorScreen, visitAndCheck, watchPage } from "../support/ui";

const PAGES = [
  "/staff",
  "/staff/characters",
  "/staff/characters/create",
  "/staff/contexts",
  "/staff/contexts/create",
  "/staff/documents",
  "/staff/map",
  "/staff/quests",
  "/staff/quizzes",
  "/staff/stories",
];

test.describe("Content Admin — các màn hình", () => {
  for (const path of PAGES) {
    test(`CA-PAGE ${path}`, async ({ page }) => {
      await visitAndCheck(page, path);
    });
  }

  // Detail pages: open the first item of each list, whatever the dev DB holds.
  for (const kind of ["characters", "contexts", "stories"] as const) {
    test(`CA-DETAIL mở chi tiết ${kind} đầu tiên`, async ({ page }) => {
      await visitAndCheck(page, `/staff/${kind}`);
      const link = page.locator(`a[href^="/staff/${kind}/"]:not([href$="/create"])`).first();
      test.skip((await link.count()) === 0, `Chưa có ${kind} trong DB dev`);
      const href = await link.getAttribute("href");
      // The story editor is a full-screen canvas without a page heading; its settings panel names the story.
      if (kind === "stories") {
        const watch = watchPage(page);
        await page.goto(href!);
        await expectNoErrorScreen(page);
        await expect(page.getByText("Tên kịch bản")).toBeVisible();
        watch.expectClean();
      } else {
        await visitAndCheck(page, href!);
      }
    });
  }

  test("CA-CHAR-01 tạo nhân vật: bỏ trống bắt buộc thì không gửi", async ({ page }) => {
    await visitAndCheck(page, "/staff/characters/create");
    let sent = false;
    page.on("request", (r) => {
      if (r.method() === "POST" && /\/characters(\?|$)/.test(r.url())) sent = true;
    });
    const submit = page.getByRole("button", { name: /Tạo|Lưu/ }).last();
    if (await submit.isEnabled()) await submit.click();
    await page.waitForTimeout(800);
    expect(sent).toBe(false);
  });

  test("CA-SEARCH tìm kiếm nhân vật không làm vỡ trang", async ({ page }) => {
    await visitAndCheck(page, "/staff/characters");
    const box = page.getByRole("searchbox").or(page.getByPlaceholder(/Tìm/i)).first();
    await box.fill("zzz-khong-co-e2e");
    await page.waitForTimeout(800);
    await expect(page.locator("body")).not.toContainText("Application error");
  });
});
