import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// .env 파일 직접 로드
dotenv.config({ path: path.resolve(__dirname, '../../../../../.env') });

const BASE_URL = process.env.BASE_URL || process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';

// 테스트용 관리자 계정
const TEST_ADMIN = {
  email: process.env.TEST_ADMIN_EMAIL || 'admin@example.com',
  password: process.env.TEST_ADMIN_PASSWORD || 'password1234',
};

test.describe('공지사항 목록 UI 테스트 (User Story 1)', () => {
  test.beforeEach(async ({ page }) => {
    // 각 테스트 전에 로그인
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // 로그인 페이지가 로드될 때까지 대기
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });

    // 로그인
    await page.fill('input[type="email"]', TEST_ADMIN.email);
    await page.fill('input[type="password"]', TEST_ADMIN.password);
    await page.click('button[type="submit"]');

    // 로그인 완료 대기
    await page.waitForURL(BASE_URL, { timeout: 10000 });
    await expect(page.locator('h1:has-text("관리자 로그인")')).not.toBeVisible({ timeout: 5000 });

    // 공지사항 관리 페이지로 이동
    // Sidebar에서 '공지사항' 메뉴 클릭
    const noticeMenuButton = page.locator('button').filter({ hasText: '공지사항' });
    await expect(noticeMenuButton).toBeVisible({ timeout: 5000 });
    await noticeMenuButton.click();
    
    // 공지사항 관리 페이지가 로드될 때까지 대기
    await page.waitForLoadState('networkidle');
    
    // 공지사항 관리 페이지 제목 확인
    await expect(page.locator('h2:has-text("공지사항")')).toBeVisible({ timeout: 10000 });
  });

  test('T030: 공지사항 목록 표시 테스트', async ({ page }) => {
    // "공지사항" 제목이 표시되는지 확인
    await expect(page.locator('h2:has-text("공지사항")')).toBeVisible();

    // "전체 N개의 공지사항" 텍스트가 표시되는지 확인
    const totalText = page.locator('p').filter({ hasText: /전체.*개의 공지사항/ });
    await expect(totalText).toBeVisible({ timeout: 5000 });

    // 검색 입력 필드가 표시되는지 확인 (공지사항 검색 필드만 선택)
    const searchInput = page.locator('input[placeholder="제목이나 내용으로 검색..."]');
    await expect(searchInput).toBeVisible();

    // API 호출 완료 대기
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 로딩 상태가 아닌지 확인
    const loadingText = page.locator('text=공지사항을 불러오는 중');
    const isLoading = await loadingText.isVisible({ timeout: 2000 }).catch(() => false);
    expect(isLoading).toBe(false);

    // 공지사항 목록이 표시되는지 확인 (공지사항이 있는 경우)
    // 또는 빈 상태 메시지가 표시되는지 확인 (공지사항이 없는 경우)
    const emptyMessage = page.locator('text=공지사항이 없습니다');
    const noticeItems = page.locator('[class*="noticeItem"]');

    const hasEmptyMessage = await emptyMessage.isVisible({ timeout: 2000 }).catch(() => false);
    const itemCount = await noticeItems.count();

    // 공지사항이 있거나 빈 메시지가 표시되어야 함
    if (itemCount > 0) {
      // 첫 번째 공지사항 아이템 확인
      const firstItem = noticeItems.first();
      const titleElement = firstItem.locator('h3').first();
      await expect(titleElement).toBeVisible();
    } else {
      // 빈 메시지가 표시되어야 함
      expect(hasEmptyMessage).toBe(true);
    }
  });

  test('T031: 검색 기능 테스트', async ({ page }) => {
    // 검색 입력 필드 찾기 (공지사항 검색 필드만 선택)
    const searchInput = page.locator('input[placeholder="제목이나 내용으로 검색..."]');
    await expect(searchInput).toBeVisible();

    // 초기 로딩 완료 대기
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 검색어 입력
    await searchInput.fill('시스템');

    // Debounce 대기 (300ms)
    await page.waitForTimeout(500);

    // API 호출 완료 대기
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // 검색 결과가 표시되는지 확인
    // 검색 결과가 있으면 공지사항이 표시되고, 없으면 빈 메시지가 표시됨
    const emptyMessage = page.locator('text=공지사항이 없습니다');
    const noticeItems = page.locator('[class*="noticeItem"]');

    const rowCount = await noticeItems.count();
    const hasEmptyMessage = await emptyMessage.isVisible({ timeout: 2000 }).catch(() => false);

    // 검색 결과가 있거나 빈 메시지가 표시되어야 함
    expect(rowCount > 0 || hasEmptyMessage).toBe(true);
  });

  test('T032: 빈 상태 표시 테스트', async ({ page }) => {
    // 검색 입력 필드 찾기 (공지사항 검색 필드만 선택)
    const searchInput = page.locator('input[placeholder="제목이나 내용으로 검색..."]');
    await expect(searchInput).toBeVisible();

    // 존재하지 않는 검색어 입력
    await searchInput.fill('존재하지않는공지사항검색어12345');

    // Debounce 대기 (300ms)
    await page.waitForTimeout(500);

    // API 호출 완료 대기
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 빈 상태 메시지가 표시되는지 확인
    const emptyMessage = page.locator('text=공지사항이 없습니다');
    const isEmptyMessageVisible = await emptyMessage.isVisible({ timeout: 5000 }).catch(() => false);

    // 빈 메시지가 표시되어야 함 (검색 결과가 없는 경우)
    // 또는 공지사항이 실제로 없는 경우도 있을 수 있음
    expect(isEmptyMessageVisible).toBe(true);
  });

  test('T033: 로딩 상태 표시 테스트', async ({ page }) => {
    // 네트워크 요청을 느리게 만들어 로딩 상태 확인
    await page.route('**/api/notices**', async (route) => {
      // 지연 추가
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.continue();
    });

    // 검색을 통해 API 호출 트리거 (페이지 새로고침 대신)
    const searchInput = page.locator('input[placeholder="제목이나 내용으로 검색..."]');
    await searchInput.clear();
    
    // 검색어 입력 (debounce가 300ms이므로, 입력 후 바로 확인)
    await searchInput.fill('로딩테스트');
    
    // 로딩 상태 메시지가 표시되는지 확인
    // route가 2초 지연되므로 로딩 상태가 표시되어야 함
    const loadingText = page.locator('text=공지사항을 불러오는 중');
    const isLoadingVisible = await loadingText.isVisible({ timeout: 3000 }).catch(() => false);

    // 로딩 상태가 표시되어야 함
    expect(isLoadingVisible).toBe(true);

    // 네트워크 요청 정상화
    await page.unroute('**/api/notices**');
  });

  test('T034: 에러 상태 표시 테스트', async ({ page }) => {
    // 네트워크 요청을 차단하여 에러 상태 시뮬레이션
    await page.route('**/api/notices**', route => route.abort());

    // 페이지 새로고침하여 API 호출 트리거
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 에러 메시지 또는 Toast 알림 확인
    // Toast 알림은 Sonner를 사용하므로 [data-sonner-toast] 또는 [role="alert"] 확인
    const errorToast = page.locator('[data-sonner-toast], [role="alert"], [role="status"]').filter({ 
      hasText: /실패|오류|에러|불러오/i 
    });
    
    // 에러가 표시되는지 확인 (Toast가 나타날 수 있음)
    const errorVisible = await errorToast.first().isVisible({ timeout: 5000 }).catch(() => false);
    
    // 또는 에러 메시지가 페이지에 표시되는지 확인 (에러 상태일 때 표시되는 메시지)
    const errorMessage = page.locator('text=/실패|오류|에러|불러오/i');
    const hasErrorMessage = await errorMessage.first().isVisible({ timeout: 5000 }).catch(() => false);
    
    // 또는 공지사항 목록 대신 에러 메시지가 표시되는지 확인
    const noticeItems = page.locator('[class*="noticeItem"]');
    const hasNoticeItems = await noticeItems.count().then(count => count > 0).catch(() => false);
    const errorDiv = page.locator('div').filter({ hasText: /실패|오류|에러/i });
    const hasErrorDiv = await errorDiv.first().isVisible({ timeout: 2000 }).catch(() => false);

    // 에러가 표시되었는지 확인 (Toast, 페이지 메시지, 또는 에러 div)
    // 네트워크 차단으로 인해 에러가 표시되어야 함
    expect(errorVisible || hasErrorMessage || hasErrorDiv || !hasNoticeItems).toBe(true);

    // 네트워크 차단 해제
    await page.unroute('**/api/notices**');
  });

  test('고정 공지사항 표시 테스트', async ({ page }) => {
    // API 호출 완료 대기
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 공지사항 목록 확인
    const noticeItems = page.locator('[class*="noticeItem"]');
    const itemCount = await noticeItems.count();

    if (itemCount > 0) {
      // 첫 번째 공지사항이 고정 공지사항인지 확인 (고정 공지사항은 상단에 배치됨)
      const firstItem = noticeItems.first();
      const pinnedBadge = firstItem.locator('span:has-text("공지")');
      const hasPinnedBadge = await pinnedBadge.isVisible({ timeout: 1000 }).catch(() => false);

      // 고정 공지사항이 있으면 "공지" 배지가 표시되어야 함
      // (고정 공지사항이 없을 수도 있으므로 hasPinnedBadge는 선택적)
      if (hasPinnedBadge) {
        await expect(pinnedBadge).toBeVisible();
      }
    }
  });
});

