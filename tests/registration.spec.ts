import { test, expect } from '@playwright/test';

test.describe('User Registration Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('validates password mismatch on registration', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.locator('nav').getByRole('button', { name: 'Login' }).click();

    // Navigate to register page
    await page.getByRole('button', { name: /Register here/i }).click();

    // Fill form with mismatching passwords
    await page.locator('input[name="name"]').fill('Test Student');
    await page.locator('input[name="email"]').fill('teststudent@nemsu.edu.ph');
    await page.locator('input[name="studentId"]').fill('2025-9999');
    await page.locator('input[name="course"]').fill('BSIT');
    await page.locator('input[name="password"]').fill('ValidPassword123!');
    await page.locator('input[name="confirmPassword"]').fill('DifferentPassword123!');

    await page.getByRole('button', { name: /Create Account/i }).click();

    // Expect password mismatch error banner
    await expect(page.getByText('Passwords do not match')).toBeVisible();
  });

  test('student can successfully register a new account', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.locator('nav').getByRole('button', { name: 'Login' }).click();

    await page.getByRole('button', { name: /Register here/i }).click();

    // Generate unique student ID to avoid duplicate collisions
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const uniqueStudentId = `2025-${randomSuffix}`;

    await page.locator('input[name="name"]').fill('Auto Tester');
    await page.locator('input[name="email"]').fill(`autotester${randomSuffix}@nemsu.edu.ph`);
    await page.locator('input[name="studentId"]').fill(uniqueStudentId);
    await page.locator('input[name="course"]').fill('BSCS');
    await page.locator('input[name="password"]').fill('NewStudent123!');
    await page.locator('input[name="confirmPassword"]').fill('NewStudent123!');

    await page.getByRole('button', { name: /Create Account/i }).click();

    // Expect success message
    await expect(page.getByText('Registration Successful!')).toBeVisible({ timeout: 15_000 });
  });
});
