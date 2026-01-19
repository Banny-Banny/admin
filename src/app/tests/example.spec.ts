import { test, expect } from '@playwright/test';

test.describe('홈페이지 테스트', () => {
  test('페이지가 정상적으로 로드되는지 확인', async ({ page }) => {
    await page.goto('/');
    
    // 페이지 제목 확인
    await expect(page).toHaveTitle(/Create Next App/);
  });

  test('페이지 콘텐츠 확인', async ({ page }) => {
    await page.goto('/');
    
    // 페이지에 특정 텍스트가 있는지 확인
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});
