import { test, expect } from '@playwright/test';

test.describe('ЛистоПад — smoke', () => {
  test('головна сторінка завантажується', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/ЛистоПад/);
    await expect(page.getByRole('navigation')).toBeVisible();
  });
});
