import { chromium } from "@playwright/test";

async function globalTeardown() {
  // Cleanup any remaining browser instances
  const browser = await chromium.launch();
  await browser.close();

  console.log("Global teardown completed");
}

export default globalTeardown;
