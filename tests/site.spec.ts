import { test, expect } from '@playwright/test';
test('homepage has four services, working anchors and loaded images', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/');
  await expect(page.locator('.service')).toHaveCount(4);
  await page.getByRole('navigation', { name: '주 메뉴' }).getByRole('link', { name: '서비스', exact: true }).click();
  await expect(page).toHaveURL(/#services$/);
  await page.locator('#contact').scrollIntoViewIfNeeded();
  for (const image of await page.locator('main img').all()) { await image.scrollIntoViewIfNeeded(); await expect.poll(() => image.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBeTruthy(); }
  expect(errors).toEqual([]);
});
test('mobile menu closes after anchor navigation without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 }); await page.goto('/');
  await page.getByRole('button', { name: '메뉴 열기' }).click();
  await page.getByRole('navigation').getByRole('link', { name: '프로젝트 문의' }).click();
  await expect(page).toHaveURL(/#contact$/); await expect(page.getByRole('button', { name: '메뉴 열기' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
  await page.screenshot({ path: 'artifacts/mobile.png', fullPage: true });
});
test('wrong password fails; 0000 opens all four editors and company settings; logout protects admin', async ({ page }) => {
  await page.goto('/admin'); await page.getByLabel('비밀번호').fill('wrong'); await page.getByRole('button', { name: '로그인', exact: true }).click();
  await expect(page.locator('.notice.error')).toContainText('비밀번호가 올바르지');
  await page.getByLabel('비밀번호').fill('0000'); await page.getByRole('button', { name: '로그인', exact: true }).click();
  await expect(page.getByRole('heading', { name: '상품군 관리' })).toBeVisible();
  await expect(page.getByRole('tab')).toHaveCount(4);
  await page.getByRole('tab').nth(3).click(); await expect(page.getByLabel('상품군 이름')).toHaveValue('웹사이트 제작');
  await page.getByLabel('제목', { exact: true }).fill('수정한 제목'); await expect(page.getByText('저장하지 않은 변경 사항')).toBeVisible();
  await expect(page.getByRole('button', { name: '변경 사항 저장' })).toBeDisabled();
  await page.getByRole('button', { name: '회사 정보', exact: true }).click();
  for (const label of ['회사명','연락처','이메일 주소','사무실 주소']) await expect(page.getByLabel(label, { exact: true })).toBeVisible();
  await page.screenshot({ path: 'artifacts/admin.png', fullPage: true });
  page.on('dialog', d => d.accept()); await page.getByRole('button', { name: '로그아웃' }).click();
  await expect(page.getByRole('heading', { name: '관리자 로그인' })).toBeVisible();
});
test('upload endpoint rejects anonymous and cross-origin writes', async ({ request }) => {
  const response = await request.post('/api/upload', { headers: { origin: 'http://localhost:3000' } }); expect(response.status()).toBe(401);
  const cross = await request.post('/api/upload', { headers: { origin: 'https://example.com' } }); expect(cross.status()).toBe(403);
});
test('desktop light and dark layouts render without overflow', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  for (const colorScheme of ['light','dark'] as const) { await page.emulateMedia({ colorScheme }); await page.goto('/'); await page.locator('#contact').scrollIntoViewIfNeeded(); await page.evaluate(() => window.scrollTo(0,0)); await page.screenshot({ path: `artifacts/home-${colorScheme}.png`, fullPage: true }); expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy(); }
});
