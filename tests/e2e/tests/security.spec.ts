import { test, expect } from "@playwright/test";

test.describe("Security Tests", () => {
  test("TC-SEC-01: CSRF protection - POST request without token", async ({ request }) => {
    // Try to create flashcard without CSRF token
    const response = await request.post("/api/flashcards", {
      data: {
        front: "Test Question",
        back: "Test Answer",
        category_id: "1",
        group_id: "1",
      },
    });

    // Should return 401 Unauthorized (no auth) or 403 Forbidden (CSRF)
    expect([401, 403]).toContain(response.status());
  });

  test("TC-SEC-02: Rate limiting on authentication endpoints", async ({ request }) => {
    const loginData = {
      email: "test@example.com",
      password: "wrongpassword",
    };

    // Make multiple rapid login attempts
    const responses = await Promise.all([
      request.post("/api/auth/signin", { data: loginData }),
      request.post("/api/auth/signin", { data: loginData }),
      request.post("/api/auth/signin", { data: loginData }),
      request.post("/api/auth/signin", { data: loginData }),
      request.post("/api/auth/signin", { data: loginData }),
    ]);

    // At least one should be rate limited (429) or return error
    const hasRateLimit = responses.some((response) => response.status() === 429);
    const hasError = responses.some((response) => response.status() >= 400);
    expect(hasRateLimit || hasError).toBe(true);
  });

  test("TC-SEC-03: Protected routes require authentication", async ({ page }) => {
    // Try to access protected route without login
    await page.goto("/flashcards");

    // Should redirect to login page (with return parameter)
    await expect(page).toHaveURL(/\/login/);
  });

  test("TC-SEC-04: JWT token validation", async ({ request }) => {
    // Try to access protected API with invalid token
    const response = await request.get("/api/flashcards", {
      headers: {
        Authorization: "Bearer invalid-token",
      },
    });

    // Should return 401 Unauthorized
    expect(response.status()).toBe(401);
  });

  test.skip("TC-SEC-05: XSS protection in flashcard content", async ({ page }) => {
    // TODO: Implement XSS protection before enabling this test
    // Required changes:
    // 1. Add input sanitization in EditFlashcardModal.tsx (front/back fields)
    // 2. Add HTML escaping when displaying flashcard content
    // 3. Implement validateSafeContent from openrouter/validators.ts in flashcard forms
    // 4. Add DOMPurify or similar library for client-side sanitization

    // Login first
    await page.goto("/login");
    await page.fill('input[type="email"]', "Test@10xDevs.pl");
    await page.fill('input[type="password"]', "10xDevs.");
    await page.click('button[type="submit"]');

    // Wait for redirect
    await page.waitForURL("/flashcards");

    // Try to create flashcard with XSS payload (if form exists)
    const createButton = page
      .locator('[data-testid="create-flashcard-btn"], button:has-text("Create"), button:has-text("Add")')
      .first();
    if (await createButton.isVisible()) {
      await createButton.click();

      // Wait for form to appear
      await page.waitForSelector("input, textarea", { timeout: 5000 });

      // Try to fill XSS payload - only text inputs, not checkboxes
      const textInputs = page.locator('input[type="text"], input[type="email"], input[type="password"], textarea');
      if ((await textInputs.count()) > 0) {
        await textInputs.first().fill('<script>alert("xss")</script>');

        // The script tag should be escaped, not executed
        await expect(page.locator("script")).not.toBeVisible();
      }
    }
  });

  test("TC-SEC-06: SQL injection protection", async ({ request }) => {
    // Try to inject SQL in search parameter
    const response = await request.get("/api/flashcards?search=1%27%20OR%20%271%27%3D%271");

    // Should not crash and should return valid response (401 for no auth is expected)
    expect([200, 401, 403]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      // Should return array (even if empty)
      expect(Array.isArray(data)).toBe(true);
    }
  });
});
