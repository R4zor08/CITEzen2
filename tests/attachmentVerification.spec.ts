import { test, expect } from '@playwright/test';

function createPng(chunks: Array<{ type: string; data: Uint8Array }>): Buffer {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const parts: Uint8Array[] = [signature];
  for (const c of chunks) {
    const lenBuf = Buffer.alloc(4);
    lenBuf.writeUInt32BE(c.data.length);
    const typeBuf = Buffer.from(c.type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    parts.push(lenBuf, typeBuf, c.data, crcBuf);
  }
  return Buffer.concat(parts);
}

function makeIhdr(w: number, h: number, bitDepth = 8, colorType = 2) {
  const buf = Buffer.alloc(13);
  buf.writeUInt32BE(w, 0);
  buf.writeUInt32BE(h, 4);
  buf.writeUInt8(bitDepth, 8);
  buf.writeUInt8(colorType, 9);
  return { type: 'IHDR', data: buf };
}

function makeText(key: string, val: string) {
  const parts: Uint8Array[] = [
    Buffer.from(key, 'latin1'),
    Buffer.from([0]),
    Buffer.from(val, 'latin1')
  ];
  const data = Buffer.concat(parts);
  return { type: 'tEXt', data };
}

const realScreenshotBuffer = createPng([
  makeIhdr(1920, 1080, 8, 2),
  { type: 'IDAT', data: Buffer.alloc(16) },
  { type: 'IEND', data: Buffer.alloc(0) }
]);

const aiGeneratedBuffer = createPng([
  makeIhdr(512, 512, 8, 2),
  makeText(
    'parameters',
    'photorealistic portrait of student in classroom, Steps: 25, Sampler: Euler a, CFG scale: 7.0, Seed: 987654, Model: sd-v1-5'
  ),
  { type: 'IDAT', data: Buffer.alloc(16) },
  { type: 'IEND', data: Buffer.alloc(0) }
]);

test.describe('Supporting Documents AI vs Real Authenticity Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('real screenshot is detected as real, passes verification, and concern is submitted', async ({ page }) => {
    // 1. Log in as student
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

    // 2. Navigate to Submit Concern
    await page.getByRole('button', { name: 'Submit Concern' }).click();

    await page.locator('#concern-title').fill('CS301 Grade Discrepancy');
    await page.locator('#concern-desc').fill('Final grade does not match verified quiz and exam records.');

    // 3. Attach real screenshot (Screenshot (1075).png)
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'Screenshot (1075).png',
      mimeType: 'image/png',
      buffer: realScreenshotBuffer
    });

    // 4. Verification should PASS as REAL
    // Verified badge or success banner should appear
    await expect(page.getByText(/verified as real/i).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/verified document.*ready/i).first()).toBeVisible({ timeout: 10_000 });

    // Rejection card must NOT appear
    await expect(page.getByText('Possible AI-generated image')).not.toBeVisible();
    await expect(page.getByText(/Image verification is not configured/i)).not.toBeVisible();

    // 5. Submit Concern
    const submitBtn = page.locator('form').getByRole('button', { name: /Submit Concern/i });
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // Success confirmation
    await expect(
      page.getByText(/Concern submitted successfully|My Concerns|CS301 Grade Discrepancy/i).first()
    ).toBeVisible({ timeout: 20_000 });
  });

  test('AI-generated image is detected as AI and displays rejection warning', async ({ page }) => {
    // 1. Log in as student
    const loginBtn = page.locator('nav').getByRole('button', { name: 'Login' });
    await expect(loginBtn).toBeVisible({ timeout: 15_000 });
    await loginBtn.click();
    await page.getByRole('button', { name: 'student' }).click();

    await page.locator('input[placeholder="2023-00142"]').fill('2024-0001');
    await page.locator('input[type="password"]').fill('StudentPass123!');
    await page.getByRole('button', { name: /Sign in/i }).click();

    await expect(page.getByRole('heading', { name: /student dashboard/i }).first()).toBeVisible({ timeout: 20_000 });

    // 2. Navigate to Submit Concern
    await page.getByRole('button', { name: 'Submit Concern' }).click();

    await page.locator('#concern-title').fill('Synthetic Evidence Test');
    await page.locator('#concern-desc').fill('Testing AI-generated image verification rejection.');

    // 3. Attach AI-generated image
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'Synthetic_Evidence.png',
      mimeType: 'image/png',
      buffer: aiGeneratedBuffer
    });

    // 4. Expect AI detection rejection
    await expect(page.getByText('Possible AI-generated image').first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/appears to be AI-generated/i).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/AI signal/i).first()).toBeVisible({ timeout: 10_000 });

    // "Verified as real" should NOT be visible
    await expect(page.getByText(/Verified as real/i)).not.toBeVisible();

    // Dismiss notice or try another file
    const tryAnotherBtn = page.getByRole('button', { name: /Try another file/i });
    await expect(tryAnotherBtn).toBeVisible();
  });
});
