import { test, expect } from '@playwright/test';

test('should load the game page and play offline', async ({ page }) => {
  page.on('console', msg => {
    console.log(`BROWSER CONSOLE [${msg.type()}]: ${msg.text()}`);
  });

  await page.goto('/');
  await page.waitForTimeout(5000); // Wait for Next.js compilation & React hydration

  console.log("=== BEFORE OFFLINE CLICK ===");
  // Click Play Offline to mount the Phaser game
  await page.click('text="Play Offline (Testing)"');
  await page.waitForTimeout(3000); // Wait to allow render

  console.log("=== AFTER OFFLINE CLICK ===");
  // Verify container is visible
  const gameContainer = page.locator('#game-container');
  await expect(gameContainer).toBeVisible();
});

test('should load the game page and play online', async ({ page }) => {
  page.on('console', msg => {
    console.log(`BROWSER CONSOLE [${msg.type()}]: ${msg.text()}`);
  });

  await page.goto('/');
  await page.waitForTimeout(5000); // Wait for Next.js compilation & React hydration

  console.log("=== BEFORE ONLINE CLICK ===");
  // Click Play Online to mount the Phaser game and connect to server
  await page.click('text="Play Online"');
  await page.waitForTimeout(3000); // Wait to allow render & connection

  console.log("=== AFTER ONLINE CLICK ===");
  // Verify container is visible
  const gameContainer = page.locator('#game-container');
  await expect(gameContainer).toBeVisible();
});