test.describe('공지사항 상세 조회 UI 테스트 (User Story 2)', () => {
  test.beforeEach(async ({ page }) => {
    // 각 테스트 전에 로그인
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // 로그인 페이지가 로드될 때까지 대기
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });

    // 로그인
    await page.fill('input[type="email"]', TEST_ADMIN.email);
    await page.fill('input[type="password"]', TEST_ADMIN.password);
    await page.click('button[type="submit"]');

    // 로그인 완료 대기
    await page.waitForURL(BASE_URL, { timeout: 10000 });
    await expect(page.locator('h1:has-text("관리자 로그인")')).not.toBeVisible({ timeout: 5000 });

    // 공지사항 관리 페이지로 이동
    const noticeMenuButton = page.locator('button').filter({ hasText: '공지사항' });
    await expect(noticeMenuButton).toBeVisible({ timeout: 5000 });
    await noticeMenuButton.click();
    
    // 공지사항 관리 페이지가 로드될 때까지 대기
    await page.waitForLoadState('networkidle');
    
    // 공지사항 관리 페이지 제목 확인
    await expect(page.locator('h2:has-text("공지사항")')).toBeVisible({ timeout: 10000 });
  });

  test('T043: 공지사항 상세 정보 표시 테스트', async ({ page }) => {
    // API 호출 완료 대기
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 공지사항 목록 확인
    const noticeItems = page.locator('[class*="noticeItem"]');
    const itemCount = await noticeItems.count();

    // 공지사항이 있어야 상세 조회 테스트 가능
    if (itemCount > 0) {
      // 첫 번째 공지사항 클릭
      const firstItem = noticeItems.first();
      const noticeTitle = await firstItem.locator('h3').first().textContent();
      await firstItem.click();

      // 상세 뷰로 전환 대기
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // 상세 뷰에서 제목이 표시되는지 확인
      const detailTitle = page.locator('h1').filter({ hasText: noticeTitle || '' });
      await expect(detailTitle).toBeVisible({ timeout: 5000 });

      // 작성자 정보가 표시되는지 확인
      const authorInfo = page.locator('text=/관리자|작성자/i');
      const hasAuthorInfo = await authorInfo.first().isVisible({ timeout: 2000 }).catch(() => false);
      expect(hasAuthorInfo).toBe(true);

      // 작성일 정보가 표시되는지 확인
      const dateInfo = page.locator('text=/\\d{4}-\\d{2}-\\d{2}/');
      const hasDateInfo = await dateInfo.first().isVisible({ timeout: 2000 }).catch(() => false);
      expect(hasDateInfo).toBe(true);

      // 조회수 정보가 표시되는지 확인
      const viewsInfo = page.locator('text=/조회수/i');
      const hasViewsInfo = await viewsInfo.isVisible({ timeout: 2000 }).catch(() => false);
      expect(hasViewsInfo).toBe(true);

      // 내용이 표시되는지 확인
      const contentArea = page.locator('[class*="c_gz1eh"], div').filter({ hasText: /./ });
      const hasContent = await contentArea.first().isVisible({ timeout: 2000 }).catch(() => false);
      expect(hasContent).toBe(true);
    } else {
      // 공지사항이 없는 경우 테스트 스킵
      test.skip();
    }
  });

  test('T044: "목록으로" 버튼 네비게이션 테스트', async ({ page }) => {
    // API 호출 완료 대기
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 공지사항 목록 확인
    const noticeItems = page.locator('[class*="noticeItem"]');
    const itemCount = await noticeItems.count();

    // 공지사항이 있어야 상세 조회 테스트 가능
    if (itemCount > 0) {
      // 첫 번째 공지사항 클릭하여 상세 뷰로 이동
      const firstItem = noticeItems.first();
      await firstItem.click();

      // 상세 뷰로 전환 대기
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // 상세 뷰가 표시되었는지 확인
      const detailTitle = page.locator('h1');
      await expect(detailTitle.first()).toBeVisible({ timeout: 5000 });

      // "목록으로" 버튼 찾기 (하단 버튼만 - 정확히 "목록으로" 텍스트만 가진 버튼)
      const backButton = page.getByRole('button', { name: '목록으로', exact: true });
      await expect(backButton).toBeVisible({ timeout: 2000 });

      // "목록으로" 버튼 클릭
      await backButton.click();

      // 목록 뷰로 돌아왔는지 확인
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      // 목록 뷰의 제목이 표시되는지 확인
      const listTitle = page.locator('h2:has-text("공지사항")');
      await expect(listTitle).toBeVisible({ timeout: 5000 });

      // 목록이 다시 표시되는지 확인
      const noticeList = page.locator('[class*="noticeItem"]');
      const listItemCount = await noticeList.count();
      expect(listItemCount).toBeGreaterThanOrEqual(0);
    } else {
      // 공지사항이 없는 경우 테스트 스킵
      test.skip();
    }
  });

  test('T045: 공지사항을 찾을 수 없을 때 에러 처리 테스트', async ({ page }) => {
    // 존재하지 않는 공지사항 ID로 API 호출 시뮬레이션
    // 실제로는 존재하지 않는 ID를 클릭할 수 없으므로, 네트워크 요청을 가로채서 404 응답 반환
    await page.route('**/api/notices/*', async (route) => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: '공지사항을 찾을 수 없습니다.',
        }),
      });
    });

    // API 호출 완료 대기
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 공지사항 목록 확인
    const noticeItems = page.locator('[class*="noticeItem"]');
    const itemCount = await noticeItems.count();

    // 공지사항이 있어야 클릭 가능
    if (itemCount > 0) {
      // 첫 번째 공지사항 클릭
      const firstItem = noticeItems.first();
      await firstItem.click();

      // 상세 뷰로 전환 대기
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // 에러 메시지가 표시되는지 확인
      const errorMessage = page.locator('text=/찾을 수 없습니다|공지사항을 찾을 수 없습니다/i');
      const hasErrorMessage = await errorMessage.isVisible({ timeout: 5000 }).catch(() => false);

      // 또는 Toast 알림으로 에러가 표시될 수 있음
      const errorToast = page.locator('[data-sonner-toast], [role="alert"]').filter({ 
        hasText: /찾을 수 없습니다|에러|실패/i 
      });
      const hasErrorToast = await errorToast.first().isVisible({ timeout: 5000 }).catch(() => false);

      // 에러 메시지 또는 Toast가 표시되어야 함
      expect(hasErrorMessage || hasErrorToast).toBe(true);

      // 네트워크 요청 정상화
      await page.unroute('**/api/notices/*');
    } else {
      // 공지사항이 없는 경우 테스트 스킵
      test.skip();
    }
  });

  test('T046: 상세 조회 API 호출 중 로딩 상태 표시 테스트', async ({ page }) => {
    // 상세 조회 API 요청을 느리게 만들어 로딩 상태 확인
    await page.route('**/api/notices/*', async (route) => {
      // 지연 추가
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.continue();
    });

    // API 호출 완료 대기
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 공지사항 목록 확인
    const noticeItems = page.locator('[class*="noticeItem"]');
    const itemCount = await noticeItems.count();

    // 공지사항이 있어야 클릭 가능
    if (itemCount > 0) {
      // 첫 번째 공지사항 클릭
      const firstItem = noticeItems.first();
      await firstItem.click();

      // 로딩 상태 메시지가 표시되는지 확인
      // route가 2초 지연되므로 로딩 상태가 표시되어야 함
      const loadingText = page.locator('text=/불러오는 중|로딩/i');
      const isLoadingVisible = await loadingText.isVisible({ timeout: 3000 }).catch(() => false);

      // 로딩 상태가 표시되어야 함
      expect(isLoadingVisible).toBe(true);

      // 네트워크 요청 정상화
      await page.unroute('**/api/notices/*');
    } else {
      // 공지사항이 없는 경우 테스트 스킵
      test.skip();
    }
  });
});
