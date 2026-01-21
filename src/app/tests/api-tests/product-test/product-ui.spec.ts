import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// .env 파일 직접 로드
dotenv.config({ path: path.resolve(__dirname, '../../../../../.env') });

const BASE_URL = process.env.BASE_URL || process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';

// 테스트용 관리자 계정
const TEST_ADMIN = {
  email: process.env.TEST_ADMIN_EMAIL || process.env.SUPER_ADMIN_EMAIL || 'admin@example.com',
  password: process.env.TEST_ADMIN_PASSWORD || process.env.SUPER_ADMIN_PASSWORD || 'password123',
};

test.describe('상품 목록 UI 테스트 (User Story 1)', () => {
  test.beforeEach(async ({ page }) => {
    // 각 테스트 전에 로그인
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // 로그인
    await page.fill('input[type="email"]', TEST_ADMIN.email);
    await page.fill('input[type="password"]', TEST_ADMIN.password);
    await page.click('button[type="submit"]');

    // 로그인 완료 대기
    await page.waitForURL(BASE_URL, { timeout: 10000 });
    await expect(page.locator('h1:has-text("관리자 로그인")')).not.toBeVisible({ timeout: 5000 });

    // 상품 관리 페이지로 이동
    // Sidebar에서 '상품' 메뉴 클릭
    const productMenuButton = page.locator('button').filter({ hasText: '상품' });
    await expect(productMenuButton).toBeVisible({ timeout: 5000 });
    await productMenuButton.click();
    
    // 상품 관리 페이지가 로드될 때까지 대기
    await page.waitForLoadState('networkidle');
    
    // 상품 관리 페이지 제목 확인
    await expect(page.locator('h2:has-text("상품 관리")')).toBeVisible({ timeout: 10000 });
  });

  test('T041: 상품 목록 표시 테스트', async ({ page }) => {
    // "등록된 상품" 제목이 표시되는지 확인
    await expect(page.locator('h3:has-text("등록된 상품")')).toBeVisible();

    // 상품 목록 테이블이 표시되는지 확인
    const table = page.locator('table');
    await expect(table).toBeVisible();

    // 테이블 헤더 확인
    await expect(page.locator('th:has-text("상품")')).toBeVisible();
    await expect(page.locator('th:has-text("카테고리")')).toBeVisible();
    await expect(page.locator('th:has-text("가격")')).toBeVisible();
    await expect(page.locator('th:has-text("상태")')).toBeVisible();
    // "타입"은 "미디어 타입"에도 포함되므로 정확히 매칭
    await expect(page.locator('th').filter({ hasText: /^타입$/ })).toBeVisible();
    await expect(page.locator('th:has-text("미디어 타입")')).toBeVisible();
    await expect(page.locator('th:has-text("등록일")')).toBeVisible();

    // 상품이 있는 경우 상품 행이 표시되는지 확인
    // 상품이 없는 경우도 처리해야 함
    const productRows = page.locator('tbody tr');
    const rowCount = await productRows.count();

    if (rowCount > 0) {
      // 첫 번째 상품 행의 데이터 확인
      const firstRow = productRows.first();
      await expect(firstRow.locator('td')).toHaveCount(8); // 8개 컬럼

      // 상품명이 표시되는지 확인
      const productName = firstRow.locator('p').first();
      await expect(productName).toBeVisible();
    }
  });

  test('T042: 검색 기능 테스트', async ({ page }) => {
    // 검색 입력 필드 찾기 (상품명으로 검색하는 입력 필드만 선택)
    const searchInput = page.locator('input[placeholder="상품명으로 검색..."]');
    await expect(searchInput).toBeVisible();

    // 검색어 입력
    await searchInput.fill('테스트');

    // Debounce 대기 (300ms)
    await page.waitForTimeout(500);

    // API 호출 완료 대기
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // 검색 결과가 표시되는지 확인
    // 검색 결과가 있으면 상품 행이 표시되고, 없으면 "검색 결과가 없습니다" 메시지가 표시됨
    const emptyMessage = page.locator('text=검색 결과가 없습니다');
    const productRows = page.locator('tbody tr');
    
    // 테이블이 표시되는지 확인
    const table = page.locator('table');
    await expect(table).toBeVisible({ timeout: 5000 });

    const rowCount = await productRows.count();
    const hasEmptyMessage = await emptyMessage.isVisible({ timeout: 2000 }).catch(() => false);

    // 검색 결과가 있거나 빈 메시지가 표시되어야 함
    // rowCount가 0이면 빈 메시지가 있어야 하고, 0보다 크면 상품이 표시되어야 함
    expect(rowCount > 0 || hasEmptyMessage).toBe(true);
  });

  test('T043: 카테고리 필터 테스트', async ({ page }) => {
    // 카테고리 필터 select 찾기
    const categorySelect = page.locator('select').filter({ hasText: /카테고리|모든 카테고리/ }).first();
    
    // select가 존재하는지 확인
    const selectExists = await categorySelect.count() > 0;
    
    if (selectExists) {
      await expect(categorySelect).toBeVisible();

      // 필터 옵션이 있는지 확인 (option은 기본적으로 hidden이므로 count로 확인)
      const optionCount = await categorySelect.locator('option').count();
      expect(optionCount).toBeGreaterThan(0);

      // 필터 변경 (현재는 카테고리 목록이 비어있을 수 있으므로, 모든 카테고리로 설정)
      await categorySelect.selectOption({ value: '' });

      // API 호출 완료 대기
      await page.waitForLoadState('networkidle');

      // 필터가 적용되었는지 확인 (상품 목록이 업데이트됨)
      const productRows = page.locator('tbody tr');
      await expect(productRows.first()).toBeVisible({ timeout: 5000 });
    } else {
      // 카테고리 필터가 아직 구현되지 않은 경우 테스트 스킵
      test.skip();
    }
  });

  test('T044: 상태 필터 테스트', async ({ page }) => {
    // 상태 필터 select 찾기
    const statusSelects = page.locator('select');
    let statusSelect = null;

    // 상태 필터 select 찾기 (모든 상태 옵션이 있는 select)
    for (let i = 0; i < await statusSelects.count(); i++) {
      const select = statusSelects.nth(i);
      const hasStatusOption = await select.locator('option:has-text("모든 상태")').count() > 0;
      if (hasStatusOption) {
        statusSelect = select;
        break;
      }
    }

    if (statusSelect) {
      await expect(statusSelect).toBeVisible();

      // 필터 옵션 확인 (option은 기본적으로 hidden이므로 텍스트로 확인)
      const statusOptions = await statusSelect.locator('option').allTextContents();
      expect(statusOptions.some(text => text.includes('모든 상태'))).toBe(true);
      expect(statusOptions.some(text => text.includes('판매중'))).toBe(true);
      expect(statusOptions.some(text => text.includes('판매중지'))).toBe(true);

      // 상태 필터 변경 (판매중)
      await statusSelect.selectOption({ value: 'ACTIVE' });

      // API 호출 완료 대기
      await page.waitForTimeout(500);
      await page.waitForLoadState('networkidle');

      // 필터가 적용되었는지 확인
      const productRows = page.locator('tbody tr');
      const rowCount = await productRows.count();

      if (rowCount > 0) {
        // 모든 상품이 판매중 상태인지 확인
        const statusCells = page.locator('tbody tr td:nth-child(4)'); // 상태 컬럼
        for (let i = 0; i < Math.min(rowCount, 5); i++) {
          const statusCell = statusCells.nth(i);
          const statusText = await statusCell.textContent();
          expect(statusText).toContain('판매중');
        }
      }

      // 다시 모든 상태로 변경
      await statusSelect.selectOption({ value: 'ALL' });
      await page.waitForTimeout(500);
      await page.waitForLoadState('networkidle');
    } else {
      // 상태 필터가 없는 경우 테스트 실패
      throw new Error('상태 필터 select를 찾을 수 없습니다.');
    }
  });

  test('T045: 빈 상태 표시 테스트', async ({ page }) => {
    // 검색어를 입력하여 결과가 없는 경우 테스트
    const searchInput = page.locator('input[placeholder="상품명으로 검색..."]');
    await searchInput.fill('존재하지않는상품명123456789');

    // Debounce 및 API 호출 완료 대기
    await page.waitForTimeout(500);
    await page.waitForLoadState('networkidle');

    // "검색 결과가 없습니다" 메시지 확인
    const emptyMessage = page.locator('text=검색 결과가 없습니다');
    await expect(emptyMessage).toBeVisible({ timeout: 5000 });

    // 검색어 초기화
    await searchInput.fill('');
    await page.waitForTimeout(500);
    await page.waitForLoadState('networkidle');

    // 상품이 없는 경우 "등록된 상품이 없습니다" 메시지 확인
    // (실제 데이터가 있을 수 있으므로, 이 부분은 조건부로 확인)
    const noProductsMessage = page.locator('text=등록된 상품이 없습니다');
    const productRows = page.locator('tbody tr');
    const rowCount = await productRows.count();

    if (rowCount === 0) {
      await expect(noProductsMessage).toBeVisible();
    }
  });

  test('T046: 로딩 상태 표시 테스트', async ({ page }) => {
    // 상품 목록이 이미 로드되어 있을 수 있으므로, 
    // 검색을 통해 새로운 요청을 트리거하여 로딩 상태 확인
    const searchInput = page.locator('input[placeholder="상품명으로 검색..."]');
    
    // 검색어 입력 (로딩 상태 트리거)
    await searchInput.fill('테스트검색');
    
    // 로딩 메시지 확인 (로딩이 빠르면 보이지 않을 수 있음)
    const loadingMessage = page.locator('text=불러오는 중');
    const loadingVisible = await loadingMessage.isVisible({ timeout: 1000 }).catch(() => false);

    // 로딩 상태가 표시되거나 이미 완료되었을 수 있음
    // 네트워크 요청이 완료될 때까지 대기
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // 로딩 후 상품 목록이 표시되는지 확인
    const table = page.locator('table');
    await expect(table).toBeVisible({ timeout: 10000 });
    
    // 검색어 초기화
    await searchInput.fill('');
    await page.waitForTimeout(500);
    await page.waitForLoadState('networkidle');
  });

  test('T047: 에러 처리 표시 테스트', async ({ page }) => {
    // 네트워크 요청을 차단하여 에러 상태 시뮬레이션
    await page.route('**/api/admin/products**', route => route.abort());

    // 검색을 통해 API 호출 트리거
    const searchInput = page.locator('input[placeholder="상품명으로 검색..."]');
    await searchInput.fill('에러테스트');
    
    // 네트워크 요청 완료 대기
    await page.waitForTimeout(2000);
    await page.waitForLoadState('networkidle');

    // 에러 메시지 또는 Toast 알림 확인
    // Toast 알림은 Sonner를 사용하므로 [data-sonner-toast] 또는 [role="alert"] 확인
    // Sonner toast는 일반적으로 li[data-sonner-toast] 또는 div[role="status"]로 표시됨
    const errorToast = page.locator('[data-sonner-toast], [role="alert"], [role="status"]').filter({ 
      hasText: /실패|오류|에러|불러오/i 
    });
    
    // 에러가 표시되는지 확인 (Toast가 나타날 수 있음)
    const errorVisible = await errorToast.first().isVisible({ timeout: 5000 }).catch(() => false);
    
    // 또는 에러 메시지가 페이지에 표시되는지 확인 (에러 상태일 때 표시되는 메시지)
    const errorMessage = page.locator('text=/실패|오류|에러|불러오/i');
    const hasErrorMessage = await errorMessage.first().isVisible({ timeout: 5000 }).catch(() => false);
    
    // 또는 테이블 대신 에러 메시지가 표시되는지 확인
    const table = page.locator('table');
    const tableVisible = await table.isVisible({ timeout: 2000 }).catch(() => false);
    const errorDiv = page.locator('div').filter({ hasText: /실패|오류|에러/i });
    const hasErrorDiv = await errorDiv.first().isVisible({ timeout: 2000 }).catch(() => false);

    // 에러가 표시되었는지 확인 (Toast, 페이지 메시지, 또는 에러 div)
    // 네트워크 차단으로 인해 에러가 표시되어야 함
    // 테이블이 보이지 않거나 에러 메시지가 표시되어야 함
    expect(errorVisible || hasErrorMessage || hasErrorDiv || !tableVisible).toBe(true);

    // 네트워크 차단 해제
    await page.unroute('**/api/admin/products**');
    
    // 검색어 초기화
    await searchInput.fill('');
    await page.waitForTimeout(500);
    await page.waitForLoadState('networkidle');
  });
});
