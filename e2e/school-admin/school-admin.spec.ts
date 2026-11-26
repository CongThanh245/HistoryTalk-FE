import { test, expect, type Page } from "@playwright/test";
import { visitAndCheck, watchPage } from "../support/ui";
import { readFixtures } from "../support/provision";

const PAGES = ["/school", "/school/classes", "/school/students", "/school/teachers", "/school/tokens", "/school/content"];

test.describe("School Admin — các màn hình", () => {
  for (const path of PAGES) {
    test(`SCH-PAGE ${path}`, async ({ page }) => {
      await visitAndCheck(page, path);
    });
  }

  test("SCH-CLS-01 chi tiết lớp E2E hiển thị học sinh đã nhập", async ({ page }) => {
    const f = readFixtures()!;
    await visitAndCheck(page, `/school/classes/${f.classId}`);
    await expect(page.getByText(f.students[0].code).first()).toBeVisible();
  });

  test("SCH-TCH-01 danh sách giáo viên có giáo viên E2E", async ({ page }) => {
    const f = readFixtures()!;
    await visitAndCheck(page, "/school/teachers");
    await expect(page.getByText(f.teacher.email).first()).toBeVisible();
  });
});

// ── FE-WF1-01: daily limits survive save + reload ─────────────────────────────

const quotaCard = (page: Page, label: string) => page.locator("div.rounded-lg", { has: page.getByText(label, { exact: true }) }).first();

async function setQuota(page: Page, label: string, value: number) {
  const card = quotaCard(page, label);
  await card.getByRole("button", { name: "Sửa" }).click();
  await card.getByRole("textbox", { name: label }).fill(String(value));
  const saved = page.waitForResponse((r) => r.url().includes("/school-admin/token-policy") && r.request().method() === "PUT");
  await card.getByRole("button", { name: /Lưu/ }).click();
  expect((await saved).ok()).toBe(true);
}

test.describe.serial("FE-WF1-01 hạn mức token mỗi ngày", () => {
  test("đổi HS 2.000 / GV 4.000 → hiện ngay, F5 vẫn giữ", async ({ page }) => {
    await visitAndCheck(page, "/school/tokens");
    await setQuota(page, "Mỗi học sinh", 2000);
    await expect(quotaCard(page, "Mỗi học sinh")).toContainText("2.000");
    await setQuota(page, "Mỗi giáo viên", 4000);
    await expect(quotaCard(page, "Mỗi giáo viên")).toContainText("4.000");
    // Student value must not jump back to 5.000 after the teacher save.
    await expect(quotaCard(page, "Mỗi học sinh")).toContainText("2.000");

    await page.reload();
    await expect(quotaCard(page, "Mỗi học sinh")).toContainText("2.000");
    await expect(quotaCard(page, "Mỗi giáo viên")).toContainText("4.000");
  });

  test("đặt lại về 5.000 / 5.000", async ({ page }) => {
    await page.goto("/school/tokens");
    await setQuota(page, "Mỗi học sinh", 5000);
    await setQuota(page, "Mỗi giáo viên", 5000);
    await page.reload();
    await expect(quotaCard(page, "Mỗi học sinh")).toContainText("5.000");
    await expect(quotaCard(page, "Mỗi giáo viên")).toContainText("5.000");
  });

  test("dưới mức tối thiểu thì nút Lưu bị khóa", async ({ page }) => {
    await page.goto("/school/tokens");
    const card = quotaCard(page, "Mỗi học sinh");
    await card.getByRole("button", { name: "Sửa" }).click();
    await card.getByRole("textbox", { name: "Mỗi học sinh" }).fill("1");
    await expect(card.getByText(/Tối thiểu/)).toBeVisible();
    await expect(card.getByRole("button", { name: /Lưu/ })).toBeDisabled();
  });
});

// ── FE-WF1-02 / 05: CSV import on the class page ──────────────────────────────

async function openImport(page: Page, classId: string) {
  await page.goto(`/school/classes/${classId}`);
  await page.getByRole("button", { name: /Nhập CSV/ }).click();
  const dialog = page.getByRole("dialog", { name: /Nhập học sinh từ CSV/ });
  await expect(dialog).toBeVisible();
  return dialog;
}

async function chooseCsv(dialog: ReturnType<Page["getByRole"]>, name: string, csv: string) {
  await dialog.locator('input[type="file"]').setInputFiles({ name, mimeType: "text/csv", buffer: Buffer.from("﻿" + csv, "utf8") });
}

