import { chromium, type FullConfig } from "@playwright/test";

async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0].use;

  // Start browser and create context for setup
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // Navigate to base URL to ensure server is running
  await page.goto(baseURL || "http://localhost:3000");

  // Wait for page to load
  await page.waitForLoadState("networkidle");

  await browser.close();

  // Add delay to avoid rate limiting
  console.log("Waiting 2 seconds to avoid rate limiting...");
  await new Promise((resolve) => setTimeout(resolve, 2000));
}

export default globalSetup;
