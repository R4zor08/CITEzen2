import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('should display the hero section and branding', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveTitle(/CITEzen/i);

    // Verify brand name
    const brand = page.locator('nav').getByText('CITEzen');
    await expect(brand).toBeVisible();

    // Verify hero text
    const heroHeading = page.getByRole('heading', { name: /Simplifying Student/i });
    await expect(heroHeading).toBeVisible();
  });

  test('should navigate to the login page when Login is clicked', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const loginButton = page.locator('nav').getByRole('button', { name: 'Login' });
    await expect(loginButton).toBeVisible();
    await loginButton.click();

    // Expect the login form to be visible
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
    await expect(page.getByText('Sign in to your account to continue')).toBeVisible();
  });
});