test.describe("FE-WF1-02 nhập CSV vào lớp", () => {
  test("nhập lại học sinh đã có trong lớp → xem trước báo trùng", async ({ page }) => {
    const f = readFixtures()!;
    const dialog = await openImport(page, f.classId);
    const s = f.students[0];
    await chooseCsv(dialog, "trung.csv", `student_code,full_name,email,dob\n${s.code},Học Sinh Một,${s.email},15/01/2010\n`);
    await expect(dialog.getByText("Học sinh đã có trong lớp này").first()).toBeVisible({ timeout: 20_000 });
  });

  test("nút Xong reset modal: mở lại thấy màn chọn file", async ({ page }) => {
    const f = readFixtures()!;
    const stamp = Date.now().toString().slice(-6);
    const dialog = await openImport(page, f.classId);
    await chooseCsv(dialog, "moi.csv", `student_code,full_name,email,dob,gender\nN${stamp},HS Mới ${stamp},new${stamp}@e2etest.edu.vn,10/05/2010,MALE\n`);
    const submit = dialog.getByRole("button", { name: /Nhập \d+ học sinh vào lớp/ });
    await expect(submit).toBeEnabled({ timeout: 20_000 });
    await submit.click();
    // Result: one new account, none wrongly counted.
    await expect(dialog.getByText("Tài khoản mới", { exact: true })).toBeVisible();
    await dialog.getByRole("button", { name: "Xong" }).click();
    await expect(dialog).toBeHidden();

    const again = await openImport(page, f.classId);
    await expect(again.getByText("Bấm để chọn file .csv")).toBeVisible();
  });

  test("kết quả nhập lại HS có sẵn không báo 'Tài khoản mới' và có ô 'Đã có trong lớp'", async ({ page }) => {
    const f = readFixtures()!;
    const dialog = await openImport(page, f.classId);
    const s = f.students[1];
    await chooseCsv(dialog, "lai.csv", `student_code,full_name,email,dob\n${s.code},Học Sinh Hai,${s.email},15/02/2010\n`);
    // The preview flags the row; untick nothing — the duplicate row is locked, so nothing can be sent.
    await expect(dialog.getByText("Học sinh đã có trong lớp này").first()).toBeVisible({ timeout: 20_000 });
    await expect(dialog.getByRole("button", { name: /Phiếu tài khoản mới/ })).toHaveCount(0);
  });

  test("FE-WF1-05 file thiếu cột họ tên + ngày sinh, HS chưa có trong trường → banner MSG27", async ({ page }) => {
    const f = readFixtures()!;
    const dialog = await openImport(page, f.classId);
    await chooseCsv(dialog, "thieu-cot.csv", "student_code,email,gender,phone_number\nZZ901,zz901@e2etest.edu.vn,MALE,0933000201\nZZ902,zz902@e2etest.edu.vn,FEMALE,0933000202\n");
    await expect(dialog.getByText("File không đúng định dạng danh sách học sinh")).toBeVisible({ timeout: 20_000 });
    await expect(dialog.getByRole("button", { name: /Nhập .*vào lớp/ })).toBeDisabled();
  });

  test("file .txt bị từ chối", async ({ page }) => {
    const f = readFixtures()!;
    const dialog = await openImport(page, f.classId);
    await dialog.locator('input[type="file"]').setInputFiles({ name: "sai.txt", mimeType: "text/plain", buffer: Buffer.from("abc") });
    await expect(dialog.getByText(/Chỉ nhận file \.csv/)).toBeVisible();
  });
});

test.describe("School Admin — tạo dữ liệu qua UI", () => {
  test("SCH-TCH-02 tạo giáo viên mới hiện mật khẩu cấp một lần", async ({ page }) => {
    const watch = watchPage(page);
    const stamp = Date.now().toString().slice(-6);
    await page.goto("/school/teachers");
    await page.getByRole("button", { name: /Thêm giáo viên|Tạo giáo viên|Thêm/ }).first().click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel(/Họ (và )?tên/).fill(`GV UI ${stamp}`);
    await dialog.getByLabel(/Email/).fill(`gv.ui.${stamp}@e2etest.edu.vn`);
    const created = page.waitForResponse((r) => r.url().includes("/school-admin/teachers") && r.request().method() === "POST");
    await dialog.getByRole("button", { name: /Tạo|Thêm|Lưu/ }).last().click();
    expect((await created).status()).toBe(201);
    await expect(page.getByText(/Ht@|Mật khẩu/).first()).toBeVisible();
    watch.expectClean();
  });

  test("SCH-TCH-03 email giáo viên trùng bị báo lỗi", async ({ page }) => {
    const f = readFixtures()!;
    await page.goto("/school/teachers");
    await page.getByRole("button", { name: /Thêm giáo viên|Tạo giáo viên|Thêm/ }).first().click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel(/Họ (và )?tên/).fill("GV Trùng Email");
    await dialog.getByLabel(/Email/).fill(f.teacher.email);
    await dialog.getByRole("button", { name: /Tạo|Thêm|Lưu/ }).last().click();
    await expect(page.getByText(/đã được dùng|đã tồn tại|trùng/i).first()).toBeVisible();
  });
});
