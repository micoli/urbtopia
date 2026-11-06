import { expect, test, type Page } from '@playwright/test';

async function openGame(page: Page, beta = true) {
  await page.addInitScript((subscribed) => {
    localStorage.setItem('urbtopia-prefs', JSON.stringify({ language: 'en', layout: 'C' }));
    localStorage.setItem('urbtopia-beta', String(subscribed));
  }, beta);
  await page.goto('/?e2e');
  await expect(page.locator('#splash')).toHaveCount(0, { timeout: 30_000 });
  await page.evaluate(async () => {
    const { cloudStore } = await import('../src/store/cloudStore.ts');
    const { setBugReportClientForTests } = await import('../src/bugReports/bugReportClientHandle.ts');
    const { FakeBugReportClient } = await import('../src/bugReports/fakeBugReportClient.ts');
    cloudStore.setState({ enabled: true, account: { userId: 'u1', email: 'player@example.com' } as never });
    const client = new FakeBugReportClient();
    (window as unknown as { fakeReports: unknown }).fakeReports = client;
    setBugReportClientForTests(client);
  });
}

const openForm = (page: Page) => page.evaluate(async () => (await import('../src/ui/bugReport/requestBugReport.ts')).requestBugReport());
const sent = (page: Page) => page.evaluate(() => (window as unknown as { fakeReports: { reports: { submission: Record<string, unknown> }[] } }).fakeReports.reports.map((report) => report.submission));

