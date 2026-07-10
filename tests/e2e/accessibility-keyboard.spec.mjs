import { expect, test } from "@playwright/test";

test.describe("Keyboard and accessibility smoke checks", () => {
  test("core controls expose accessible names and can be reached by keyboard", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("button", { name: /Open command search/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Open Ask MuniAtlas assistant/i })).toBeVisible();

    await page.keyboard.press(process.platform === "darwin" ? "Meta+K" : "Control+K");
    await expect(page.getByPlaceholder(/Search pages/i)).toBeVisible();
    await page.keyboard.press("Escape");

    await page.keyboard.press("Tab");
    const focusedTag = await page.evaluate(() => document.activeElement?.tagName?.toLowerCase());
    expect(["a", "button", "input", "textarea", "select"].includes(focusedTag ?? "")).toBeTruthy();
  });

  test("assistant drawer has labelled controls and closes from keyboard", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: /Open Ask MuniAtlas assistant/i }).click();
    await expect(page.getByRole("complementary", { name: /Ask MuniAtlas source-locked assistant/i })).toBeVisible();
    await expect(page.getByLabel(/Ask a source-backed question/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Close assistant/i })).toBeVisible();

    await page.getByRole("button", { name: /Close assistant/i }).focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("complementary", { name: /Ask MuniAtlas source-locked assistant/i })).toBeHidden();
  });

  test("public pages keep public-safety labels visible on mobile", async ({ page, isMobile }) => {
    test.skip(!isMobile, "Mobile public-safety smoke check runs in the mobile project.");

    await page.goto("/municheck");
    const firstProfile = page.locator('a[href^="/municheck/"]').first();
    await expect(firstProfile).toBeVisible();
    await firstProfile.click();

    await expect(page.getByText(/Public profile boundary/i)).toBeVisible();
    await expect(page.getByText(/Public safety boundary/i)).toBeVisible();
  });
});
