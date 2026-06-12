import path from "node:path";
import { expect, test } from "@playwright/test";

const RESUME_FIXTURE = path.join(
  process.cwd(),
  "tests/e2e/fixtures/resume.pdf",
);

test("prospect submits a lead and an attorney marks it reached out", async ({
  page,
}) => {
  const email = `e2e-${Date.now()}@example.com`;

  // 1. Prospect submits the public form.
  await page.goto("/leads/new");
  await page.fill("#firstName", "E2E");
  await page.fill("#lastName", "Tester");
  await page.fill("#email", email);
  await page.setInputFiles("#resume", RESUME_FIXTURE);
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL(/\/leads\/thank-you/);
  await expect(page.getByText("Application received")).toBeVisible();

  // 2. Attorney logs in.
  await page.goto("/login");
  await page.fill("#email", "attorney@alma.test");
  await page.fill("#password", "password123");
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/dashboard/);

  // 3. The new lead appears as Pending and can be marked reached out.
  const row = page.locator("tr", { hasText: email });
  await expect(row).toBeVisible();
  await expect(row.getByText("Pending")).toBeVisible();

  await row.getByRole("button", { name: "Mark reached out" }).click();

  await expect(
    page.locator("tr", { hasText: email }).getByText("Reached out"),
  ).toBeVisible();
});

test("dashboard requires authentication", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
});
