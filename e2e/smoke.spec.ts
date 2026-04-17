import { test, expect } from '@playwright/test';

test.describe('ЛистоПад — smoke', () => {
  test('головна сторінка завантажується', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/ЛистоПад/);
    await expect(page.getByRole('navigation')).toBeVisible();
  });

  test('фільтри каталогу працюють і скидаються', async ({ page }) => {
    await page.goto('/');
    const searchInput = page.getByPlaceholder('Назва, автор, ISBN…');
    await searchInput.fill('рядок-якого-немає-в-каталозі');
    await expect(page.getByText('Нічого не знайдено за поточними фільтрами.')).toBeVisible();

    await page.getByRole('button', { name: 'Скинути' }).first().click();
    await expect(page.getByText(/Знайдено:/)).toBeVisible();
  });
});
