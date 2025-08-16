import { chromium } from '@playwright/test'
import type { FullConfig } from '@playwright/test'

async function globalTeardown(config: FullConfig) {
  // Cleanup any remaining browser instances
  const browser = await chromium.launch()
  await browser.close()
  
  console.log('Global teardown completed')
}

export default globalTeardown