test('sends a report with the map capture, the City and the camera pose', async ({ page }) => {
  await openGame(page);
  await openForm(page);
  const form = page.getByRole('dialog', { name: 'Report an issue' });
  await expect(form).toBeVisible({ timeout: 30_000 });
  await expect(form.getByRole('radio', { name: 'Map only' })).toHaveAttribute('aria-checked', 'true');
  await form.getByRole('textbox', { name: 'What happened?' }).fill('Roads vanish near the lake');
  await form.getByRole('button', { name: 'Send' }).click();
  await expect(page.getByText('Thank you, your report was sent.')).toBeVisible();
  const [report] = await sent(page);
  expect(report).toMatchObject({ description: 'Roads vanish near the lake' });
  expect(String(report?.screenshot)).toMatch(/^data:image\//);
  expect(report?.city).toMatchObject({ kind: 'json' });
  expect(report?.camera).toMatchObject({ level: 0 });
});

test('sends no image and no City when the player unchecks them', async ({ page }) => {
  await openGame(page);
  await openForm(page);
  const form = page.getByRole('dialog', { name: 'Report an issue' });
  await expect(form).toBeVisible({ timeout: 30_000 });
  await form.getByRole('radio', { name: 'No image' }).click();
  await form.getByRole('checkbox', { name: 'Attach my city' }).click();
  await form.getByRole('textbox', { name: 'What happened?' }).fill('Only text');
  await form.getByRole('button', { name: 'Send' }).click();
  await expect(page.getByText('Thank you, your report was sent.')).toBeVisible();
  const [report] = await sent(page);
  expect(report).toMatchObject({ screenshot: null, city: null });
});

test('offers the whole screen with a warning about other players', async ({ page }) => {
  await openGame(page);
  await openForm(page);
  const form = page.getByRole('dialog', { name: 'Report an issue' });
  await expect(form).toBeVisible({ timeout: 30_000 });
  const whole = form.getByRole('radio', { name: 'Whole screen' });
  await expect(whole).toBeEnabled({ timeout: 10_000 });
  await whole.click();
  await expect(form.getByText(/other players/)).toBeVisible();
  await expect(form.getByRole('img', { name: 'Preview of the screenshot' })).toBeVisible();
});

test('disables the City when it is too large to be attached', async ({ page }) => {
  await openGame(page);
  await openForm(page);
  const form = page.getByRole('dialog', { name: 'Report an issue' });
  await expect(form).toBeVisible({ timeout: 30_000 });
  await form.getByRole('button', { name: 'Cancel' }).click();
  await page.evaluate(async () => {
    const { bugReportStore } = await import('../src/bugReports/bugReportStore.ts');
    const noise = Array.from({ length: 4_500_000 }, () => Math.floor(Math.random() * 36).toString(36)).join('');
    bugReportStore.setState({ open: true, snapshot: { map: null, screen: null, pose: null, cityId: 'c', citySeed: 's', cityText: JSON.stringify({ noise }) } });
  });
  await expect(page.getByRole('checkbox', { name: 'Attach my city' })).toBeDisabled({ timeout: 30_000 });
  await expect(page.getByText('Your city is too large to be attached.')).toBeVisible();
});

test('keeps the form open after a failed send and sends it on retry', async ({ page }) => {
  await openGame(page);
  await openForm(page);
  const form = page.getByRole('dialog', { name: 'Report an issue' });
  await expect(form).toBeVisible({ timeout: 30_000 });
  await form.getByRole('textbox', { name: 'What happened?' }).fill('Offline report');
  await page.evaluate(async () => {
    const { BugReportError } = await import('../src/bugReports/types.ts');
    (window as unknown as { fakeReports: { failNext: unknown } }).fakeReports.failNext = new BugReportError('offline');
  });
  await form.getByRole('button', { name: 'Send' }).click();
  await expect(form.getByText(/could not be sent/)).toBeVisible();
  await expect(form.getByRole('textbox', { name: 'What happened?' })).toHaveValue('Offline report');
  await form.getByRole('button', { name: 'Retry' }).click();
  await expect(page.getByText('Thank you, your report was sent.')).toBeVisible();
  expect(await sent(page)).toHaveLength(1);
});

test('reads an Admin reply in My reports, answers it, and finds the thread closed once resolved', async ({ page }) => {
  await openGame(page);
  const id = await page.evaluate(async () => {
    const client = (window as unknown as { fakeReports: { send: (report: unknown) => Promise<number>; adminReply: (id: number, body: string) => void } }).fakeReports;
    const reportId = await client.send({ description: 'Roads vanish', camera: null, context: {}, cityId: null, citySeed: null, screenshot: null, city: null });
    client.adminReply(reportId, 'Which lake?');
    const { bugReportInboxStore } = await import('../src/bugReports/bugReportInboxStore.ts');
    await bugReportInboxStore.getState().refresh();
    return reportId;
  });
  await page.evaluate(async () => {
    const { uiStore } = await import('../src/store/uiStore.ts');
    uiStore.getState().toggleSettings();
    uiStore.getState().setSettingsTab('reports');
  });
  const inbox = page.getByRole('dialog', { name: 'Settings' });
  await expect(inbox.getByRole('tab', { name: /Reports/ })).toContainText('1');
  await expect(inbox.getByText('New reply')).toBeVisible();
  await inbox.getByRole('button', { name: /Roads vanish/ }).click();
  await expect(inbox.getByText('Which lake?')).toBeVisible();
  await inbox.getByRole('textbox', { name: 'Write a reply' }).fill('The north one');
  await inbox.getByRole('button', { name: 'Reply' }).click();
  await expect(inbox.getByText('The north one')).toBeVisible();

  await page.evaluate((reportId) => (window as unknown as { fakeReports: { resolve: (id: number) => void } }).fakeReports.resolve(reportId), id);
  await inbox.getByRole('button', { name: 'Back' }).click();
  await inbox.getByRole('button', { name: /Roads vanish/ }).click();
  await expect(inbox.getByText(/This report is resolved/)).toBeVisible();
  await expect(inbox.getByRole('textbox', { name: 'Write a reply' })).toHaveCount(0);
});

test('an account without an email gets a notice instead of the form', async ({ page }) => {
  await openGame(page);
  await page.evaluate(async () => (await import('../src/store/cloudStore.ts')).cloudStore.setState({ account: { userId: 'u1', email: null } as never }));
  await openForm(page);
  await expect(page.getByText('Attach an email to your account to report a bug.')).toBeVisible();
  await expect(page.getByRole('dialog', { name: 'Report an issue' })).toHaveCount(0);
});

test('the report features are absent until the Player joins the beta', async ({ page }) => {
  await openGame(page, false);
  await openForm(page);
  await expect(page.getByRole('dialog', { name: 'Report an issue' })).toHaveCount(0);
  await expect(page.getByText('Attach an email to your account to report a bug.')).toHaveCount(0);
  await page.evaluate(async () => (await import('../src/store/uiStore.ts')).uiStore.getState().toggleSettings());
  const settings = page.getByRole('dialog', { name: 'Settings' });
  await expect(settings.getByRole('tab', { name: 'Game' })).toBeVisible();
  await expect(settings.getByRole('tab', { name: /Reports/ })).toHaveCount(0);
  await expect(settings.getByRole('button', { name: 'Report an issue' })).toHaveCount(0);
});

test('Report a bug sits between City and Difficulty in the Game tab', async ({ page }) => {
  await openGame(page);
  await page.evaluate(async () => (await import('../src/store/uiStore.ts')).uiStore.getState().toggleSettings());
  const settings = page.getByRole('dialog', { name: 'Settings' });
  await expect(settings.getByRole('heading', { name: 'Report an issue' })).toBeVisible();
  const headings = await settings.locator('.settings-section h3').allTextContents();
  const order = headings.map((text) => text.trim());
  expect(order.indexOf('Report an issue')).toBe(order.indexOf('City') + 1);
  expect(order.indexOf('Difficulty')).toBe(order.indexOf('Report an issue') + 1);
});
