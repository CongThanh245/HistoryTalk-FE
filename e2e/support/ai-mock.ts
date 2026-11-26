import type { Page } from "@playwright/test";

export const MOCK_REPLY = "Xin chào, ta là nhân vật lịch sử (phản hồi giả lập E2E).";

/**
 * The AI service does not run locally, so every call that would reach it is answered here:
 *  - POST /chat/messages/stream → SSE in the BE format (text chunks, metadata, done)
 *  - POST /chat/messages/check  → content is fine
 *  - POST /chat/messages        → non-stream reply
 *  - /ai-authoring/**           → a finished job
 * This checks the chat UI, not answer quality.
 */
export async function mockAi(page: Page, reply = MOCK_REPLY) {
  await page.route("**/chat/messages/stream", async (route) => {
    const words = reply.split(" ");
    const events = [
      ...words.map((w, i) => ({ type: "text", data: (i ? " " : "") + w })),
      { type: "metadata", data: { suggestedQuestions: ["Ngài sinh năm nào?", "Trận đánh nổi tiếng nhất?"], promptTokens: 10, completionTokens: 20 } },
      { type: "done", remainingTokens: 4970, messageType: "TEXT" },
    ];
    await route.fulfill({
      status: 200,
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
      body: events.map((e) => `data: ${JSON.stringify(e)}\n\n`).join(""),
    });
  });
  await page.route("**/chat/messages/check", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data: null }) }));
  await page.route(/\/chat\/messages$/, (route) =>
    route.request().method() === "POST"
      ? route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true, data: { content: reply, role: "ASSISTANT", remainingTokens: 4970 } }),
        })
      : route.continue(),
  );
}

/** Opens a chat and accepts the one-time "Trước khi trò chuyện" AI disclaimer when it shows. Returns the message box. */
export async function openChat(page: Page, characterId: string, contextId: string) {
  await page.goto(`/chat/${characterId}?contextId=${contextId}&mode=chat`);
  const input = page.getByRole("textbox", { name: /^Nhắn tin với/ });
  const accept = page.getByRole("button", { name: "Tôi đã hiểu, bắt đầu trò chuyện" });
  await accept.or(input).first().waitFor();
  if (await accept.isVisible()) await accept.click();
  await input.waitFor();
  return input;
}
