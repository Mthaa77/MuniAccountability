import { expect, test } from "@playwright/test";

test.describe("Command shell navigation", () => {
  test("loads the command centre and exposes core navigation", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: /MuniAccountability Command/i })).toBeVisible();
    await expect(page.getByText(/No proof, no public claim/i).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /Open Ask MuniAtlas assistant/i })).toBeVisible();

    await page.getByRole("link", { name: /Action Board/i }).first().click();
    await expect(page).toHaveURL(/\/actions/);
    await expect(page.getByRole("heading", { name: /Action Studio/i })).toBeVisible();

    await page.getByRole("link", { name: /AGSA Review/i }).first().click();
    await expect(page).toHaveURL(/\/admin\/agsa-review/);
    await expect(page.getByRole("heading", { name: /AGSA Review Cockpit/i })).toBeVisible();
  });

  test("command search can reach the AGSA Review Cockpit", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: /Open command search/i }).click();
    await page.getByPlaceholder(/Search pages/i).fill("AGSA");
    await page.getByRole("link", { name: /AGSA Review Cockpit/i }).first().click();

    await expect(page).toHaveURL(/\/admin\/agsa-review/);
    await expect(page.getByRole("heading", { name: /AGSA Review Cockpit/i })).toBeVisible();
  });

  test("desktop command rail collapses and expands without losing navigation", async ({ page, isMobile }) => {
    test.skip(isMobile, "Desktop command rail behavior is covered in the desktop project.");

    await page.goto("/");
    await page.getByRole("button", { name: "Collapse sidebar" }).click();
    await expect(page.locator("main.nav-collapsed")).toBeVisible();
    await expect(page.getByRole("link", { name: "Action Board" })).toBeVisible();

    await page.getByRole("button", { name: "Expand sidebar" }).click();
    await expect(page.locator("main.nav-collapsed")).toHaveCount(0);
  });

  test("mobile menu opens and reaches AGSA Review", async ({ page, isMobile }) => {
    test.skip(!isMobile, "Mobile menu behavior is covered only in the mobile project.");

    await page.goto("/");
    await expect(page.getByRole("navigation", { name: /Mobile primary navigation/i })).toBeVisible();
    await page.getByRole("button", { name: /Open navigation menu/i }).click();
    await expect(page.getByText(/MuniAtlas/i).first()).toBeVisible();

    await page.getByRole("link", { name: /AGSA Review Cockpit/i }).first().click();
    await expect(page).toHaveURL(/\/admin\/agsa-review/);
    await expect(page.getByRole("heading", { name: /AGSA Review Cockpit/i })).toBeVisible();
  });
});
