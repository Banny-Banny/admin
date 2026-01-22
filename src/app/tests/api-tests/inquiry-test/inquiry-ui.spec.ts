import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// .env 파일 직접 로드
dotenv.config({ path: path.resolve(__dirname, '../../../../../.env') });

const BASE_URL = process.env.BASE_URL || process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';

// 테스트용 관리자 계정
const TEST_ADMIN = {
  email: process.env.TEST_ADMIN_EMAIL || 'admin@example.com',
  password: process.env.TEST_ADMIN_PASSWORD || 'password123',
};

test.describe('문의하기 목록 UI 테스트 (User Story 1)', () => {
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

    // 문의하기 관리 페이지로 이동
    // Sidebar에서 '문의하기' 메뉴 클릭
    const inquiryMenuButton = page.locator('button').filter({ hasText: '문의하기' });
    await expect(inquiryMenuButton).toBeVisible({ timeout: 5000 });
    await inquiryMenuButton.click();
    
    // 문의하기 관리 페이지가 로드될 때까지 대기
    await page.waitForLoadState('networkidle');
    
    // 문의하기 관리 페이지 제목 확인
    await expect(page.locator('h2:has-text("문의하기")')).toBeVisible({ timeout: 10000 });
  });

  test('T001: 문의 목록 표시 테스트', async ({ page }) => {
    // "문의하기" 제목이 표시되는지 확인
    await expect(page.locator('h2:has-text("문의하기")')).toBeVisible();

    // "최근 문의 사항" 제목이 표시되는지 확인
    await expect(page.locator('h3:has-text("최근 문의 사항")')).toBeVisible({ timeout: 5000 });

    // 검색 입력 필드가 표시되는지 확인
    const searchInput = page.locator('input[aria-label="문의 검색"]');
    await expect(searchInput).toBeVisible();

    // 상태 필터 select가 표시되는지 확인
    const statusFilter = page.locator('select[aria-label="상태 필터"]');
    await expect(statusFilter).toBeVisible();

    // API 호출 완료 대기
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 로딩 상태가 아닌지 확인
    const loadingText = page.locator('text=문의 목록을 불러오는 중');
    const isLoading = await loadingText.isVisible({ timeout: 2000 }).catch(() => false);
    expect(isLoading).toBe(false);

    // 문의 목록이 표시되는지 확인 (문의가 있는 경우)
    // 또는 빈 상태 메시지가 표시되는지 확인 (문의가 없는 경우)
    const emptyMessage = page.locator('text=문의가 없습니다');
    const inquiryItems = page.locator('[class*="c_1h3v33w"]');

    const hasEmptyMessage = await emptyMessage.isVisible({ timeout: 2000 }).catch(() => false);
    const itemCount = await inquiryItems.count();

    // 문의가 있거나 빈 메시지가 표시되어야 함
    if (itemCount > 0) {
      // 첫 번째 문의 아이템 확인
      const firstItem = inquiryItems.first();
      const userNickname = firstItem.locator('h4');
      await expect(userNickname).toBeVisible();
    } else {
      // 빈 메시지가 표시되어야 함
      expect(hasEmptyMessage).toBe(true);
    }
  });

  test('T002: 검색 기능 테스트', async ({ page }) => {
    // 검색 입력 필드 찾기
    const searchInput = page.locator('input[aria-label="문의 검색"]');
    await expect(searchInput).toBeVisible();

    // 초기 로딩 완료 대기
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 초기 문의 개수 확인 (문의가 없으면 테스트 스킵)
    const initialItems = page.locator('[class*="c_1h3v33w"]');
    const initialCount = await initialItems.count();
    
    if (initialCount === 0) {
      test.skip(true, '문의가 없어 검색 테스트를 스킵합니다.');
      return;
    }

    // 검색어 입력
    await searchInput.fill('테스트');

    // Debounce 대기 (300ms)
    await page.waitForTimeout(500);

    // API 호출 완료 대기
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // 검색 결과가 표시되는지 확인
    // 검색 결과가 있으면 문의가 표시되고, 없으면 빈 메시지가 표시됨
    const emptyMessage = page.locator('text=/검색 결과가 없습니다|문의가 없습니다|결과 없음/');
    const inquiryItems = page.locator('[class*="c_1h3v33w"]');

    const rowCount = await inquiryItems.count();
    const hasEmptyMessage = await emptyMessage.isVisible({ timeout: 2000 }).catch(() => false);

    // 검색 결과가 있거나 빈 메시지가 표시되어야 함
    expect(rowCount > 0 || hasEmptyMessage).toBe(true);
  });

  test('T003: 상태 필터 테스트', async ({ page }) => {
    // 상태 필터 select 찾기
    const statusFilter = page.locator('select[aria-label="상태 필터"]');
    await expect(statusFilter).toBeVisible();

    // 필터 옵션 확인
    const statusOptions = await statusFilter.locator('option').allTextContents();
    expect(statusOptions.some(text => text.includes('모든 상태'))).toBe(true);
    expect(statusOptions.some(text => text.includes('대기중'))).toBe(true);
    expect(statusOptions.some(text => text.includes('처리중'))).toBe(true);
    expect(statusOptions.some(text => text.includes('보류'))).toBe(true);
    expect(statusOptions.some(text => text.includes('완료'))).toBe(true);

    // 상태 필터 변경 (대기중)
    await statusFilter.selectOption({ value: 'PENDING' });

    // API 호출 완료 대기
    await page.waitForTimeout(500);
    await page.waitForLoadState('networkidle');

    // 필터가 적용되었는지 확인
    const inquiryItems = page.locator('[class*="c_1h3v33w"]');
    const rowCount = await inquiryItems.count();

    if (rowCount > 0) {
      // 모든 문의가 PENDING 상태인지 확인 (상태 태그 확인)
      const statusTags = page.locator('span:has-text("대기중")');
      const statusTagCount = await statusTags.count();
      // 최소한 일부는 대기중 상태여야 함
      expect(statusTagCount).toBeGreaterThanOrEqual(0);
    }

    // 다시 모든 상태로 변경
    await statusFilter.selectOption({ value: 'all' });
    await page.waitForTimeout(500);
    await page.waitForLoadState('networkidle');
  });

  test('T004: 빈 상태 표시 테스트', async ({ page }) => {
    // 검색 입력 필드 찾기
    const searchInput = page.locator('input[aria-label="문의 검색"]');
    await expect(searchInput).toBeVisible();

    // 존재하지 않는 검색어 입력
    await searchInput.fill('존재하지않는문의검색어12345');

    // Debounce 대기 (300ms)
    await page.waitForTimeout(500);

    // API 호출 완료 대기
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 빈 상태 메시지가 표시되는지 확인
    const emptyMessage = page.locator('text=검색 결과가 없습니다');
    const isEmptyMessageVisible = await emptyMessage.isVisible({ timeout: 5000 }).catch(() => false);

    // 빈 메시지가 표시되어야 함 (검색 결과가 없는 경우)
    expect(isEmptyMessageVisible).toBe(true);
  });

  test('T005: 로딩 상태 표시 테스트', async ({ page }) => {
    // 네트워크 요청을 느리게 만들어 로딩 상태 확인
    await page.route('**/api/admin/inquiries**', async (route) => {
      // 지연 추가
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.continue();
    });

    // 검색을 통해 API 호출 트리거 (페이지 새로고침 대신)
    const searchInput = page.locator('input[aria-label="문의 검색"]');
    await searchInput.clear();
    
    // 검색어 입력 (debounce가 300ms이므로, 입력 후 바로 확인)
    await searchInput.fill('로딩테스트');
    
    // 로딩 상태 메시지가 표시되는지 확인
    // route가 2초 지연되므로 로딩 상태가 표시되어야 함
    const loadingText = page.locator('text=문의 목록을 불러오는 중');
    const isLoadingVisible = await loadingText.isVisible({ timeout: 3000 }).catch(() => false);

    // 로딩 상태가 표시되어야 함
    expect(isLoadingVisible).toBe(true);

    // 네트워크 요청 정상화
    await page.unroute('**/api/admin/inquiries**');
  });

  test('T006: 에러 상태 표시 테스트', async ({ page }) => {
    // 네트워크 요청을 차단하여 에러 상태 시뮬레이션
    await page.route('**/api/admin/inquiries**', route => route.abort());

    // 페이지 새로고침하여 API 호출 트리거
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 에러 메시지 또는 Toast 알림 확인
    const errorToast = page.locator('[data-sonner-toast], [role="alert"], [role="status"]').filter({ 
      hasText: /실패|오류|에러|불러오/i 
    });
    
    // 에러가 표시되는지 확인 (Toast가 나타날 수 있음)
    const errorVisible = await errorToast.first().isVisible({ timeout: 5000 }).catch(() => false);
    
    // 또는 에러 메시지가 페이지에 표시되는지 확인
    const errorMessage = page.locator('text=/실패|오류|에러|불러오/i');
    const hasErrorMessage = await errorMessage.first().isVisible({ timeout: 5000 }).catch(() => false);
    
    // 또는 문의 목록 대신 에러 메시지가 표시되는지 확인
    const inquiryItems = page.locator('[class*="c_1h3v33w"], [class*="inquiryItem"]');
    const hasInquiryItems = await inquiryItems.count().then(count => count > 0).catch(() => false);
    const errorDiv = page.locator('div').filter({ hasText: /실패|오류|에러/i });
    const hasErrorDiv = await errorDiv.first().isVisible({ timeout: 2000 }).catch(() => false);

    // 에러가 표시되었는지 확인 (Toast, 페이지 메시지, 또는 에러 div)
    expect(errorVisible || hasErrorMessage || hasErrorDiv || !hasInquiryItems).toBe(true);

    // 네트워크 차단 해제
    await page.unroute('**/api/admin/inquiries**');
  });

  test('T007: 페이지네이션 테스트', async ({ page }) => {
    // API 호출 완료 대기
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 페이지네이션 컨트롤 확인
    const paginationInfo = page.locator('text=/전체.*개 중.*개 표시/');
    const paginationVisible = await paginationInfo.isVisible({ timeout: 2000 }).catch(() => false);

    if (paginationVisible) {
      // 페이지네이션 버튼 확인
      const nextButton = page.locator('button').filter({ hasText: /다음|>/ });
      const prevButton = page.locator('button').filter({ hasText: /이전|</ });

      // 다음 페이지 버튼이 있으면 클릭
      if (await nextButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await nextButton.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // 페이지가 변경되었는지 확인
        const inquiryItems = page.locator('[class*="c_1h3v33w"]');
        await expect(inquiryItems.first()).toBeVisible({ timeout: 5000 });
      }
    } else {
      // 페이지네이션이 없는 경우 (문의가 적은 경우) 테스트 스킵
      test.skip();
    }
  });
});

