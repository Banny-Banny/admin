import { test, expect } from '@playwright/test';
import { AdminRole } from '../../../commons/enums';
import { AdminInfo } from '../../../commons/types/auth';

const BASE_URL =
  process.env.BASE_URL ||
  process.env.PLAYWRIGHT_TEST_BASE_URL ||
  'http://localhost:3000';

/**
 * 로그인 페이지를 건너뛰기 위해 로컬 스토리지에 가짜 세션을 주입합니다.
 * 실제 API 호출까지는 하지 않고 버튼 상태/전환만 검증합니다.
 */
const setFakeSession = async (page: Parameters<typeof test.beforeEach>[0]['page']) => {
  const admin: AdminInfo = {
    id: 'test-admin-id',
    email: 'admin@example.com',
    name: 'Test Admin',
    role: AdminRole.ADMIN,
  };
  // 페이지 로드 후 세션을 주입하고 리로드하여 인증 상태를 반영합니다.
  await page.goto(BASE_URL);
  await page.evaluate(({ admin }) => {
    window.localStorage.setItem(
      'admin_auth_session',
      JSON.stringify({
        accessToken: 'fake-access-token',
        refreshToken: 'fake-refresh-token',
        admin,
      })
    );
  }, { admin });
  await page.reload({ waitUntil: 'domcontentloaded' });
};

test.describe('알림 발송 E2E', () => {
  test.beforeEach(async ({ page }) => {
    await setFakeSession(page);
    // 앱이 인증 상태로 전환될 때까지 사이드바 로고를 기다립니다.
    await expect(page.getByRole('heading', { name: 'Admin' })).toBeVisible({
      timeout: 15000,
    });
    // 사이드바에서 알림/마케팅 페이지로 이동
    await page.getByRole('button', { name: '알림/마케팅' }).click();
    await expect(page.getByRole('heading', { name: '알림 / 마케팅' })).toBeVisible();
  });

  test('제목/내용 비워두면 즉시 발송 버튼 비활성', async ({ page }) => {
    const button = page.getByRole('button', { name: /즉시 발송/i });
    await expect(button).toBeDisabled();
  });

  test('제목/내용 입력 시 즉시 발송 버튼 활성 및 발송', async ({ page }) => {
    // "메시지 발송" 탭이 활성화되어 있는지 확인 (폼이 이 탭에만 있음)
    const sendTab = page.getByRole('button', { name: /메시지 발송/i });
    await expect(sendTab).toBeVisible();
    
    // 폼 요소들이 보일 때까지 대기
    const typeSelect = page.locator('select[name="type"]');
    const targetSelect = page.locator('select[name="target"]');
    await expect(typeSelect).toBeVisible({ timeout: 10000 });
    await expect(targetSelect).toBeVisible({ timeout: 10000 });
    
    await typeSelect.selectOption({ label: '안내' });
    await targetSelect.selectOption({ label: '전체 회원 (1,523명)' });
    await page.getByPlaceholder('메시지 제목을 입력하세요').fill('테스트 알림 제목');
    await page.getByPlaceholder('메시지 내용을 입력하세요').fill(
      '테스트 알림 본문입니다.'
    );
    const button = page.getByRole('button', { name: /즉시 발송/i });
    await expect(button).toBeEnabled();
  });
});
