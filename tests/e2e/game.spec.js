/**
 * E2E tests for Pong game
 * Tests core user flows and gameplay functionality
 */

const { test, expect } = require('@playwright/test');

test.describe('Pong Game', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display main menu on load', async ({ page }) => {
    // Check title is visible
    await expect(page.locator('h1')).toContainText('PONG');
    
    // Check menu buttons are present
    await expect(page.getByTestId('play-button')).toBeVisible();
    await expect(page.getByTestId('settings-button')).toBeVisible();
    await expect(page.getByTestId('leaderboard-button')).toBeVisible();
  });

  test('should navigate to mode selection when clicking Play', async ({ page }) => {
    await page.getByTestId('play-button').click();
    
    // Check mode selection screen is shown
    await expect(page.getByTestId('single-player')).toBeVisible();
    await expect(page.getByTestId('local-multiplayer')).toBeVisible();
    await expect(page.getByTestId('online-multiplayer')).toBeVisible();
    
    // Online should be disabled
    await expect(page.getByTestId('online-multiplayer')).toBeDisabled();
  });

  test('should show difficulty selection for single player', async ({ page }) => {
    await page.getByTestId('play-button').click();
    await page.getByTestId('single-player').click();
    
    // Check difficulty options are shown
    await expect(page.getByTestId('difficulty-easy')).toBeVisible();
    await expect(page.getByTestId('difficulty-medium')).toBeVisible();
    await expect(page.getByTestId('difficulty-hard')).toBeVisible();
    await expect(page.getByTestId('difficulty-impossible')).toBeVisible();
  });

  test('should navigate back from mode selection', async ({ page }) => {
    await page.getByTestId('play-button').click();
    await page.getByTestId('back-button').click();
    
    // Should be back at main menu
    await expect(page.getByTestId('play-button')).toBeVisible();
  });

  test('should display settings screen', async ({ page }) => {
    await page.getByTestId('settings-button').click();
    
    await expect(page.getByTestId('settings-screen')).toBeVisible();
    await expect(page.getByTestId('back-button')).toBeVisible();
  });

  test('should display leaderboard screen', async ({ page }) => {
    await page.getByTestId('leaderboard-button').click();
    
    await expect(page.getByTestId('leaderboard-screen')).toBeVisible();
    await expect(page.getByTestId('back-button')).toBeVisible();
  });

  test('should start game and show canvas', async ({ page }) => {
    await page.getByTestId('play-button').click();
    await page.getByTestId('single-player').click();
    await page.getByTestId('difficulty-easy').click();
    
    // Game should start - menu should be hidden and canvas visible
    const canvas = page.getByTestId('game-canvas');
    await expect(canvas).toBeVisible();
    
    // UI overlay should be hidden during gameplay
    await expect(page.locator('#ui-overlay')).toHaveClass(/hidden/);
  });

  test('should pause game when pressing Escape', async ({ page }) => {
    // Start a game
    await page.getByTestId('play-button').click();
    await page.getByTestId('single-player').click();
    await page.getByTestId('difficulty-easy').click();
    
    // Wait for game to start by checking overlay is hidden
    await expect(page.locator('#ui-overlay')).toHaveClass(/hidden/);
    
    // Give game time to initialize fully
    await expect(page.getByTestId('game-canvas')).toBeVisible();
    
    // Press Escape to pause
    await page.keyboard.press('Escape');
    
    // Pause menu should be visible
    await expect(page.getByTestId('pause-menu')).toBeVisible();
    await expect(page.getByTestId('resume-button')).toBeVisible();
  });
});
