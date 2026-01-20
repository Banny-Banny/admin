import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';

// 테스트용 관리자 계정 (환경 변수 또는 테스트 데이터에서 가져옴)
const TEST_ADMIN = {
  email: process.env.TEST_ADMIN_EMAIL || 'admin@example.com',
  password: process.env.TEST_ADMIN_PASSWORD || 'password123',
};

test.describe('관리자 로그인 E2E 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 각 테스트 전에 로그인 페이지로 이동
    await page.goto(BASE_URL);
    // 로그인 페이지가 로드될 때까지 대기
    await page.waitForLoadState('networkidle');
  });

  test('성공적인 로그인 플로우', async ({ page }) => {
    // 로그인 페이지가 표시되는지 확인
    await expect(page.locator('h1:has-text("관리자 로그인")')).toBeVisible();

    // 이메일과 비밀번호 입력
    await page.fill('input[type="email"]', TEST_ADMIN.email);
    await page.fill('input[type="password"]', TEST_ADMIN.password);

    // 로그인 버튼 클릭
    await page.click('button[type="submit"]');

    // 로그인 성공 후 루트 페이지로 리다이렉트되는지 확인 (실제 동작에 맞게 수정)
    await page.waitForURL(BASE_URL, { timeout: 10000 });
    
    // 대시보드가 표시되는지 확인 (Sidebar 또는 Header가 보이는지 확인)
    // 로그인 성공 시 로그인 페이지가 사라지고 대시보드가 표시되어야 함
    await expect(page.locator('h1:has-text("관리자 로그인")')).not.toBeVisible({ timeout: 5000 });
    
    // Toast 성공 메시지 확인 (선택사항)
    // await expect(page.locator('[data-sonner-toast]').filter({ hasText: '로그인 성공' })).toBeVisible({ timeout: 3000 });
  });

  test('잘못된 자격 증명으로 로그인 실패', async ({ page }) => {
    // 잘못된 이메일과 비밀번호 입력
    await page.fill('input[type="email"]', 'wrong@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');

    // 로그인 버튼 클릭
    await page.click('button[type="submit"]');

    // Toast 에러 메시지가 표시되는지 확인
    // Sonner Toast는 [data-sonner-toast] 또는 [role="alert"] 셀렉터 사용
    await expect(
      page.locator('[data-sonner-toast], [role="alert"]').filter({ hasText: /로그인|실패|오류/i })
    ).toBeVisible({ timeout: 5000 });

    // 로그인 페이지에 머물러 있는지 확인
    await expect(page).toHaveURL(BASE_URL);
    await expect(page.locator('h1:has-text("관리자 로그인")')).toBeVisible();
  });

  test('로그인 폼 검증', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');

    // HTML5 required 속성 확인
    await expect(emailInput).toHaveAttribute('required');
    await expect(passwordInput).toHaveAttribute('required');

    // 빈 폼으로 제출 시도
    await page.click('button[type="submit"]');

    // React Hook Form 에러 메시지 확인 (에러 메시지가 표시되는지 확인)
    // HTML5 validation이 먼저 작동할 수 있으므로, 에러 메시지가 표시되거나 validation이 작동하는지 확인
    const emailError = page.locator('.error_message').filter({ hasText: /이메일/i });
    const passwordError = page.locator('.error_message').filter({ hasText: /비밀번호/i });
    
    // 브라우저의 기본 validation 또는 React Hook Form validation이 작동하는지 확인
    const emailValidity = await emailInput.evaluate((el: HTMLInputElement) => {
      return !el.validity.valid;
    });
    const passwordValidity = await passwordInput.evaluate((el: HTMLInputElement) => {
      return !el.validity.valid;
    });

    // validation이 작동했는지 확인 (에러 메시지가 보이거나 validity가 false여야 함)
    const hasValidationError = emailValidity || passwordValidity || 
      (await emailError.count() > 0) || (await passwordError.count() > 0);
    expect(hasValidationError).toBe(true);

    // 유효하지 않은 이메일 형식 입력
    await emailInput.fill('invalid-email');
    await passwordInput.fill('password123');
    await page.click('button[type="submit"]');

    // 이메일 형식 검증이 작동하는지 확인
    const emailValidation = await emailInput.evaluate((el: HTMLInputElement) => {
      return el.validity.valid;
    });
    expect(emailValidation).toBe(false);

    // React Hook Form 에러 메시지 확인
    await expect(
      page.locator('.error_message').filter({ hasText: /유효한 이메일/i })
    ).toBeVisible({ timeout: 2000 });
  });
});
