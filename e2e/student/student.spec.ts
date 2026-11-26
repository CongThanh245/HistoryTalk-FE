import { test, expect } from "@playwright/test";
import { visitAndCheck } from "../support/ui";
import { readFixtures } from "../support/provision";
import { mockAi, openChat, MOCK_REPLY } from "../support/ai-mock";
import { api, login } from "../support/api";

const PAGES = ["/classes", "/classes/materials", "/assignments", "/grades", "/characters", "/library", "/map", "/map/class", "/quiz", "/saved", "/profile", "/chat-history", "/events"];

test.describe("Học sinh — các màn hình", () => {
  for (const path of PAGES) {
    test(`STU-PAGE ${path}`, async ({ page }) => {
      await visitAndCheck(page, path);
    });
  }

  test("STU-CLS-01 học sinh thấy lớp của mình và mở được", async ({ page }) => {
    const f = readFixtures()!;
    await visitAndCheck(page, "/classes");
    await expect(page.getByText(f.className).first()).toBeVisible();
    await visitAndCheck(page, `/classes/${f.classId}`);
  });

  test("STU-CLS-02 học sinh không mở được lớp không thuộc mình", async ({ page }) => {
    await page.goto("/classes/00000000-0000-0000-0000-000000000000");
    await expect(page.getByText(/Không tìm thấy|không có quyền|không thuộc/i).first()).toBeVisible();
  });

  test("STU-CHAT-01 chat với nhân vật (AI giả lập), không hiện trang mua gói", async ({ page }) => {
    const f = readFixtures()!;
    const { accessToken } = await login(f.students[0].email, f.students[0].password);
    const [first] = await api<{ characterId: string; contextId: string }[]>("GET", "/chat/scenarios", { token: accessToken });
    test.skip(!first, "Chưa có kịch bản chat");
    await mockAi(page);
    const input = await openChat(page, first.characterId, first.contextId);
    await input.fill("Chào ngài");
    await input.press("Enter");
    await expect(page.getByText(MOCK_REPLY)).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/Nâng cấp gói/)).toHaveCount(0);
  });
});
