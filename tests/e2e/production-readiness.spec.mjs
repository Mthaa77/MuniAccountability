import { expect, test } from "@playwright/test";

test.describe("Production readiness gate-room", () => {
  test("admin gate-room exposes readiness, evidence gates and promotion rules", async ({ page }) => {
    await page.goto("/admin");

    await expect(page.getByText(/Production readiness gate-room/i)).toBeVisible();
    await expect(page.getByRole("heading", { name: /Publication controls, validation gates and operational proof/i })).toBeVisible();
    await expect(page.getByText(/Not production ready|Production ready/i).first()).toBeVisible();
    await expect(page.getByText(/Production readiness seal/i)).toBeVisible();
    await expect(page.getByRole("heading", { name: /Readiness gate ladder/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Remaining unlock gates/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Promotion rules/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Open production evidence API/i })).toBeVisible();
  });

  test("admin shortcuts reach review and source control surfaces", async ({ page }) => {
    await page.goto("/admin");

    await page.getByRole("link", { name: /Open AGSA review queue/i }).click();
    await expect(page).toHaveURL(/\/admin\/agsa-review/);
    await expect(page.getByRole("heading", { name: /AGSA Review Cockpit/i })).toBeVisible();

    await page.goto("/admin");
    await page.getByRole("link", { name: /Open source vault/i }).click();
    await expect(page).toHaveURL(/\/sources/);
  });
});
