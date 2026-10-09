import { test, expect } from '@playwright/test';

test.describe('AI Concern Classification & Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('complete end-to-end workflow: student submission, AI classification, admin review & confirmation, staff delivery & notifications', async ({
    page,
    request
  }) => {
    test.setTimeout(120_000);

    // 1. Student logs in
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

    // 2. Student opens Submit Concern
    await page.getByRole('button', { name: 'Submit Concern' }).click();

    // 3. Student sees only the general concern form (no manual category selector buttons)
    await expect(page.getByText('Automated AI Classification Active')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('#concern-title')).toBeVisible();
    await expect(page.locator('#concern-desc')).toBeVisible();
    // Verify legacy manual category selector buttons do not exist on the form
    await expect(page.locator('button:has-text("Academic"), button:has-text("Administrative"), button:has-text("Facility"), button:has-text("Complaints")').filter({ hasNotText: 'AI' })).toHaveCount(0);

    // 4. Student submits a realistic academic concern
    const uniqueTitle = `CS 201 Missing Midterm Grade Inquiry ${Date.now()}`;
    const descriptionText =
      'I took the Midterm Examination for CS 201 Data Structures and Algorithms with the faculty instructor, but my official grading status in the portal is still missing or listed as INC. Please coordinate with Academic Affairs and the course professor.';
    await page.locator('#concern-title').fill(uniqueTitle);
    await page.locator('#concern-desc').fill(descriptionText);

    // Select High priority
    await page.getByRole('button', { name: /high/i }).click();

    // Submit and capture the backend response
    const [concernResponse] = await Promise.all([
      page.waitForResponse(
        (resp) => resp.url().includes('/api/concerns') && resp.request().method() === 'POST',
        { timeout: 45_000 }
      ),
      page.locator('form').getByRole('button', { name: /Submit Concern/i }).click()
    ]);

    expect(concernResponse.status()).toBe(201);
    const respJson = await concernResponse.json();
    const createdConcern = respJson.data;

    // 5. Verify Gemini/AI classification is returned
    expect(createdConcern).toBeDefined();
    expect(createdConcern.aiClassification).toBeDefined();
    expect(createdConcern.aiClassification.concernCategory).toBe('Academic');
    expect(typeof createdConcern.aiClassification.confidence).toBe('number');
    expect(createdConcern.aiClassification.confidence).toBeGreaterThan(0);
    expect(createdConcern.aiClassification.reasoning).toBeTruthy();

    // 6. Verify department recommendation
    expect(createdConcern.department).toMatch(/Academic Affairs|CITE/);

    // 7. Verify an appropriate staff member is recommended from the database
    expect(createdConcern.suggestedStaffId).toBeTruthy();
    expect(createdConcern.suggestedStaffName).toMatch(/Joemar Rogero|Maria Santos|Josephine Bulilan/);

    const recommendedStaffName = createdConcern.suggestedStaffName;
    const recommendedStaffId = createdConcern.suggestedStaffId;

    // Verify submission toast
    await expect(page.getByText('Concern submitted successfully!')).toBeVisible({ timeout: 15_000 });

    // 8. Admin logs in
    await page.evaluate(() => localStorage.clear());
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const adminLoginBtn = page.locator('nav').getByRole('button', { name: 'Login' });
    await expect(adminLoginBtn).toBeVisible({ timeout: 15_000 });
    await adminLoginBtn.click();
    await page.getByRole('button', { name: 'admin' }).click();

    await page.locator('input[type="email"]').fill('admin@nemsu.edu.ph');
    await page.locator('input[type="password"]').fill('Admin3msu');
    await page.getByRole('button', { name: /Sign in/i }).click();

    await expect(page.getByRole('heading', { name: /admin dashboard/i }).first()).toBeVisible({ timeout: 25_000 });

    // 9. Admin reviews the AI recommendation in All Concerns
    await page.getByRole('button', { name: 'All Concerns' }).click();
    await page.locator('input[placeholder*="Search"]').fill(uniqueTitle);
    await expect(page.getByText(uniqueTitle).first()).toBeVisible({ timeout: 15_000 });

    // Verify UI labels specified in requirements
    await expect(page.getByText('AI Classification').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/AI Confidence/i).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('AI Reasoning').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Recommended Department').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Recommended Staff').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Admin Final Assignment').first()).toBeVisible({ timeout: 10_000 });

    // 10. Admin confirms or changes the assignment
    // Explicitly assign Joemar Rogero (academicaffairs@nemsu.edu.ph)
    const staffSelect = page.locator('select').filter({ hasText: /Select staff member/i }).first();
    const joemarOption = staffSelect.locator('option', { hasText: /Joemar Rogero/i });
    if ((await joemarOption.count()) > 0) {
      const val = await joemarOption.first().getAttribute('value');
      if (val) await staffSelect.selectOption(val);
    }

    const [confirmResponse] = await Promise.all([
      page.waitForResponse(
        (resp) =>
          resp.url().includes('/api/concerns') &&
          resp.url().includes('/confirm') &&
          resp.request().method() === 'POST',
        { timeout: 20_000 }
      ),
      page.getByRole('button', { name: /Confirm Admin Final Assignment|Confirm & Forward/i }).first().click()
    ]);
    expect(confirmResponse.status()).toBe(200);

    // 11. Verify the final assignment is saved
    await expect(
      page.getByText(/Admin Final Assignment Confirmed|Confirmed & Forwarded|Concern confirmed/i).first()
    ).toBeVisible({ timeout: 15_000 });

    // 12. Staff logs in (Joemar Rogero in Academic Affairs)
    await page.evaluate(() => localStorage.clear());
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const staffLoginBtn = page.locator('nav').getByRole('button', { name: 'Login' });
    await expect(staffLoginBtn).toBeVisible({ timeout: 15_000 });
    await staffLoginBtn.click();
    await page.getByRole('button', { name: 'staff' }).click();

    await page.locator('input[type="email"]').fill('academicaffairs@nemsu.edu.ph');
    await page.locator('input[type="password"]').fill('StaffPass123!');
    await page.getByRole('button', { name: /Sign in/i }).click();

    await expect(page.getByRole('heading', { name: /staff dashboard/i }).first()).toBeVisible({ timeout: 25_000 });

    // 13. Verify the assigned concern appears in the Staff dashboard
    await page.getByRole('button', { name: 'Assigned to Me' }).click();
    await expect(page.getByText(uniqueTitle).first()).toBeVisible({ timeout: 15_000 });

    // 14. Verify the staff notification is created
    await page.getByRole('button', { name: /Notifications/i }).first().click();
    await expect(page.getByText('New Concern Assigned').first()).toBeVisible({ timeout: 15_000 });
  });

  test('security & authorization: unauthorized users cannot modify assignments or classifications', async ({
    page,
    request
  }) => {
    // 1. Log in as student to get student auth token
    const studentLoginResp = await request.post('http://localhost:3001/api/auth/login', {
      data: {
        identifier: '2024-0001',
        password: 'StudentPass123!',
        role: 'student'
      }
    });
    expect(studentLoginResp.status()).toBe(200);
    const studentData = await studentLoginResp.json();
    const studentToken = studentData.data.token;

    // 2. Log in as staff to get staff auth token
    const staffLoginResp = await request.post('http://localhost:3001/api/auth/login', {
      data: {
        identifier: 'staff@nemsu.edu.ph',
        password: 'StaffPass123!',
        role: 'staff'
      }
    });
    expect(staffLoginResp.status()).toBe(200);
    const staffData = await staffLoginResp.json();
    const staffToken = staffData.data.token;

    // 3. Create a test concern as student
    const createResp = await request.post('http://localhost:3001/api/concerns', {
      headers: {
        Authorization: `Bearer ${studentToken}`
      },
      data: {
        title: `Security Test Concern ${Date.now()}`,
        description: 'Testing authorization boundaries for concern confirmation and reassignments.',
        priority: 'medium'
      }
    });
    expect(createResp.status()).toBe(201);
    const concern = (await createResp.json()).data;

    // 4. Verify student CANNOT confirm concern (HTTP 403)
    const studentConfirmAttempt = await request.post(`http://localhost:3001/api/concerns/${concern.id}/confirm`, {
      headers: {
        Authorization: `Bearer ${studentToken}`
      },
      data: {
        assignedToId: 'any-staff-id'
      }
    });
    expect(studentConfirmAttempt.status()).toBe(403);

    // 5. Verify student CANNOT update or reassign concern (HTTP 403)
    const studentUpdateAttempt = await request.patch(`http://localhost:3001/api/concerns/${concern.id}`, {
      headers: {
        Authorization: `Bearer ${studentToken}`
      },
      data: {
        assignedTo: 'any-staff-id'
      }
    });
    expect(studentUpdateAttempt.status()).toBe(403);

    // 6. Verify staff CANNOT confirm concern (HTTP 403)
    const staffConfirmAttempt = await request.post(`http://localhost:3001/api/concerns/${concern.id}/confirm`, {
      headers: {
        Authorization: `Bearer ${staffToken}`
      },
      data: {
        assignedToId: 'any-staff-id'
      }
    });
    expect(staffConfirmAttempt.status()).toBe(403);

    // 7. Verify staff CANNOT reassign concern assignedTo or department (HTTP 403)
    const staffReassignAttempt = await request.patch(`http://localhost:3001/api/concerns/${concern.id}`, {
      headers: {
        Authorization: `Bearer ${staffToken}`
      },
      data: {
        assignedTo: 'different-staff-id',
        department: 'Registrar'
      }
    });
    expect(staffReassignAttempt.status()).toBe(403);
  });
});
