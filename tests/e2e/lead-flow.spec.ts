import path from "node:path";
import { expect, test } from "@playwright/test";

const RESUME_FIXTURE = path.join(
  process.cwd(),
  "tests/e2e/fixtures/resume.pdf",
);

/** Enters the demo with the given email (the start-screen gate). */
async function enterDemo(page: import("@playwright/test").Page, email: string) {
  await page.goto("/");
  await page.getByLabel("Your email").fill(email);
  await page.getByRole("button", { name: "Enter demo" }).click();
  // The header nav appears once signed in.
  await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible();
}

test("demo: submit a lead, then see and resolve it on the dashboard", async ({
  page,
}) => {
  const attorney = `attorney-${Date.now()}@example.com`;
  const prospect = `prospect-${Date.now()}@example.com`;

  // Enter the demo as the attorney.
  await enterDemo(page, attorney);

  // The signed-in email is shown bottom-right.
  await expect(page.getByText(`Signed in as ${attorney}`)).toBeVisible();

  // Submit a lead.
  await page.goto("/leads/new");
  await page.fill("#firstName", "E2E");
  await page.fill("#lastName", "Tester");
  await page.fill("#email", prospect);
  await page.setInputFiles("#resume", RESUME_FIXTURE);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/leads\/thank-you/);
  await expect(page.getByText("Application received")).toBeVisible();

  // The lead shows up on the dashboard and can be marked reached out.
  await page.goto("/dashboard");
  const row = page.locator("tr", { hasText: prospect });
  await expect(row).toBeVisible();
  await expect(row.getByText("Pending")).toBeVisible();
  await row.getByRole("button", { name: "Mark reached out" }).click();
  await expect(
    page.locator("tr", { hasText: prospect }).getByText("Reached out"),
  ).toBeVisible();
});

test("the dashboard is gated until you enter the demo", async ({ page }) => {
  // Visiting the dashboard without a session redirects to the start screen.
  await page.goto("/dashboard");
  await expect(page.getByRole("button", { name: "Enter demo" })).toBeVisible();
});
