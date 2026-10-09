import { test, expect } from '@playwright/test';

test.describe('Authentication Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Clear tokens before each test to start in a clean unauthenticated state
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('admin can log in successfully and view Admin Dashboard', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Click Login on Navbar
    await page.locator('nav').getByRole('button', { name: 'Login' }).click();

    // Select Administrator role
    await page.getByRole('button', { name: 'admin' }).click();

    // Fill in admin credentials
    await page.locator('input[type="email"]').fill('admin@nemsu.edu.ph');
    await page.locator('input[type="password"]').fill('Admin3msu');

    // Submit form
    await page.getByRole('button', { name: /Sign in/i }).click();

    // Expect Admin Dashboard to appear
    await expect(page.getByRole('heading', { name: /admin dashboard/i }).first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole('button', { name: 'Overview' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'All Concerns' })).toBeVisible();

    // Confirm token was stored in localStorage
    const token = await page.evaluate(() => localStorage.getItem('citezen_token'));
    expect(token).toBeTruthy();
  });

  test('displays error message on invalid credentials', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await page.locator('nav').getByRole('button', { name: 'Login' }).click();
    await page.getByRole('button', { name: 'student' }).click();

    await page.locator('input[type="text"]').fill('nonexistent-id');
    await page.locator('input[type="password"]').fill('wrongpassword');

    await page.getByRole('button', { name: /Sign in/i }).click();

    // Expect an error alert box to be visible
    const errorAlert = page.locator('div.bg-red-500\\/10');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText(/Invalid credentials/i);
  });

  test('student can log in successfully and view Student Dashboard', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await page.locator('nav').getByRole('button', { name: 'Login' }).click();

    // Select Student role
    await page.getByRole('button', { name: 'student' }).click();

    // Fill in student credentials
    await page.locator('input[placeholder="2023-00142"]').fill('2024-0001');
    await page.locator('input[type="password"]').fill('StudentPass123!');

    // Submit form
    await page.getByRole('button', { name: /Sign in/i }).click();

    // Expect Student Dashboard to appear
    await expect(page.getByRole('heading', { name: /student dashboard/i }).first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText('Submit Concern')).toBeVisible();
    await expect(page.getByText('My Concerns')).toBeVisible();
  });

  test('staff can log in successfully and view Staff Dashboard', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await page.locator('nav').getByRole('button', { name: 'Login' }).click();

    // Select Staff role
    await page.getByRole('button', { name: 'staff' }).click();

    // Fill in staff credentials
    await page.locator('input[type="email"]').fill('staff@nemsu.edu.ph');
    await page.locator('input[type="password"]').fill('StaffPass123!');

    // Submit form
    await page.getByRole('button', { name: /Sign in/i }).click();

    // Expect Staff Dashboard to appear
    await expect(page.getByRole('heading', { name: /staff dashboard/i }).first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/Dept\. Concerns/i).first()).toBeVisible({ timeout: 15_000 });
  });

  test('user can log out and return to landing page', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await page.locator('nav').getByRole('button', { name: 'Login' }).click();
    await page.getByRole('button', { name: 'student' }).click();

    await page.locator('input[placeholder="2023-00142"]').fill('2024-0001');
    await page.locator('input[type="password"]').fill('StudentPass123!');
    await page.getByRole('button', { name: /Sign in/i }).click();

    await expect(page.getByRole('heading', { name: /student dashboard/i }).first()).toBeVisible({ timeout: 20_000 });

    // Click sidebar logout button
    await page.locator('aside').getByRole('button', { name: /Log out/i }).click();

    // Confirm logout modal appears
    await expect(page.getByText('Confirm Logout')).toBeVisible();

    // Click the confirmation Logout button inside the modal
    const modal = page.locator('div.fixed.inset-0.z-\\[100\\]');
    await modal.getByRole('button', { name: 'Logout' }).click();

    // Verify redirected back to landing page and token is cleared
    await expect(page.locator('nav').getByRole('button', { name: 'Login' })).toBeVisible({ timeout: 10_000 });
    const token = await page.evaluate(() => localStorage.getItem('citezen_token'));
    expect(token).toBeFalsy();
  });
});
