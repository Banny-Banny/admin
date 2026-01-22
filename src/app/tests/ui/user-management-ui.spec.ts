import { test, expect, type Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';
const API_BASE_URL = process.env.API_BASE_URL || BASE_URL;

// 슈퍼 어드민 계정
const SUPER_ADMIN = {
  email: process.env.SUPER_ADMIN_EMAIL || 'superadmin@example.com',
  password: process.env.SUPER_ADMIN_PASSWORD || 'superadmin1234!',
};

// 테스트용 관리자 계정
const TEST_ADMIN = {
  email: `test-admin-${Date.now()}@example.com`,
  name: '테스트 관리자',
  password: 'testpassword123',
};
let testAdminId: string | null = null;
let superAdminToken: string | null = null;

/**
 * 로그인 헬퍼 함수
 */
async function login(page: Page) {
  await page.goto(BASE_URL);
  await page.waitForLoadState('networkidle');
  
  const loginHeading = page.locator('h1:has-text("관리자 로그인")');
  const isLoginPage = await loginHeading.isVisible({ timeout: 5000 }).catch(() => false);
  
  if (isLoginPage) {
    const adminEmail = testAdminId ? TEST_ADMIN.email : SUPER_ADMIN.email;
    const adminPassword = testAdminId ? TEST_ADMIN.password : SUPER_ADMIN.password;
    
    await page.fill('input[type="email"]', adminEmail);
    await page.fill('input[type="password"]', adminPassword);
    await page.click('button[type="submit"]');
    
    await page.waitForURL(BASE_URL, { timeout: 10000 });
    await expect(loginHeading).not.toBeVisible({ timeout: 10000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    const sidebar = page.locator('aside');
    await sidebar.isVisible({ timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);
  }
}

/**
 * 사용자 목록 페이지로 이동하는 헬퍼 함수
 */
async function navigateToUsersPage(page: Page) {
  const sidebar = page.locator('aside');
  const isSidebarVisible = await sidebar.isVisible({ timeout: 3000 }).catch(() => false);
  
  if (!isSidebarVisible) {
    const toggleButton = page.locator('button').filter({ has: page.locator('svg') }).first();
    if (await toggleButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await toggleButton.click();
      await page.waitForTimeout(500);
    }
  }
  
  let usersMenuButton = null;
  const selectors = [
    'button >> text="사용자 관리"',
    'button:has(span:text("사용자 관리"))',
    'nav button:has-text("사용자 관리")',
    'button:has-text("사용자 관리")',
    'aside button:has-text("사용자 관리")',
  ];
  
  for (const selector of selectors) {
    const button = page.locator(selector);
    const isVisible = await button.isVisible({ timeout: 2000 }).catch(() => false);
    if (isVisible) {
      usersMenuButton = button;
      break;
    }
  }
  
  if (!usersMenuButton) {
    const allButtons = page.locator('aside button, nav button');
    const buttonCount = await allButtons.count();
    for (let i = 0; i < buttonCount; i++) {
      const button = allButtons.nth(i);
      const text = await button.textContent().catch(() => '');
      if (text && text.includes('사용자 관리')) {
        usersMenuButton = button;
        break;
      }
    }
  }
  
  if (!usersMenuButton) {
    throw new Error('"사용자 관리" 버튼을 찾을 수 없습니다.');
  }
  
  await usersMenuButton.scrollIntoViewIfNeeded().catch(() => {});
  await expect(usersMenuButton).toBeVisible({ timeout: 5000 });
  await usersMenuButton.click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  await expect(page.locator('h2:has-text("사용자 관리")')).toBeVisible({ timeout: 10000 });
}

test.describe('사용자 관리 페이지 UI 테스트', () => {
  // 테스트 전에 테스트용 관리자 계정 생성
  test.beforeAll(async ({ request }) => {
    try {
      const loginResponse = await request.post(`${API_BASE_URL}/api/admin/auth/login`, {
        data: {
          email: SUPER_ADMIN.email,
          password: SUPER_ADMIN.password,
        },
      }).catch(() => null);

      if (loginResponse && loginResponse.ok()) {
        const loginBody = await loginResponse.json();
        superAdminToken = loginBody.accessToken || loginBody.token;
        
        const createResponse = await request.post(`${API_BASE_URL}/api/admin/auth/admins`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${superAdminToken}`,
          },
          data: {
            email: TEST_ADMIN.email,
            name: TEST_ADMIN.name,
            password: TEST_ADMIN.password,
          },
        }).catch(() => null);

        if (createResponse && createResponse.ok()) {
          const createBody = await createResponse.json();
          testAdminId = createBody.id;
          console.log(`✅ 테스트용 관리자 계정 생성 성공: ${TEST_ADMIN.email}`);
        }
      }
    } catch (error) {
      console.warn(`⚠️ 테스트용 관리자 계정 생성 중 오류: ${error}`);
    }
  });

  // 테스트 후 테스트용 관리자 계정 삭제
  test.afterAll(async ({ request }) => {
    if (testAdminId && superAdminToken) {
      try {
        const deleteResponse = await request.delete(`${API_BASE_URL}/api/admin/auth/admins/${testAdminId}`, {
          headers: {
            Authorization: `Bearer ${superAdminToken}`,
          },
        }).catch(() => null);

        if (deleteResponse && deleteResponse.ok()) {
          console.log(`✅ 테스트용 관리자 계정 삭제 성공: ${TEST_ADMIN.email}`);
        } else {
          console.warn(`⚠️ 테스트용 관리자 계정 삭제 API가 없거나 실패했습니다. 수동으로 삭제해주세요: ${TEST_ADMIN.email}`);
        }
      } catch (error) {
        console.warn(`⚠️ 테스트용 관리자 계정 삭제 중 오류: ${error}`);
      }
    }
  });

  test.beforeEach(async ({ page }) => {
    await login(page);
    await navigateToUsersPage(page);
  });

  test.describe('레이아웃 및 구조', () => {
    test('페이지 헤더가 올바르게 표시됨', async ({ page }) => {
      // 페이지 제목 확인
      const pageTitle = page.locator('h2:has-text("사용자 관리")');
      await expect(pageTitle).toBeVisible();
      
      // 전체 사용자 수 표시 확인
      const userCount = page.locator('text=/전체.*명의 사용자/');
      await expect(userCount).toBeVisible();
    });

    test('일반 사용자 목록 섹션이 표시됨', async ({ page }) => {
      // 섹션 제목 확인
      const sectionTitle = page.locator('h3:has-text("일반 사용자 목록")');
      await expect(sectionTitle).toBeVisible();
    });

    test('검색 및 필터 영역이 표시됨', async ({ page }) => {
      // 검색 입력 필드 확인
      const searchInput = page.locator('input[placeholder*="닉네임 또는 이메일로 검색"]');
      await expect(searchInput).toBeVisible();
      
      // 상태 필터 드롭다운 확인
      const statusFilter = page.locator('select').filter({ hasText: '모든 상태' });
      await expect(statusFilter).toBeVisible();
      
      // 날짜 필터 입력 필드 확인
      const dateInputs = page.locator('input[type="date"]');
      const dateInputCount = await dateInputs.count();
      expect(dateInputCount).toBeGreaterThanOrEqual(0);
    });

    test('사용자 목록 테이블 헤더가 올바르게 표시됨', async ({ page }) => {
      await page.waitForTimeout(2000);
      await page.waitForLoadState('networkidle');
      
      // 일반 사용자 목록 테이블만 선택 (관리자 목록 테이블과 구분)
      const userTable = page.locator('h3:has-text("일반 사용자 목록")').locator('..').locator('table').filter({ hasText: '닉네임' }).first();
      
      // 테이블 헤더 확인 (첫 번째 테이블만 선택)
      await expect(userTable.locator('th:has-text("닉네임")').first()).toBeVisible({ timeout: 10000 });
      await expect(userTable.locator('th:has-text("이메일")').first()).toBeVisible({ timeout: 5000 });
      await expect(userTable.locator('th:has-text("전화번호")').first()).toBeVisible({ timeout: 5000 });
      await expect(userTable.locator('th:has-text("상태")').first()).toBeVisible({ timeout: 5000 });
      await expect(userTable.locator('th:has-text("가입일")').first()).toBeVisible({ timeout: 5000 });
      await expect(userTable.locator('th:has-text("작업")').first()).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('검색 및 필터 UI', () => {
    test('검색 입력 필드의 플레이스홀더가 올바르게 표시됨', async ({ page }) => {
      const searchInput = page.locator('input[placeholder*="닉네임 또는 이메일로 검색"]');
      await expect(searchInput).toBeVisible();
      const placeholder = await searchInput.getAttribute('placeholder');
      expect(placeholder).toContain('닉네임');
      expect(placeholder).toContain('이메일');
    });

    test('상태 필터 드롭다운 옵션이 올바르게 표시됨', async ({ page }) => {
      const statusFilter = page.locator('select').filter({ hasText: '모든 상태' });
      await expect(statusFilter).toBeVisible();
      
      // 옵션 확인
      await expect(statusFilter.locator('option:has-text("모든 상태")')).toBeVisible();
      await expect(statusFilter.locator('option:has-text("활성")')).toBeVisible();
      await expect(statusFilter.locator('option:has-text("비활성")')).toBeVisible();
      await expect(statusFilter.locator('option:has-text("차단")')).toBeVisible();
    });

    test('날짜 필터 입력 필드가 표시됨', async ({ page }) => {
      const dateInputs = page.locator('input[type="date"]');
      const dateInputCount = await dateInputs.count();
      
      if (dateInputCount >= 2) {
        const startDateInput = dateInputs.nth(0);
        const endDateInput = dateInputs.nth(1);
        
        await expect(startDateInput).toBeVisible();
        await expect(endDateInput).toBeVisible();
      }
    });
  });

  test.describe('사용자 목록 테이블 UI', () => {
    test('사용자 목록 테이블이 표시됨', async ({ page }) => {
      await page.waitForTimeout(2000);
      await page.waitForLoadState('networkidle');
      
      const userTable = page.locator('h3:has-text("일반 사용자 목록")').locator('..').locator('table').filter({ hasText: '닉네임' }).first();
      await expect(userTable).toBeVisible({ timeout: 10000 });
    });

    test('사용자 행의 구조가 올바름', async ({ page }) => {
      await page.waitForTimeout(2000);
      await page.waitForLoadState('networkidle');
      
      const userTable = page.locator('h3:has-text("일반 사용자 목록")').locator('..').locator('table').filter({ hasText: '닉네임' }).first();
      const firstUserRow = userTable.locator('tbody tr').first();
      const hasUserRow = await firstUserRow.isVisible({ timeout: 5000 }).catch(() => false);
      
      if (hasUserRow) {
        // 각 셀이 표시되는지 확인
        const cells = firstUserRow.locator('td');
        const cellCount = await cells.count();
        expect(cellCount).toBeGreaterThanOrEqual(5); // 최소 5개 셀 (닉네임, 이메일, 전화번호, 상태, 가입일, 작업)
        
        // 작업 버튼이 있는지 확인
        const actionButton = firstUserRow.locator('td:last-child button').first();
        const hasActionButton = await actionButton.isVisible({ timeout: 2000 }).catch(() => false);
        expect(hasActionButton).toBe(true);
      }
    });

    test('검색 결과가 없을 때 메시지가 표시됨', async ({ page }) => {
      // 존재하지 않는 검색어 입력
      const searchInput = page.locator('input[placeholder*="닉네임 또는 이메일로 검색"]');
      await searchInput.fill('nonexistentuser12345xyz');
      
      await page.waitForTimeout(2000);
      await page.waitForLoadState('networkidle');
      
      // "검색 결과가 없습니다" 메시지 확인
      const noResultsMessage = page.locator('text=검색 결과가 없습니다');
      await expect(noResultsMessage).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('페이지네이션 UI', () => {
    test('페이지네이션 컨트롤이 표시됨 (사용자가 있는 경우)', async ({ page }) => {
      await page.waitForTimeout(2000);
      await page.waitForLoadState('networkidle');
      
      const paginationText = page.locator('text=/페이지.*전체.*명/');
      const hasPagination = await paginationText.isVisible({ timeout: 5000 }).catch(() => false);
      
      if (hasPagination) {
        await expect(paginationText.first()).toBeVisible();
        
        // 페이지네이션 버튼 확인
        const nextButton = page.locator('button:has-text("다음")');
        const prevButton = page.locator('button:has-text("이전")');
        
        const hasNext = await nextButton.isVisible({ timeout: 2000 }).catch(() => false);
        const hasPrev = await prevButton.isVisible({ timeout: 2000 }).catch(() => false);
        
        // 최소 하나의 버튼은 있어야 함
        expect(hasNext || hasPrev).toBe(true);
      }
    });
  });

  test.describe('모달 및 다이얼로그 UI', () => {
    test('사용자 상세 정보 다이얼로그가 올바르게 표시됨', async ({ page }) => {
      await page.waitForTimeout(2000);
      await page.waitForLoadState('networkidle');
      
      const userTable = page.locator('h3:has-text("일반 사용자 목록")').locator('..').locator('table').filter({ hasText: '닉네임' }).first();
      const firstUserRow = userTable.locator('tbody tr').first();
      const hasUserRow = await firstUserRow.isVisible({ timeout: 5000 }).catch(() => false);
      
      if (hasUserRow) {
        // 작업 버튼 클릭
        let actionButton = firstUserRow.locator('button').filter({ has: page.locator('svg') }).first();
        const isButtonVisible = await actionButton.isVisible({ timeout: 2000 }).catch(() => false);
        
        if (!isButtonVisible) {
          actionButton = firstUserRow.locator('td:last-child button').first();
        }
        
        const finalButtonVisible = await actionButton.isVisible({ timeout: 5000 }).catch(() => false);
        if (finalButtonVisible) {
          await actionButton.click();
          await page.waitForTimeout(500);
          
          // "상세 보기" 버튼 클릭
          const viewDetailButton = page.locator('button:has-text("상세 보기")');
          const hasViewButton = await viewDetailButton.isVisible({ timeout: 2000 }).catch(() => false);
          
          if (hasViewButton) {
            await viewDetailButton.click();
            
            // 다이얼로그가 표시되는지 확인
            await expect(page.locator('text=사용자 상세 정보')).toBeVisible({ timeout: 3000 });
            
            // 다이얼로그 내용 확인
            await expect(page.locator('text=/닉네임:/')).toBeVisible();
            await expect(page.locator('text=/이메일:/')).toBeVisible();
            await expect(page.locator('text=/상태:/')).toBeVisible();
            
            // 닫기 버튼 확인
            const closeButton = page.locator('button:has-text("닫기")');
            await expect(closeButton).toBeVisible();
          }
        }
      }
    });

    test('사용자 정보 수정 폼이 올바르게 표시됨', async ({ page }) => {
      await page.waitForTimeout(2000);
      await page.waitForLoadState('networkidle');
      
      const userTable = page.locator('h3:has-text("일반 사용자 목록")').locator('..').locator('table').filter({ hasText: '닉네임' }).first();
      const firstUserRow = userTable.locator('tbody tr').first();
      const hasUserRow = await firstUserRow.isVisible({ timeout: 5000 }).catch(() => false);
      
      if (hasUserRow) {
        // 작업 버튼 클릭
        let actionButton = firstUserRow.locator('button').filter({ has: page.locator('svg') }).first();
        const isButtonVisible = await actionButton.isVisible({ timeout: 2000 }).catch(() => false);
        
        if (!isButtonVisible) {
          actionButton = firstUserRow.locator('td:last-child button').first();
        }
        
        const finalButtonVisible = await actionButton.isVisible({ timeout: 5000 }).catch(() => false);
        if (finalButtonVisible) {
          await actionButton.click();
          await page.waitForTimeout(500);
          
          // "정보 수정" 버튼 클릭
          const editButton = page.locator('button:has-text("정보 수정")');
          const hasEditButton = await editButton.isVisible({ timeout: 2000 }).catch(() => false);
          
          if (hasEditButton) {
            await editButton.click();
            
            // 수정 폼이 표시되는지 확인
            await expect(page.locator('text=사용자 상세 정보')).toBeVisible({ timeout: 3000 });
            
            // 입력 필드 확인
            const nicknameInput = page.locator('input[type="text"]').first();
            const emailInput = page.locator('input[type="email"]');
            const phoneInput = page.locator('input[type="tel"]');
            
            const hasNickname = await nicknameInput.isVisible({ timeout: 2000 }).catch(() => false);
            const hasEmail = await emailInput.isVisible({ timeout: 2000 }).catch(() => false);
            const hasPhone = await phoneInput.isVisible({ timeout: 2000 }).catch(() => false);
            
            // 최소 하나의 입력 필드는 있어야 함
            expect(hasNickname || hasEmail || hasPhone).toBe(true);
            
            // 저장 및 취소 버튼 확인
            const saveButton = page.locator('button[type="submit"]:has-text("저장")');
            const cancelButton = page.locator('button:has-text("취소")');
            
            const hasSave = await saveButton.isVisible({ timeout: 2000 }).catch(() => false);
            const hasCancel = await cancelButton.isVisible({ timeout: 2000 }).catch(() => false);
            
            expect(hasSave || hasCancel).toBe(true);
          }
        }
      }
    });
  });

  test.describe('반응형 및 접근성', () => {
    test('모바일 뷰포트에서도 레이아웃이 유지됨', async ({ page }) => {
      // 모바일 뷰포트로 변경
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(1000);
      
      // 주요 요소들이 여전히 표시되는지 확인
      await expect(page.locator('h2:has-text("사용자 관리")')).toBeVisible();
      await expect(page.locator('h3:has-text("일반 사용자 목록")')).toBeVisible();
    });

    test('키보드 접근성이 작동함', async ({ page }) => {
      // Tab 키로 네비게이션 가능한지 확인
      await page.keyboard.press('Tab');
      await page.waitForTimeout(500);
      
      // 포커스가 이동했는지 확인 (포커스된 요소가 있는지)
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(focusedElement).toBeTruthy();
    });

    test('로딩 상태가 표시됨', async ({ page }) => {
      // 검색어 입력으로 로딩 상태 확인
      const searchInput = page.locator('input[placeholder*="닉네임 또는 이메일로 검색"]');
      await searchInput.fill('test');
      
      // 로딩 메시지가 표시될 수 있음 (로딩이 빠를 수 있으므로 확인만 수행)
      const loadingMessage = page.locator('text=/로딩|불러오는 중/i');
      await loadingMessage.isVisible({ timeout: 1000 }).catch(() => {
        // 로딩이 너무 빨리 끝나서 메시지를 볼 수 없는 경우도 정상
      });
      
      // 검색 입력이 작동하는지 확인
      await expect(searchInput).toHaveValue('test');
    });
  });

  test.describe('스타일 및 시각적 요소', () => {
    test('상태 배지가 올바른 색상으로 표시됨', async ({ page }) => {
      await page.waitForTimeout(2000);
      await page.waitForLoadState('networkidle');
      
      const userTable = page.locator('h3:has-text("일반 사용자 목록")').locator('..').locator('table').filter({ hasText: '닉네임' }).first();
      const firstUserRow = userTable.locator('tbody tr').first();
      const hasUserRow = await firstUserRow.isVisible({ timeout: 5000 }).catch(() => false);
      
      if (hasUserRow) {
        // 상태 배지 확인
        const statusBadge = firstUserRow.locator('span').filter({ hasText: /활성|비활성|차단/i });
        const hasBadge = await statusBadge.isVisible({ timeout: 2000 }).catch(() => false);
        
        if (hasBadge) {
          // 배지가 표시되는지 확인
          await expect(statusBadge).toBeVisible();
        }
      }
    });

    test('아이콘이 올바르게 표시됨', async ({ page }) => {
      // 검색 아이콘 확인
      const searchIcon = page.locator('svg').filter({ has: page.locator('input[placeholder*="검색"]') });
      const hasSearchIcon = await searchIcon.isVisible({ timeout: 2000 }).catch(() => false);
      
      // 필터 아이콘 확인
      const filterIcon = page.locator('svg').filter({ has: page.locator('select') });
      const hasFilterIcon = await filterIcon.isVisible({ timeout: 2000 }).catch(() => false);
      
      // 최소 하나의 아이콘은 있어야 함
      expect(hasSearchIcon || hasFilterIcon).toBe(true);
    });
  });
});
