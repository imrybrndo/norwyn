import { test, expect } from '@playwright/test';

test('should load the game page and play as guest', async ({ page }) => {
  page.on('console', msg => {
    console.log(`BROWSER CONSOLE [${msg.type()}]: ${msg.text()}`);
  });

  await page.goto('/');
  await page.waitForTimeout(5000); // Wait for Next.js compilation & React hydration

  console.log("=== BEFORE PLAY AS GUEST CLICK ===");
  // Click PLAY AS GUEST to mount the Phaser game
  await page.click('text="PLAY AS GUEST"');
  await page.waitForTimeout(5000); // Wait to allow render & connection

  console.log("=== AFTER PLAY AS GUEST CLICK ===");
  // Verify container is visible
  const gameContainer = page.locator('#game-container');
  await expect(gameContainer).toBeVisible();
});
