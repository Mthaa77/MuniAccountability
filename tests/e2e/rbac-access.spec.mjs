import { expect, test } from "@playwright/test";
import { authenticateAs, signOut } from "./helpers/auth.mjs";

function baseURL(testInfo) {
  return testInfo.project.use.baseURL ?? "http://127.0.0.1:3000";
}

test.describe("Institutional RBAC boundaries", () => {
  test("anonymous visitors can open public MuniCheck but not the admin gate-room", async ({ page, context }) => {
    await signOut(context);

    await page.goto("/municheck");
    await expect(page).toHaveURL(/\/municheck/);
    await expect(page.getByText(/Public/i).first()).toBeVisible();

    await page.goto("/admin");
    await expect(page).toHaveURL(/\/access-denied\?reason=authentication_required/);
    await expect(page.getByRole("heading", { name: /Sign-in is required/i })).toBeVisible();
    await expect(page.getByText(/No protected data was disclosed/i)).toBeVisible();
  });

  test("viewer can read evidence but cannot enter AGSA review governance", async ({ page, context }, testInfo) => {
    await authenticateAs(context, "viewer", baseURL(testInfo));

    await page.goto("/sources");
    await expect(page).toHaveURL(/\/sources/);
    await expect(page.getByText(/Institutional viewer/i).first()).toBeVisible();

    await page.goto("/admin/agsa-review");
    await expect(page).toHaveURL(/\/access-denied\?reason=insufficient_permission/);
    await expect(page.getByRole("heading", { name: /Your role cannot open this workspace/i })).toBeVisible();
  });

  test("reviewer can use AGSA Review Cockpit but cannot manage production readiness", async ({ page, context }, testInfo) => {
    await authenticateAs(context, "reviewer", baseURL(testInfo));

    await page.goto("/admin/agsa-review");
    await expect(page.getByRole("heading", { name: /AGSA Review Cockpit/i })).toBeVisible();
    await expect(page.getByText(/Evidence reviewer/i).first()).toBeVisible();

    await page.goto("/admin");
    await expect(page).toHaveURL(/\/access-denied\?reason=insufficient_permission/);
  });

  test("admin can open the production readiness gate-room", async ({ page, context }, testInfo) => {
    await authenticateAs(context, "admin", baseURL(testInfo));

    await page.goto("/admin");
    await expect(page.getByText(/Production readiness gate-room/i)).toBeVisible();
    await expect(page.getByText(/Workspace administrator/i).first()).toBeVisible();
  });
});
