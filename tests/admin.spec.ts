import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('admin can navigate tabs, view concerns list, and inspect user directory', async ({ page }) => {
    // 1. Log in as admin
    const loginBtn = page.locator('nav').getByRole('button', { name: 'Login' });
    await expect(loginBtn).toBeVisible({ timeout: 15_000 });
    await loginBtn.click();

    await page.getByRole('button', { name: 'admin' }).click();

    await page.locator('input[type="email"]').fill('admin@nemsu.edu.ph');
    await page.locator('input[type="password"]').fill('Admin3msu');
    await page.getByRole('button', { name: /Sign in/i }).click();

    await expect(page.getByRole('heading', { name: /admin dashboard/i }).first()).toBeVisible({ timeout: 25_000 });

    // 2. Verify Overview stat cards are present
    await expect(page.getByRole('button', { name: 'Overview' })).toBeVisible();

    // 3. Navigate to All Concerns
    await page.getByRole('button', { name: 'All Concerns' }).click();
    await expect(page.locator('input[placeholder*="Search"]').first()).toBeVisible({ timeout: 10_000 });

    // 4. Navigate to Users tab
    await page.getByRole('button', { name: 'Users' }).click();
    // Verify registered users (staff / students) are visible in desktop users table
    await expect(page.locator('table').getByText(/Maria Santos|staff@nemsu.edu.ph|Juan Dela Cruz/i).first()).toBeVisible({ timeout: 25_000 });

    // 5. Navigate to Analytics tab
    await page.getByRole('button', { name: 'Analytics' }).click();
    await expect(page.getByRole('heading', { name: 'Detailed Analytics' })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Department Performance')).toBeVisible({ timeout: 10_000 });
  });
});
