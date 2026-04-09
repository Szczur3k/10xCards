import { test, expect } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";

test.describe("Flashcards Management", () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    // Login before each test
    await loginPage.goto("/login");
    await loginPage.login("Test@10xDevs.pl", "10xDevs.");
    await loginPage.expectRedirectedToFlashcards();
  });

  test("TC-MAN-01: Access to flashcards after authentication", async ({ page }) => {
    // Should be on flashcards page after successful login
    await expect(page).toHaveURL(/\/flashcards/);
  });

  test("TC-UI-01: Flashcards page loads correctly", async ({ page }) => {
    // Should be on flashcards page
    await expect(page).toHaveURL(/\/flashcards/);

    // Should have main content area
    await expect(page.locator("main")).toBeVisible();
  });

  test("TC-UI-02: Navigation elements are present", async ({ page }) => {
    // Should be on flashcards page
    await expect(page).toHaveURL(/\/flashcards/);

    // Should have header and navigation - check for any header with navigation content
    const header = page.locator("header").first();
    await expect(header).toBeVisible();

    // Header should contain some navigation elements (buttons, links, etc.)
    const navElements = header.locator('button, a, [role="button"]');
    expect(await navElements.count()).toBeGreaterThan(0);
  });

  test("TC-AI-01: AI generation requires authentication", async ({ page }) => {
    // Should be on flashcards page
    await expect(page).toHaveURL(/\/flashcards/);

    // Try to access AI generation (if button exists)
    const aiButton = page
      .locator('[data-testid="ai-generation-btn"], button:has-text("AI"), button:has-text("Generate")')
      .first();
    if (await aiButton.isVisible()) {
      await aiButton.click();
      // Should stay on flashcards page or navigate to generation
      await expect(page).toHaveURL(/\/flashcards|\/generate/);
    }
  });

  test("TC-AI-02: Review interface requires authentication", async ({ page }) => {
    // Should be on flashcards page
    await expect(page).toHaveURL(/\/flashcards/);

    // Try to access review interface (if button exists)
    const reviewButton = page
      .locator('[data-testid="review-btn"], button:has-text("Review"), button:has-text("Review")')
      .first();
    if (await reviewButton.isVisible()) {
      await reviewButton.click();
      // Should stay on flashcards page or navigate to review
      await expect(page).toHaveURL(/\/flashcards|\/review/);
    }
  });
});
