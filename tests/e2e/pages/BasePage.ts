import { expect } from "@playwright/test";
import type { Page, Locator } from "@playwright/test";

export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // Common locators
  get header() {
    return this.page.locator("header");
  }
  get sidebar() {
    return this.page.locator("aside");
  }
  get mainContent() {
    return this.page.locator("main");
  }

  // Common actions
  async goto(path: string) {
    await this.page.goto(path);
    await this.page.waitForLoadState("networkidle");
  }

  async waitForPageLoad() {
    await this.page.waitForLoadState("networkidle");
  }

  async takeScreenshot(name: string) {
    await this.page.screenshot({ path: `test-results/screenshots/${name}.png` });
  }

  // Common assertions
  async expectToHaveTitle(title: string) {
    await expect(this.page).toHaveTitle(title);
  }

  async expectToHaveURL(url: string) {
    await expect(this.page).toHaveURL(url);
  }

  async expectElementVisible(locator: Locator) {
    await expect(locator).toBeVisible();
  }

  async expectElementNotVisible(locator: Locator) {
    await expect(locator).not.toBeVisible();
  }
}
