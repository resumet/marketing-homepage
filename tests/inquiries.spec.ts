import { test, expect } from '@playwright/test';
import { loadEnvConfig } from '@next/env';
import { randomUUID } from 'node:crypto';

loadEnvConfig(process.cwd());
const baseURL = process.env.INQUIRY_TEST_URL || 'http://localhost:3000';
const dbURL = process.env.SUPABASE_URL;
const dbKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const sample = { name: '[자동 테스트] 문의 접수 검증', phone: '010-0000-0000', email: 'inquiry-test@example.com', fax: '02-0000-0000', message: '자동 검증용 문의입니다. 검증 종료 후 삭제됩니다.\n두 번째 줄도 보존합니다.' };

async function database(id: string, method = 'GET') {
  return fetch(`${dbURL}/rest/v1/inquiries?id=eq.${id}`, { method, headers: { apikey: dbKey!, Authorization: `Bearer ${dbKey}` } });
}

test('inquiry validation and admin access protection', async ({ page, request }) => {
  await page.goto(`${baseURL}/admin/inquiries`);
  await expect(page).toHaveURL(`${baseURL}/admin`);
  const headers = { origin: baseURL };
  const invalidPhone = await request.post(`${baseURL}/api/inquiries`, { headers, data: { ...sample, id: randomUUID(), phone: '011-1234-5678' } });
  expect(invalidPhone.status()).toBe(400);
  const tooLong = await request.post(`${baseURL}/api/inquiries`, { headers, data: { ...sample, id: randomUUID(), message: '가'.repeat(1501) } });
  expect(tooLong.status()).toBe(400);
  const crossOrigin = await request.post(`${baseURL}/api/inquiries`, { headers: { origin: 'https://example.com' }, data: { ...sample, id: randomUUID() } });
  expect(crossOrigin.status()).toBe(403);
  expect((await request.get(`${baseURL}/api/inquiries`)).status()).toBe(405);
});

test('real inquiry submission, deduplication, admin details and read status', async ({ page, request }) => {
  test.skip(!dbURL || !dbKey, 'Supabase credentials required for integration test');
  let id: string | undefined;
  try {
    await page.goto(baseURL);
    await page.getByLabel('담당자 이름').fill(sample.name);
    await page.getByLabel('휴대폰 번호').fill('01000000000');
    await expect(page.getByLabel('휴대폰 번호')).toHaveValue(sample.phone);
    await page.getByLabel('이메일 주소', { exact: false }).fill(sample.email);
    await page.getByLabel('팩스번호').fill(sample.fax);
    await page.getByLabel('문의사항').fill(sample.message);
    const sent = page.waitForRequest(r => r.url().endsWith('/api/inquiries') && r.method() === 'POST');
    await page.getByRole('button', { name: '문의하기', exact: true }).click();
    id = (await sent).postDataJSON().id;
    await expect(page.getByRole('status')).toContainText('문의가 접수되었습니다');
    let rows = await (await database(id!)).json();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ ...sample, is_read: false });
    const duplicate = await request.post(`${baseURL}/api/inquiries`, { headers: { origin: baseURL }, data: { ...sample, id } });
    expect(duplicate.status()).toBe(201);
    expect(await (await database(id!)).json()).toHaveLength(1);
    await page.goto(`${baseURL}/admin`);
    await page.getByLabel('비밀번호').fill(process.env.ADMIN_PASSWORD || '0000');
    await page.getByRole('button', { name: '로그인', exact: true }).click();
    await expect(page.getByRole('heading', { name: '상품군 관리' })).toBeVisible();
    await page.getByRole('link', { name: '접수된 문의', exact: true }).click();
    const item = page.locator('.inquiry-item').filter({ hasText: sample.name });
    await item.locator('summary').click();
    await expect(item).toContainText(sample.phone);
    await expect(item).toContainText(sample.email);
    await expect(item).toContainText(sample.fax);
    await expect(item.locator('.inquiry-message')).toHaveText(sample.message);
    await item.getByRole('button', { name: '확인 완료로 표시' }).click();
    await expect(item.locator('.inquiry-badge')).toHaveText('확인 완료');
    rows = await (await database(id!)).json();
    expect(rows[0].is_read).toBe(true);
  } finally {
    if (id) expect((await database(id, 'DELETE')).ok).toBeTruthy();
  }
});

test('mobile form length limit and failed submission preserve input', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.route('**/api/inquiries', route => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: '잠시 후 다시 시도해주세요.' }) }));
  await page.goto(baseURL);
  await page.getByLabel('담당자 이름').fill(sample.name);
  await page.getByLabel('휴대폰 번호').fill(sample.phone);
  await page.getByLabel('이메일 주소', { exact: false }).fill(sample.email);
  await page.getByLabel('문의사항').fill('가'.repeat(1500));
  await expect(page.getByLabel('문의사항')).toHaveAttribute('maxlength', '1500');
  await expect(page.locator('#inquiry-counter')).toHaveText('1,500 / 1,500자');
  await page.getByRole('button', { name: '문의하기', exact: true }).click();
  await expect(page.locator('.inquiry-form .notice.error')).toBeVisible();
  await expect(page.getByLabel('담당자 이름')).toHaveValue(sample.name);
  await expect(page.getByLabel('문의사항')).toHaveValue('가'.repeat(1500));
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
});