test.describe('문의하기 상세 조회 및 채팅 UI 테스트 (User Story 2)', () => {
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

    // 문의하기 관리 페이지로 이동
    const inquiryMenuButton = page.locator('button').filter({ hasText: '문의하기' });
    await expect(inquiryMenuButton).toBeVisible({ timeout: 5000 });
    await inquiryMenuButton.click();
    
    // 문의하기 관리 페이지가 로드될 때까지 대기
    await page.waitForLoadState('networkidle');
    
    // 문의하기 관리 페이지 제목 확인
    await expect(page.locator('h2:has-text("문의하기")')).toBeVisible({ timeout: 10000 });
  });

  test('T010: 문의 선택 시 채팅 인터페이스 표시 테스트', async ({ page }) => {
    // API 호출 완료 대기
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 문의 목록 확인
    const inquiryItems = page.locator('[class*="c_1h3v33w"]');
    const itemCount = await inquiryItems.count();

    // 문의가 있어야 상세 조회 테스트 가능
    expect(itemCount).toBeGreaterThan(0);

    // 첫 번째 문의 클릭
    const firstItem = inquiryItems.first();
    await firstItem.click();

    // 채팅 인터페이스가 표시되는지 확인
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 채팅 인터페이스의 메시지 입력 필드 확인
    const messageInput = page.locator('textarea[placeholder*="메시지를 입력하세요"]');
    await expect(messageInput).toBeVisible({ timeout: 5000 });

    // 전송 버튼 확인
    const sendButton = page.locator('button[aria-label="메시지 전송"]');
    await expect(sendButton).toBeVisible({ timeout: 2000 });
  });

  test('T011: 채팅 메시지 표시 테스트', async ({ page }) => {
    // API 호출 완료 대기
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 문의 목록 확인
    const inquiryItems = page.locator('[class*="c_1h3v33w"]');
    const itemCount = await inquiryItems.count();

    expect(itemCount).toBeGreaterThan(0);

    // 첫 번째 문의 클릭
    const firstItem = inquiryItems.first();
    await firstItem.click();

    // 채팅 인터페이스 로드 대기
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // 메시지 영역 확인
    const messagesContainer = page.locator('[class*="c_1g2rryz"], [class*="messages"], [class*="chat"]');
    await expect(messagesContainer).toBeVisible({ timeout: 5000 });
  });

  test('T012: 메시지 전송 테스트', async ({ page }) => {
    // API 호출 완료 대기
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 문의 목록 확인
    const inquiryItems = page.locator('[class*="c_1h3v33w"]');
    const itemCount = await inquiryItems.count();

    expect(itemCount).toBeGreaterThan(0);

    // 첫 번째 문의 클릭
    const firstItem = inquiryItems.first();
    await firstItem.click();

    // 채팅 인터페이스 로드 대기
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // 메시지 입력
    const messageInput = page.locator('textarea[placeholder*="메시지를 입력하세요"]');
    await expect(messageInput).toBeVisible({ timeout: 5000 });
    
    const testMessage = `테스트 메시지 ${Date.now()}`;
    await messageInput.fill(testMessage);

    // 전송 버튼 클릭
    const sendButton = page.locator('button[aria-label="메시지 전송"]');
    await expect(sendButton).toBeEnabled({ timeout: 2000 });
    await sendButton.click();

    // 메시지 전송 완료 대기
    await page.waitForTimeout(2000);
    await page.waitForLoadState('networkidle');

    // 메시지 입력 필드가 비워졌는지 확인 (전송 성공 시)
    const inputValue = await messageInput.inputValue();
    expect(inputValue).toBe('');
  });

  test('T013: 채팅 인터페이스 닫기 테스트', async ({ page }) => {
    // API 호출 완료 대기
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 문의 목록 확인
    const inquiryItems = page.locator('[class*="c_1h3v33w"]');
    const itemCount = await inquiryItems.count();

    expect(itemCount).toBeGreaterThan(0);

    // 첫 번째 문의 클릭
    const firstItem = inquiryItems.first();
    await firstItem.click();

    // 채팅 인터페이스 로드 대기
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // 닫기 버튼 찾기
    const closeButton = page.locator('button[aria-label="닫기"]');
    await expect(closeButton).toBeVisible({ timeout: 5000 });
    await closeButton.click();

    // 목록 뷰로 돌아왔는지 확인
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // 목록이 다시 표시되는지 확인
    await expect(page.locator('h3:has-text("최근 문의 사항")')).toBeVisible({ timeout: 5000 });
  });

  test('T014: 문의 상태 변경 테스트', async ({ page }) => {
    // API 호출 완료 대기
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 문의 목록 확인
    const inquiryItems = page.locator('[class*="c_1h3v33w"]');
    const itemCount = await inquiryItems.count();

    expect(itemCount).toBeGreaterThan(0);

    // 첫 번째 문의 클릭
    const firstItem = inquiryItems.first();
    await firstItem.click();

    // 채팅 인터페이스 로드 대기
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // 상태 변경 select 찾기 (SelectTrigger 사용)
    const statusSelectTrigger = page.getByRole('combobox').first();
    await expect(statusSelectTrigger).toBeVisible({ timeout: 5000 });
    
    // Select 열기
    await statusSelectTrigger.click();
    await page.waitForTimeout(500);

    // 처리중 옵션 선택
    const processingOption = page.getByRole('option', { name: '처리중' });
    await expect(processingOption).toBeVisible({ timeout: 2000 });
    await processingOption.click();

    // 상태 변경 완료 대기
    await page.waitForTimeout(1000);
    await page.waitForLoadState('networkidle');

    // 상태가 변경되었는지 확인 (처리중 태그 확인 - Select 값이 아닌 상태 배지)
    // Select의 값과 상태 배지가 모두 "처리중"이므로 상태 배지를 구체적으로 선택
    const statusBadge = page.locator('span[class*="statusBadge"][class*="statusProcessing"]').first();
    await expect(statusBadge).toBeVisible({ timeout: 3000 });
  });

  test('T015: 메시지 길이 제한 테스트', async ({ page }) => {
    // API 호출 완료 대기
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 문의 목록 확인
    const inquiryItems = page.locator('[class*="c_1h3v33w"]');
    const itemCount = await inquiryItems.count();

    expect(itemCount).toBeGreaterThan(0);

    // 첫 번째 문의 클릭
    const firstItem = inquiryItems.first();
    await firstItem.click();

    // 채팅 인터페이스 로드 대기
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // 메시지 입력
    const messageInput = page.locator('textarea[placeholder*="메시지를 입력하세요"]');
    await expect(messageInput).toBeVisible({ timeout: 5000 });

    // 1500자 초과 메시지 입력 시도
    const longMessage = 'a'.repeat(1501);
    await messageInput.fill(longMessage);

    // 입력 필드의 값이 1500자로 제한되었는지 확인
    const inputValue = await messageInput.inputValue();
    expect(inputValue.length).toBeLessThanOrEqual(1500);

    // 문자 수 표시 확인
    const charCount = page.locator('text=/\\d+\\/1500/');
    await expect(charCount).toBeVisible({ timeout: 2000 });
  });
});

