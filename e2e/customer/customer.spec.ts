import { test, expect } from "@playwright/test";
import { visitAndCheck } from "../support/ui";
import { mockAi, openChat, MOCK_REPLY } from "../support/ai-mock";
import { api, login } from "../support/api";
import { SEED } from "../support/env";

const PAGES = ["/home", "/characters", "/library", "/map", "/quiz", "/saved", "/profile", "/pricing", "/payment/history", "/chat-history", "/grades", "/events", "/"];

test.describe("Customer (B2C) — các màn hình", () => {
  for (const path of PAGES) {
    test(`CU-PAGE ${path}`, async ({ page }) => {
      await visitAndCheck(page, path);
    });
  }

  test("CU-QUIZ mở quiz đầu tiên", async ({ page }) => {
    await visitAndCheck(page, "/quiz");
    const link = page.locator('a[href^="/quiz/"]').first();
    test.skip((await link.count()) === 0, "Chưa có quiz");
    await visitAndCheck(page, (await link.getAttribute("href"))!);
  });

  test("CU-PAY trang kết quả thanh toán success/cancel hiển thị", async ({ page }) => {
    await visitAndCheck(page, "/payment/success");
    await visitAndCheck(page, "/payment/cancel");
  });
});

test.describe("Customer — chat AI (giả lập)", () => {
  test("CU-CHAT-01 gửi tin nhắn, nhận câu trả lời stream từ AI giả lập", async ({ page }) => {
    const { accessToken } = await login(SEED.customer.email, SEED.customer.password);
    const scenarios = await api<{ characterId: string; contextId: string }[]>("GET", "/chat/scenarios", { token: accessToken });
    const first = scenarios[0];
    test.skip(!first, "Chưa có kịch bản chat trong DB dev");
    const { characterId, contextId } = first;

    await mockAi(page);
    const input = await openChat(page, characterId, contextId);
    await expect(input).toBeVisible();
    await input.fill("Xin chào, ngài là ai?");
    await input.press("Enter");
    await expect(page.getByText("Xin chào, ngài là ai?")).toBeVisible();
    await expect(page.getByText(MOCK_REPLY)).toBeVisible({ timeout: 30_000 });
  });

  test("CU-CHAT-02 AI lỗi giữa chừng thì báo lỗi, không treo ở trạng thái đang trả lời", async ({ page }) => {
    const { accessToken } = await login(SEED.customer.email, SEED.customer.password);
    const [first] = await api<{ characterId: string; contextId: string }[]>("GET", "/chat/scenarios", { token: accessToken });
    test.skip(!first, "Chưa có kịch bản chat trong DB dev");
    await mockAi(page);
    await page.route("**/chat/messages/stream", (route) =>
      route.fulfill({
        status: 200,
        headers: { "Content-Type": "text/event-stream" },
        body: `data: ${JSON.stringify({ type: "error", message: "AI tạm thời không khả dụng" })}

data: ${JSON.stringify({ type: "done" })}

`,
      }),
    );
    const input = await openChat(page, first.characterId, first.contextId);
    await input.fill("Câu hỏi làm AI lỗi");
    await input.press("Enter");
    // Some error feedback must show, and the box must be usable again.
    await expect(page.getByText(/lỗi|không khả dụng|thử lại/i).first()).toBeVisible({ timeout: 20_000 });
    await expect(input).toBeEnabled();
  });
});
