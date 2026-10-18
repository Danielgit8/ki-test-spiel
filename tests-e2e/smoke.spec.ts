import { test, expect } from '@playwright/test';

const SOLUTION_1_1 = ['right', 'right', 'right', 'down', 'down'];
const KEY: Record<string, string> = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' };

test('laptop: level 1-1 can be solved with the keyboard', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#level-id')).toHaveText('1-1');
  for (const move of SOLUTION_1_1) await page.keyboard.press(KEY[move]);
  await expect(page.locator('#overlay-title')).toHaveText('Level complete');
  await expect(page.locator('#overlay-sub')).toHaveText('5 moves');
});

test.describe('phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test('level 1-1 can be solved with the on-screen pad', async ({ page }) => {
    await page.goto('/');
    for (const move of SOLUTION_1_1) await page.locator(`.pad [data-action="${move}"]`).click();
    await expect(page.locator('#overlay-title')).toHaveText('Level complete');
  });
});
