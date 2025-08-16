import { Page, Locator, expect } from '@playwright/test'
import { BasePage } from './BasePage'

export class LoginPage extends BasePage {
  // Locators
  readonly emailInput: Locator
  readonly passwordInput: Locator
  readonly loginButton: Locator
  readonly signupLink: Locator
  readonly forgotPasswordLink: Locator
  readonly errorMessage: Locator
  
  constructor(page: Page) {
    super(page)
    this.emailInput = page.locator('input[type="email"]')
    this.passwordInput = page.locator('input[type="password"]')
    this.loginButton = page.locator('button[type="submit"]')
    this.signupLink = page.locator('a[href="/signup"]')
    this.forgotPasswordLink = page.locator('a[href="/forgot-password"]')
    this.errorMessage = page.locator('[data-testid="error-message"]')
  }
  
  // Actions
  async login(email: string, password: string) {
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
    await this.loginButton.click()
  }
  
  async gotoSignup() {
    await this.signupLink.click()
  }
  
  async gotoForgotPassword() {
    await this.forgotPasswordLink.click()
  }
  
  // Assertions
  async expectLoginFormVisible() {
    await this.expectElementVisible(this.emailInput)
    await this.expectElementVisible(this.passwordInput)
    await this.expectElementVisible(this.loginButton)
  }
  
  async expectErrorMessageVisible(message?: string) {
    if (message) {
      await expect(this.errorMessage).toContainText(message)
    } else {
      await this.expectElementVisible(this.errorMessage)
    }
  }
  
  async expectRedirectedToFlashcards() {
    await this.expectToHaveURL('/flashcards')
  }
}
