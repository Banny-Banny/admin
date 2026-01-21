import { test, expect } from '@playwright/test';

const BASE_URL =
  process.env.BASE_URL ||
  process.env.PLAYWRIGHT_TEST_BASE_URL ||
  'http://localhost:3000';

// 로그인/라우팅 연동이 필요한 화면이라 현재는 스킵 처리합니다.
test.describe.skip('알림 발송 E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test('제목/내용 비워두면 즉시 발송 버튼 비활성', async ({ page }) => {
    // TODO: 로그인 및 마케팅 페이지 진입 후 버튼 상태 검증
    const button = page.getByRole('button', { name: /즉시 발송/i });
    await expect(button).toBeDisabled();
  });

  test('제목/내용 입력 시 즉시 발송 버튼 활성 및 발송', async ({ page }) => {
    // TODO: 로그인, 마케팅 페이지 진입 후 필드 입력 → 발송 요청 확인
    const button = page.getByRole('button', { name: /즉시 발송/i });
    await expect(button).toBeEnabled();
  });
});