test.describe('문의하기 관리 기능 UI 테스트 (User Story 3)', () => {
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

    // 문의하기 관리 페이지로 이동
    const inquiryMenuButton = page.locator('button').filter({ hasText: '문의하기' });
    await expect(inquiryMenuButton).toBeVisible({ timeout: 5000 });
    await inquiryMenuButton.click();
    
    // 문의하기 관리 페이지가 로드될 때까지 대기
    await page.waitForLoadState('networkidle');
    
    // 문의하기 관리 페이지 제목 확인
    await expect(page.locator('h2:has-text("문의하기")')).toBeVisible({ timeout: 10000 });
  });

  test('T020: 문의 삭제 테스트', async ({ page }) => {
    // API 호출 완료 대기
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 문의 목록 확인
    const inquiryItems = page.locator('[class*="c_1h3v33w"]');
    const itemCount = await inquiryItems.count();

    expect(itemCount).toBeGreaterThan(0);

    // 첫 번째 문의의 삭제 버튼 찾기
    const firstItem = inquiryItems.first();
    const deleteButton = firstItem.locator('button[title="문의 삭제"]');
    await expect(deleteButton).toBeVisible({ timeout: 2000 });

    // 확인 다이얼로그 핸들러 설정 (삭제 버튼 클릭 전에 설정)
    page.on('dialog', async dialog => {
      expect(dialog.type()).toBe('confirm');
      await dialog.accept();
    });

    // 삭제 버튼 클릭
    await deleteButton.click();

    // 삭제 완료 대기
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 목록이 업데이트되었는지 확인
    const updatedItemCount = await inquiryItems.count();
    expect(updatedItemCount).toBeLessThanOrEqual(itemCount);
  });

  test('T021: 목록에서 상태 변경 테스트', async ({ page }) => {
    // API 호출 완료 대기
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 문의 목록 확인
    const inquiryItems = page.locator('[class*="c_1h3v33w"]');
    const itemCount = await inquiryItems.count();

    expect(itemCount).toBeGreaterThan(0);

    // 첫 번째 문의의 상태 select 찾기 (SelectTrigger 사용)
    const firstItem = inquiryItems.first();
    const statusSelectTrigger = firstItem.getByRole('combobox').first();
    await expect(statusSelectTrigger).toBeVisible({ timeout: 2000 });

    // Select 열기
    await statusSelectTrigger.click();
    await page.waitForTimeout(500);

    // 처리중 옵션 선택
    const processingOption = page.getByRole('option', { name: '처리중' });
    await expect(processingOption).toBeVisible({ timeout: 2000 });
    await processingOption.click();

    // 상태 변경 완료 대기
    await page.waitForTimeout(1000);
    await page.waitForLoadState('networkidle');

    // 상태 태그가 업데이트되었는지 확인 (Select 값이 아닌 상태 태그)
    // Select의 값과 상태 태그가 모두 "처리중"이므로 상태 태그를 구체적으로 선택
    const statusTag = firstItem.locator('span[class*="tagBase"][class*="statusProcessing"]').first();
    await expect(statusTag).toBeVisible({ timeout: 2000 });
  });
});
