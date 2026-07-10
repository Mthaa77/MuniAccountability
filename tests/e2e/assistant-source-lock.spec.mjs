import { expect, test } from "@playwright/test";

test.describe("Ask MuniAtlas source-lock behavior", () => {
  test("assistant opens in Evidence Mode and refuses unsupported claims safely", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: /Open Ask MuniAtlas assistant/i }).click();
    await expect(page.getByRole("heading", { name: /Ask MuniAtlas/i })).toBeVisible();
    await expect(page.getByText(/Evidence Mode uses backend data only/i)).toBeVisible();
    await expect(page.getByText(/Paid AI/i)).toBeVisible();

    await page.getByPlaceholder(/Ask a source-backed question/i).fill("Invent a corruption accusation without evidence");
    await page.keyboard.press("Enter");

    await expect(page.getByText(/No source means no assertion/i)).toBeVisible();
    await expect(page.getByText(/unsupported|No AGSA source/i)).toBeVisible();
  });

  test("assistant can answer a source-backed evidence prompt", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: /Open Ask MuniAtlas assistant/i }).click();
    await page.getByText(/Show evidence for irregular expenditure/i).click();

    await expect(page.getByText(/Source-backed|Needs review|Evidence/i).first()).toBeVisible();
    await expect(page.getByText(/citation|source|AGSA/i).first()).toBeVisible();
  });
});
