import { test, expect } from '@playwright/test';

test.describe('GabAI Chat Assistant Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('student can open GabAI, send a query, and receive a live AI response', async ({ page }) => {
    // 1. Log in as student
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const loginBtn = page.locator('nav').getByRole('button', { name: 'Login' });
    await expect(loginBtn).toBeVisible({ timeout: 15_000 });
    await loginBtn.click();
    await page.getByRole('button', { name: 'student' }).click();

    await page.locator('input[placeholder="2023-00142"]').fill('2024-0001');
    await page.locator('input[type="password"]').fill('StudentPass123!');
    const signInBtn = page.getByRole('button', { name: /Sign in/i });
    await expect(signInBtn).toBeVisible({ timeout: 10_000 });
    await signInBtn.click();

    await expect(page.getByRole('heading', { name: /student dashboard/i }).first()).toBeVisible({ timeout: 20_000 });

    // 2. Locate and click floating GabAI chat button
    const chatButton = page.locator('button.fixed img[alt="Chat"]').locator('..');
    await expect(chatButton).toBeVisible({ timeout: 10_000 });
    await chatButton.click();

    // 3. Verify GabAI chat panel opens and initial greeting is displayed
    await expect(page.getByText('GabAI', { exact: false }).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/I'm GabAI/i).first()).toBeVisible({ timeout: 10_000 });

    // 4. Send a custom prompt to GabAI
    const chatInput = page.locator('textarea[placeholder="Ask anything"]');
    await expect(chatInput).toBeVisible({ timeout: 10_000 });
    await chatInput.fill('What is CITEzen?');
    await page.locator('button[aria-label="Send"]').click();

    // 5. Verify user prompt is in the conversation
    await expect(page.getByRole('paragraph').filter({ hasText: 'What is CITEzen?' })).toBeVisible({ timeout: 15_000 });

    // 6. Verify assistant generates and displays an AI response
    const assistantMessage = page.locator('.chat-bubble-assistant p');
    await expect(assistantMessage.last()).toBeVisible({ timeout: 30_000 });
    const responseText = await assistantMessage.last().innerText();
    expect(responseText.trim().length).toBeGreaterThan(0);

    // 7. Verify close button closes the chat panel
    await page.locator('button[aria-label="Close chat"]').click();
    await expect(chatInput).not.toBeVisible({ timeout: 5_000 });
  });

  test('student can interact with suggestion chips and create new chat sessions', async ({ page }) => {
    // 1. Log in as student
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const loginBtn = page.locator('nav').getByRole('button', { name: 'Login' });
    await expect(loginBtn).toBeVisible({ timeout: 15_000 });
    await loginBtn.click();
    await page.getByRole('button', { name: 'student' }).click();

    await page.locator('input[placeholder="2023-00142"]').fill('2024-0001');
    await page.locator('input[type="password"]').fill('StudentPass123!');
    const signInBtn = page.getByRole('button', { name: /Sign in/i });
    await expect(signInBtn).toBeVisible({ timeout: 10_000 });
    await signInBtn.click();

    await expect(page.getByRole('heading', { name: /student dashboard/i }).first()).toBeVisible({ timeout: 20_000 });

    // 2. Open GabAI chat
    const chatButton = page.locator('button.fixed img[alt="Chat"]').locator('..');
    await expect(chatButton).toBeVisible({ timeout: 10_000 });
    await chatButton.click();

    // 3. Click suggestion chip "How do I submit a concern?"
    const chip = page.locator('button.chat-chip', { hasText: 'How do I submit a concern?' });
    await expect(chip).toBeVisible({ timeout: 10_000 });
    await chip.click();

    // 4. Verify the query was submitted
    await expect(page.getByRole('paragraph').filter({ hasText: 'How do I submit a concern?' })).toBeVisible({ timeout: 15_000 });

    // 5. Verify assistant generates a response
    const assistantBubble = page.locator('.chat-bubble-assistant');
    await expect(assistantBubble.nth(1)).toBeVisible({ timeout: 30_000 });

    // 6. Click "New chat" to start a new clean session
    const newChatBtn = page.getByRole('button', { name: /New chat/i });
    if (await newChatBtn.isVisible()) {
      await newChatBtn.click();
      // Verify a new session with initial greeting is ready
      await expect(page.locator('.chat-bubble-assistant')).toHaveCount(1, { timeout: 10_000 });
    }
  });
});
