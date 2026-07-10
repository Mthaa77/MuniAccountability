import { expect, test } from "@playwright/test";

test.describe("Institutional workflow cockpits", () => {
  test("Action Board exposes Action Studio and Evidence Intake Desk", async ({ page }) => {
    await page.goto("/actions");

    await expect(page.getByRole("heading", { name: /Action Studio/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Evidence Intake Desk/i })).toBeVisible();
    await expect(page.getByText(/Create follow-up actions from evidence/i)).toBeVisible();
    await expect(page.getByText(/Submit proof quickly/i)).toBeVisible();
    await expect(page.getByText(/Internal action notes stay private/i)).toBeVisible();
  });

  test("AGSA Review Cockpit exposes publish-safety and decision controls", async ({ page }) => {
    await page.goto("/admin/agsa-review");

    await expect(page.getByRole("heading", { name: /AGSA Review Cockpit/i })).toBeVisible();
    await expect(page.getByText(/Publish safety/i)).toBeVisible();
    await expect(page.getByText(/Reviewer gates/i)).toBeVisible();
    await expect(page.getByText(/Decision preview/i)).toBeVisible();
    await expect(page.getByText(/Decision controls/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Accept/i }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /Needs correction/i }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /Exclude/i }).first()).toBeVisible();
  });

  test("Public MuniCheck exposes public-safety boundary", async ({ page }) => {
    await page.goto("/municheck");

    await expect(page.getByText(/Public/i).first()).toBeVisible();

    const firstProfile = page.locator('a[href^="/municheck/"]').first();
    await expect(firstProfile).toBeVisible();
    await firstProfile.click();

    await expect(page.getByText(/Public profile boundary/i)).toBeVisible();
    await expect(page.getByText(/What is not shown publicly/i)).toBeVisible();
    await expect(page.getByText(/Internal notes/i)).toBeVisible();
    await expect(page.getByText(/Restricted evidence/i)).toBeVisible();
  });
});
